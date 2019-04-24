"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process = require("child_process");
const path = require("path");
const os = require("os");
const fs = require("fs-extra");
const Throttle = require("promise-parallel-throttle");
const log = require("./log");
const Haxe_1 = require("./Haxe");
class KhabindOptions {
    constructor() {
        this.forceCache = false;
    }
}
exports.KhabindOptions = KhabindOptions;
class KhabindLib {
}
exports.KhabindLib = KhabindLib;
async function generateBindings(libRoot, bindOpts, options, korehl) {
    return new Promise(async (resolve, reject) => {
        if (options.target != 'krom' && !options.target.endsWith('html5') && !korehl) {
            log.info(`WARNING: Auto-binding library "${path.basename(libRoot)}" to Haxe for target ${options.target} is not supported.`);
            return;
        }
        log.info(`Generating bindings for: ${path.basename(libRoot)}`);
        // Evaluate file modified times to determine what needs to be recompiled
        let recompileAll = false;
        let rebuildBindings = false;
        let khafile = path.resolve(libRoot, 'khafile.js');
        let webidlFile = path.resolve(libRoot, bindOpts.idlFile);
        let jsLibrary = path.resolve(libRoot, 'khabind', bindOpts.nativeLib + '.js');
        if (fs.existsSync(jsLibrary)) {
            if (fs.statSync(khafile).mtime > fs.statSync(jsLibrary).mtime) {
                recompileAll = true; // khabind.json file has been updated, recompile everything
            }
            else if (fs.statSync(webidlFile).mtime > fs.statSync(jsLibrary).mtime) {
                rebuildBindings = true; // webidl bindings have been update, recompile bindings
            }
        }
        else {
            if (bindOpts.forceCache) {
                console.error('ERROR: `forceCache` is set to `true`, but cached JavaScript library does not exist. Cannot build for JavaScript target. Set `forceCache` to false to rebuild library using Emscripten.');
                console.info('Failed to generate bindings for: ' + path.basename(libRoot));
                reject();
            }
            else {
                rebuildBindings = true;
            }
        }
        // Genreate HL/JS Haxe bindings
        if (recompileAll || rebuildBindings) {
            // Call Haxe macro to generate bindings
            await Haxe_1.executeHaxe(libRoot, options.haxe, [
                '-cp', path.resolve(options.kha, 'Sources'),
                '-cp', path.resolve(options.kha, 'Tools', 'webidl'),
                '--macro', `kha.internal.WebIdlBinder.generate('${JSON.stringify(bindOpts)}', ${recompileAll})`,
            ]);
        }
        // Create a Korefile for HL/C builds of the library
        var korefile = path.resolve(libRoot, 'korefile.js');
        var content = `let project = new Project('${path.basename(libRoot)}', __dirname);\n`;
        content += `project.addFile('${bindOpts.sourcesDir}/**');\n`;
        content += `project.addIncludeDir('${bindOpts.sourcesDir}');\n`;
        content += `project.addFile('khabind/${bindOpts.nativeLib}.cpp');\n`;
        content += 'resolve(project);\n';
        fs.writeFile(korefile, content);
        if (bindOpts.forceCache)
            log.info('    Using cache ( forced )');
        // Compile C++ library to JavaScript for Krom/HTML5
        if ((options.target == 'krom' || options.target.endsWith('html5')) && !bindOpts.forceCache) {
            let emsdk = "";
            let emcc = "";
            function ensureEmscripten() {
                if (emsdk != "")
                    return;
                emsdk = process.env.EMSCRIPTEN;
                if (emsdk == undefined) {
                    log.error('ERROR: EMSCRIPTEN environment variable not set. Cannot compile C++ library for Javascript.');
                    log.error('Failed to compile bindings for: ' + path.basename(libRoot));
                    reject();
                }
                emcc = path.join(emsdk, 'emcc');
            }
            let optimizationArg = bindOpts.emccOptimizationLevel ? '-O' + bindOpts.emccOptimizationLevel : '-O2';
            let sourcesDir = path.resolve(libRoot, bindOpts.sourcesDir);
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
            addSources(path.resolve(libRoot, 'khabind'));
            // Compiler helper function
            function compileSource(file) {
                return new Promise(async (resolve, reject) => {
                    let needsRecompile = false;
                    let relativeSource = path.relative(libRoot, file);
                    let relativeTargetFile = relativeSource.substr(0, file.length - path.extname(file).length) + ".bc";
                    let targetFile = path.resolve(libRoot, 'khabind', 'bytecode', relativeTargetFile);
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
                        log.info(`    Compiling ${path.relative(libRoot, file)}`);
                        let stderr = "";
                        let run = child_process.spawn(emcc, [optimizationArg, `-I${sourcesDir}`, '-c', file, '-o', targetFile], { cwd: libRoot });
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
            if (invalidateCache || !fs.existsSync(path.join(libRoot, 'khabind', bindOpts.nativeLib + '.js'))) {
                log.info('    Linking Javascript Library');
                ensureEmscripten();
                let args = [
                    optimizationArg,
                    '-s', 'EXPORT_NAME=' + bindOpts.nativeLib, '-s', 'MODULARIZE=1', '-s', 'SINGLE_FILE=1', '-s', 'WASM=0',
                    ...bindOpts.emccArgs.reduce((a, b) => { return a + ' ' + b; }).split(" "),
                    '-o', path.join('khabind', bindOpts.nativeLib) + '.js'
                ];
                log.info('    running emcc: emcc ' + args.join(' '));
                let output = child_process.spawnSync(emcc, [...targetFiles, ...args], { cwd: libRoot });
                if (output.stderr.toString() !== '') {
                    log.error(output.stderr.toString());
                }
                if (output.stdout.toString() !== '') {
                    log.info(output.stdout.toString());
                }
            }
        } // if (options.target == 'krom' || options.target.endsWith('html5'))
        log.info(`Done generating bindings for: ${path.basename(libRoot)}`);
        resolve();
    });
}
exports.generateBindings = generateBindings;
//# sourceMappingURL=Khabind.js.map