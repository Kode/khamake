"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process = require("child_process");
const path = require("path");
const os = require("os");
const fs = require("fs-extra");
const Throttle = require("promise-parallel-throttle");
const log = require("./log");
const Haxe_1 = require("./Haxe");
async function generateBindings(lib, bindOpts, options, project) {
    if (options.target != 'krom' && !options.target.endsWith('html5') && !options.target.endsWith('-hl')) {
        log.info(`WARNING: Cannot bind library "${path.basename(lib.libroot)}" to Haxe for target ${options.target}.`);
        return;
    }
    log.info(`Generating bindings for: ${path.basename(lib.libroot)}`);
    let webidlSourcePath = path.resolve(options.kha, 'Tools', 'webidl');
    // Evaluate file modified times to determine what needs to be recompiled
    let recompileAll = false;
    let rebuildBindings = false;
    let khabindFile = path.resolve(lib.libroot, 'khabind.json');
    let webidlFile = path.resolve(lib.libroot, bindOpts.idlFile);
    let jsLibrary = path.resolve(lib.libroot, 'khabind', bindOpts.nativeLib + '.js');
    if (fs.existsSync(jsLibrary)) {
        if (fs.statSync(khabindFile).mtime > fs.statSync(jsLibrary).mtime) {
            recompileAll = true; // khabind.json file has been updated, recompile everything
        }
        else if (fs.statSync(webidlFile).mtime > fs.statSync(jsLibrary).mtime) {
            rebuildBindings = true; // webidl bindings have been update, recompile bindings
        }
    }
    else {
        rebuildBindings = true;
    }
    // Genreate HL/JS Haxe bindings
    if (recompileAll || rebuildBindings) {
        // Call Haxe macro to generate bindings
        await Haxe_1.executeHaxe(lib.libroot, options.haxe, [
            '-cp', path.resolve(options.kha, 'Sources'),
            '-cp', webidlSourcePath,
            '--macro', 'kha.internal.WebIdlBinder.generate()',
        ]);
    }
    // Add webidl library to project sources
    if (project.sources.indexOf(webidlSourcePath) == -1)
        project.sources.push(webidlSourcePath);
    // Create a Korefile for HL/C builds of the library
    var korefile = path.resolve(lib.libroot, 'korefile.js');
    var content = `let project = new Project('${path.basename(lib.libroot)}', __dirname);\n`;
    content += `project.addFile('${bindOpts.sourcesDir}/**');\n`;
    content += `project.addIncludeDir('${bindOpts.sourcesDir}');\n`;
    content += `project.addFile('khabind/${bindOpts.nativeLib}.cpp');\n`;
    content += 'resolve(project);\n';
    fs.writeFile(korefile, content);
    // Compile C++ library to JavaScript for Krom/HTML5
    if (options.target == 'krom' || options.target.endsWith('html5')) {
        let emsdk = "";
        let emcc = "";
        function ensureEmscripten() {
            if (emsdk != "")
                return;
            emsdk = process.env.EMSCRIPTEN;
            if (emsdk == undefined) {
                let msg = 'EMSCRIPTEN environment variable not set cannot compile C++ library for Javascript';
                log.error(msg);
                throw msg;
            }
            emcc = path.join(emsdk, 'emcc');
        }
        let optimizationArg = bindOpts.emccOptimizationLevel ? '-O' + bindOpts.emccOptimizationLevel : '-O2';
        let sourcesDir = path.resolve(lib.libroot, bindOpts.sourcesDir);
        let sourceFiles = [];
        let targetFiles = [];
        let invalidateCache = false;
        // Source scan helper function
        function addSources(dir) {
            if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory())
                return;
            for (let item of fs.readdirSync(dir)) {
                if (fs.statSync(path.resolve(dir, item)).isDirectory()) {
                    addSources(path.resolve(dir, item));
                }
                else if (item.endsWith('.cpp') || item.endsWith('.c')) {
                    sourceFiles.push(path.resolve(dir, item));
                }
            }
        }
        // Search source dirs for C/C++ files
        addSources(sourcesDir);
        addSources(path.resolve(lib.libroot, 'khabind'));
        // Compiler helper function
        function compileSource(file) {
            return new Promise(async (resolve, reject) => {
                let needsRecompile = false;
                let relativeSource = path.relative(lib.libroot, file);
                let relativeTargetFile = relativeSource.substr(0, file.length - path.extname(file).length) + ".bc";
                let targetFile = path.resolve(lib.libroot, 'khabind', 'bytecode', relativeTargetFile);
                fs.ensureDirSync(path.dirname(targetFile));
                targetFiles.push(targetFile);
                // Check file modifications times to determine whether to recompile source file
                if (await fs.pathExists(targetFile)) {
                    if (recompileAll || (await fs.stat(file)).mtime.getTime() > (await fs.stat(targetFile)).mtime.getTime()) {
                        ensureEmscripten();
                        needsRecompile = invalidateCache = true;
                    }
                }
                else {
                    ensureEmscripten();
                    needsRecompile = invalidateCache = true;
                }
                // Compile source file using Emscripten
                if (needsRecompile) {
                    log.info(`    Compiling ${path.relative(lib.libroot, file)}`);
                    let stderr = "";
                    let run = child_process.spawn(emcc, [optimizationArg, `-I${sourcesDir}`, '-c', file, '-o', targetFile], { cwd: lib.libroot });
                    run.stderr.on('data', function (data) {
                        stderr += data.toString();
                    });
                    run.on('close', function (code) {
                        if (stderr != "") {
                            reject(stderr);
                        }
                        else {
                            resolve();
                        }
                    });
                }
                else {
                    resolve();
                }
            });
        }
        // Run compiler jobs
        let jobs = sourceFiles.map(file => () => compileSource(file));
        await Throttle.all(jobs, {
            maxInProgress: os.cpus().length,
            failFast: true
        }).catch(err => {
            log.info(err);
        });
        // Link bytecode to final JavaScript library
        if (invalidateCache || !fs.existsSync(path.join(lib.libroot, 'khabind', bindOpts.nativeLib + '.js'))) {
            log.info('    Linking Javascript Library');
            ensureEmscripten();
            let args = [
                optimizationArg,
                '-s', 'EXPORT_NAME=' + bindOpts.nativeLib,
                '-o', path.join('khabind', bindOpts.nativeLib) + '.js',
                ...bindOpts.emccArgs.reduce((a, b) => { return a + ' ' + b; }).split(" "),
            ];
            let output = child_process.spawnSync(emcc, [...targetFiles, ...args], { cwd: lib.libroot });
            if (output.stderr.toString() !== '') {
                log.error(output.stderr.toString());
            }
            if (output.stdout.toString() !== '') {
                log.info(output.stdout.toString());
            }
        }
        // Add JavaScript library to project asset list
        project.addAssets(path.resolve(lib.libroot, 'khabind', bindOpts.nativeLib + '.js'), { name: '_khabind_' + bindOpts.nativeLib + '_js' });
    } // if (options.target == 'krom' || options.target.endsWith('html5'))
    log.info(`Done generating bindings for: ${lib.libroot}`);
}
exports.generateBindings = generateBindings;
//# sourceMappingURL=WebidlBinder.js.map