"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.close = exports.run = exports.api = void 0;
const child_process = require("child_process");
const fs = require("fs-extra");
const path = require("path");
const exec_1 = require("./exec");
const korepath = require("./korepath");
const log = require("./log");
const Platform_1 = require("./Platform");
const ProjectFile_1 = require("./ProjectFile");
const AssetConverter_1 = require("./AssetConverter");
const HaxeCompiler_1 = require("./HaxeCompiler");
const ShaderCompiler_1 = require("./ShaderCompiler");
const DebugHtml5Exporter_1 = require("./Exporters/DebugHtml5Exporter");
const EmptyExporter_1 = require("./Exporters/EmptyExporter");
const FlashExporter_1 = require("./Exporters/FlashExporter");
const Html5Exporter_1 = require("./Exporters/Html5Exporter");
const Html5WorkerExporter_1 = require("./Exporters/Html5WorkerExporter");
const JavaExporter_1 = require("./Exporters/JavaExporter");
const KoreExporter_1 = require("./Exporters/KoreExporter");
const KoreHLExporter_1 = require("./Exporters/KoreHLExporter");
const KromExporter_1 = require("./Exporters/KromExporter");
const NodeExporter_1 = require("./Exporters/NodeExporter");
const PlayStationMobileExporter_1 = require("./Exporters/PlayStationMobileExporter");
const WpfExporter_1 = require("./Exporters/WpfExporter");
const HaxeProject_1 = require("./HaxeProject");
const Icon = require("./Icon");
let lastAssetConverter;
let lastShaderCompiler;
let lastHaxeCompiler;
function fixName(name) {
    name = name.replace(/[-@\ \.\/\\]/g, '_');
    if (name[0] === '0' || name[0] === '1' || name[0] === '2' || name[0] === '3' || name[0] === '4'
        || name[0] === '5' || name[0] === '6' || name[0] === '7' || name[0] === '8' || name[0] === '9') {
        name = '_' + name;
    }
    return name;
}
function safeName(name) {
    return name.replace(/[^A-z0-9\-\_]/g, '-');
}
function createKorefile(name, exporter, options, targetOptions, libraries, cdefines, cflags, cppflags, stackSize, version, id, korehl, icon) {
    let out = '';
    out += 'let fs = require(\'fs\');\n';
    out += 'let path = require(\'path\');\n';
    out += 'let project = new Project(\'' + name + '\');\n';
    if (version) {
        out += 'project.version = \'' + version + '\';\n';
    }
    if (id) {
        out += 'project.id = \'' + id + '\';\n';
    }
    if (icon != null)
        out += 'project.icon = \'' + icon + '\';\n';
    for (let cdefine of cdefines) {
        out += 'project.addDefine(\'' + cdefine + '\');\n';
    }
    for (let cppflag of cppflags) {
        out += 'project.addCppFlag(\'' + cppflag + '\');\n';
    }
    for (let cflag of cflags) {
        out += 'project.addCFlag(\'' + cflag + '\');\n';
    }
    out += 'project.addDefine(\'HXCPP_API_LEVEL=400\');\n';
    out += 'project.addDefine(\'HXCPP_DEBUG\', \'Debug\');\n';
    if (!options.slowgc) {
        out += 'project.addDefine(\'HXCPP_GC_GENERATIONAL\');\n';
    }
    if (targetOptions) {
        let koreTargetOptions = {};
        for (let option in targetOptions) {
            koreTargetOptions[option] = targetOptions[option];
        }
        out += 'project.targetOptions = ' + JSON.stringify(koreTargetOptions) + ';\n';
    }
    out += 'project.setDebugDir(\'' + path.relative(options.from, path.join(options.to, exporter.sysdir())).replace(/\\/g, '/') + '\');\n';
    let buildpath = path.relative(options.from, path.join(options.to, exporter.sysdir() + '-build')).replace(/\\/g, '/');
    if (buildpath.startsWith('..'))
        buildpath = path.resolve(path.join(options.from.toString(), buildpath));
    out += 'await project.addProject(\'' + path.join(options.kha, 'Kore').replace(/\\/g, '/') + '\');\n';
    out += 'await project.addProject(\'' + buildpath.replace(/\\/g, '/') + '\');\n';
    if (korehl)
        out += 'await project.addProject(\'' + path.join(options.kha, 'Backends', 'Kore-HL').replace(/\\/g, '/') + '\');\n';
    else
        out += 'await project.addProject(\'' + path.join(options.kha, 'Backends', 'Kore-hxcpp').replace(/\\/g, '/') + '\');\n';
    for (let lib of libraries) {
        let libPath = lib.libpath.replace(/\\/g, '/');
        out += 'if (fs.existsSync(path.join(\'' + libPath + '\', \'kfile.js\')) || fs.existsSync(path.join(\'' + libPath + '\', \'kincfile.js\')) || fs.existsSync(path.join(\'' + libPath + '\', \'korefile.js\'))) {\n';
        out += '\tawait project.addProject(\'' + libPath + '\');\n';
        out += '}\n';
    }
    if (stackSize) {
        out += 'project.stackSize = ' + stackSize + ';\n';
    }
    out += 'project.flatten();\n';
    out += 'resolve(project);\n';
    return out;
}
function runKmake(options) {
    return new Promise((resolve, reject) => {
        const child = child_process.spawn(path.join(korepath.get(), 'kmake' + (0, exec_1.sys)()), options);
        child.stdout.on('data', (data) => {
            const str = data.toString();
            log.info(str, false);
        });
        child.stderr.on('data', (data) => {
            const str = data.toString();
            log.error(str, false);
        });
        child.on('error', (err) => {
            log.error('Could not start kmake.');
            reject();
        });
        child.on('close', (code) => {
            if (code === 0) {
                resolve();
            }
            else {
                reject();
            }
        });
    });
}
async function exportProjectFiles(name, resourceDir, options, exporter, kore, korehl, icon, libraries, targetOptions, defines, cdefines, cflags, cppflags, stackSize, version, id) {
    if (options.haxe !== '') {
        let haxeOptions = exporter.haxeOptions(name, targetOptions, defines);
        haxeOptions.defines.push('kha');
        haxeOptions.defines.push('kha_version=1810');
        haxeOptions.safeName = safeName(haxeOptions.name);
        haxeOptions.defines.push('kha_project_name=' + haxeOptions.name);
        if (options.livereload)
            haxeOptions.defines.push('kha_live_reload');
        if (options.debug && haxeOptions.parameters.indexOf('-debug') < 0) {
            haxeOptions.parameters.push('-debug');
        }
        (0, HaxeProject_1.writeHaxeProject)(options.to, !options.noproject, haxeOptions);
        if (!options.nohaxe) {
            let compiler = new HaxeCompiler_1.HaxeCompiler(options.to, haxeOptions.to, haxeOptions.realto, resourceDir, options.haxe, 'project-' + exporter.sysdir() + '.hxml', haxeOptions.sources, exporter.sysdir(), options.watchport, options.livereload, options.port);
            lastHaxeCompiler = compiler;
            try {
                await compiler.run(options.watch);
            }
            catch (error) {
                return Promise.reject(error);
            }
        }
        for (let callback of ProjectFile_1.Callbacks.postHaxeCompilation) {
            callback();
        }
        await exporter.export(name, targetOptions, haxeOptions);
    }
    let buildDir = path.join(options.to, exporter.sysdir() + '-build');
    if (options.haxe !== '' && kore && !options.noproject) {
        // If target is a Kore project, generate additional project folders here.
        // generate the kfile.js
        fs.copySync(path.join(__dirname, '..', 'Data', 'hxcpp', 'kfile.js'), path.join(buildDir, 'kfile.js'), { overwrite: true });
        fs.writeFileSync(path.join(options.to, 'kfile.js'), createKorefile(name, exporter, options, targetOptions, libraries, cdefines, cflags, cppflags, stackSize, version, id, false, icon));
        // Similar to khamake.js -> main.js -> run(...)
        // This will create additional project folders for the target,
        // e.g. 'build/pi-build'
        try {
            const kmakeOptions = ['--from', options.from, '--to', buildDir, '--kfile', path.resolve(options.to, 'kfile.js'), '-t', koreplatform(options.target), '--noshaders',
                '--graphics', options.graphics, '--arch', options.arch, '--audio', options.audio, '--vr', options.vr, '-v', options.visualstudio
            ];
            if (options.nosigning) {
                kmakeOptions.push('--nosigning');
            }
            if (options.debug) {
                kmakeOptions.push('--debug');
            }
            if (options.run) {
                kmakeOptions.push('--run');
            }
            if (options.compile) {
                kmakeOptions.push('--compile');
            }
            await runKmake(kmakeOptions);
            for (let callback of ProjectFile_1.Callbacks.postCppCompilation) {
                callback();
            }
            log.info('Done.');
            return name;
        }
        catch (error) {
            if (error) {
                log.error('Error: ' + error);
            }
            else {
                log.error('Error.');
            }
            process.exit(1);
            return name;
        }
    }
    else if (options.haxe !== '' && korehl && !options.noproject) {
        fs.copySync(path.join(__dirname, '..', 'Data', 'hl', 'kore_sources.c'), path.join(buildDir, 'kore_sources.c'), { overwrite: true });
        fs.copySync(path.join(__dirname, '..', 'Data', 'hl', 'kfile.js'), path.join(buildDir, 'kfile.js'), { overwrite: true });
        fs.writeFileSync(path.join(options.to, 'kfile.js'), createKorefile(name, exporter, options, targetOptions, libraries, cdefines, cflags, cppflags, stackSize, version, id, korehl, icon));
        try {
            const kmakeOptions = ['--from', options.from, '--to', buildDir, '--kfile', path.resolve(options.to, 'kfile.js'), '-t', koreplatform(options.target), '--noshaders',
                '--graphics', options.graphics, '--arch', options.arch, '--audio', options.audio, '--vr', options.vr, '-v', options.visualstudio
            ];
            if (options.nosigning) {
                kmakeOptions.push('--nosigning');
            }
            if (options.debug) {
                kmakeOptions.push('--debug');
            }
            if (options.run) {
                kmakeOptions.push('--run');
            }
            if (options.compile) {
                kmakeOptions.push('--compile');
            }
            await runKmake(kmakeOptions);
            for (let callback of ProjectFile_1.Callbacks.postCppCompilation) {
                callback();
            }
            log.info('Done.');
            return name;
        }
        catch (error) {
            if (error) {
                log.error('Error: ' + error);
            }
            else {
                log.error('Error.');
            }
            process.exit(1);
            return name;
        }
    }
    else {
        // If target is not a Kore project, e.g. HTML5, finish building here.
        log.info('Done.');
        return name;
    }
}
function checkKorePlatform(platform) {
    return platform === 'windows'
        || platform === 'windowsapp'
        || platform === 'ios'
        || platform === 'osx'
        || platform === 'android'
        || platform === 'linux'
        || platform === 'emscripten'
        || platform === 'pi'
        || platform === 'tvos'
        || platform === 'ps4'
        || platform === 'xboxone'
        || platform === 'switch'
        || platform === 'xboxseries'
        || platform === 'ps5'
        || platform === 'freebsd';
}
function koreplatform(platform) {
    if (platform.endsWith('-hl'))
        return platform.substr(0, platform.length - '-hl'.length);
    else
        return platform;
}
let kore = false;
let korehl = false;
async function exportKhaProject(options) {
    log.info('Creating Kha project.');
    let project = null;
    let foundProjectFile = false;
    // get the khafile.js and load the config code,
    // then create the project config object, which contains stuff
    // like project name, assets paths, sources path, library path...
    if (fs.existsSync(path.join(options.from, options.projectfile))) {
        try {
            project = await (0, ProjectFile_1.loadProject)(options.from, options.projectfile, options.target);
        }
        catch (x) {
            log.error(x);
            throw 'Loading the projectfile failed.';
        }
        foundProjectFile = true;
    }
    if (!foundProjectFile) {
        throw 'No khafile found.';
    }
    let temp = path.join(options.to, 'temp');
    fs.ensureDirSync(temp);
    let exporter = null;
    let target = options.target.toLowerCase();
    let baseTarget = target;
    let customTarget = null;
    if (project.customTargets.get(options.target)) {
        customTarget = project.customTargets.get(options.target);
        baseTarget = customTarget.baseTarget;
    }
    switch (baseTarget) {
        case Platform_1.Platform.Krom:
            exporter = new KromExporter_1.KromExporter(options);
            break;
        case Platform_1.Platform.Flash:
            exporter = new FlashExporter_1.FlashExporter(options);
            break;
        case Platform_1.Platform.HTML5:
            exporter = new Html5Exporter_1.Html5Exporter(options);
            break;
        case Platform_1.Platform.HTML5Worker:
            exporter = new Html5WorkerExporter_1.Html5WorkerExporter(options);
            break;
        case Platform_1.Platform.DebugHTML5:
            exporter = new DebugHtml5Exporter_1.DebugHtml5Exporter(options);
            break;
        case Platform_1.Platform.WPF:
            exporter = new WpfExporter_1.WpfExporter(options);
            break;
        case Platform_1.Platform.Java:
            exporter = new JavaExporter_1.JavaExporter(options);
            break;
        case Platform_1.Platform.PlayStationMobile:
            exporter = new PlayStationMobileExporter_1.PlayStationMobileExporter(options);
            break;
        case Platform_1.Platform.Node:
            exporter = new NodeExporter_1.NodeExporter(options);
            break;
        case Platform_1.Platform.Empty:
            exporter = new EmptyExporter_1.EmptyExporter(options);
            break;
        default:
            if (baseTarget.endsWith('-hl')) {
                korehl = true;
                options.target = koreplatform(baseTarget);
                if (!checkKorePlatform(options.target)) {
                    log.error(`Unknown platform: ${target} (baseTarget=$${baseTarget})`);
                    return Promise.reject('');
                }
                exporter = new KoreHLExporter_1.KoreHLExporter(options);
            }
            else {
                kore = true;
                options.target = koreplatform(baseTarget);
                if (!checkKorePlatform(options.target)) {
                    log.error(`Unknown platform: ${target} (baseTarget=$${baseTarget})`);
                    return Promise.reject('');
                }
                exporter = new KoreExporter_1.KoreExporter(options);
            }
            break;
    }
    exporter.setSystemDirectory(target);
    let buildDir = path.join(options.to, exporter.sysdir() + '-build');
    // Create the target build folder
    // e.g. 'build/pi'
    fs.ensureDirSync(path.join(options.to, exporter.sysdir()));
    let defaultWindowOptions = {
        width: 800,
        height: 600
    };
    let windowOptions = project.windowOptions ? project.windowOptions : defaultWindowOptions;
    exporter.setName(project.name);
    exporter.setWidthAndHeight('width' in windowOptions ? windowOptions.width : defaultWindowOptions.width, 'height' in windowOptions ? windowOptions.height : defaultWindowOptions.height);
    for (let source of project.sources) {
        exporter.addSourceDirectory(source);
    }
    for (let library of project.libraries) {
        exporter.addLibrary(library);
    }
    exporter.parameters = exporter.parameters.concat(project.parameters);
    project.scriptdir = options.kha;
    if (baseTarget !== Platform_1.Platform.Java && baseTarget !== Platform_1.Platform.WPF) {
        project.addShaders('Sources/Shaders/**', {});
    }
    for (let callback of ProjectFile_1.Callbacks.preAssetConversion) {
        callback();
    }
    let assetConverter = new AssetConverter_1.AssetConverter(exporter, options, project.assetMatchers);
    lastAssetConverter = assetConverter;
    let assets = await assetConverter.run(options.watch, temp);
    if ((target === Platform_1.Platform.DebugHTML5 && process.platform === 'win32') || target === Platform_1.Platform.HTML5) {
        Icon.exportIco(project.icon, path.join(options.to, exporter.sysdir(), 'favicon.ico'), options.from, options);
    }
    else if (target === Platform_1.Platform.DebugHTML5) {
        Icon.exportPng(project.icon, path.join(options.to, exporter.sysdir(), 'favicon.png'), 256, 256, 0xffffffff, true, options.from, options);
    }
    let shaderDir = path.join(options.to, exporter.sysdir() + '-resources');
    for (let callback of ProjectFile_1.Callbacks.preShaderCompilation) {
        callback();
    }
    fs.ensureDirSync(shaderDir);
    let oldResources = null;
    let recompileAllShaders = false;
    try {
        oldResources = JSON.parse(fs.readFileSync(path.join(options.to, exporter.sysdir() + '-resources', 'files.json'), 'utf8'));
        for (let file of oldResources.files) {
            if (file.type === 'shader') {
                if (!file.files || file.files.length === 0) {
                    recompileAllShaders = true;
                    break;
                }
            }
        }
    }
    catch (error) {
    }
    let exportedShaders = [];
    if (!options.noshaders) {
        if (fs.existsSync(path.join(options.from, 'Backends'))) {
            let libdirs = fs.readdirSync(path.join(options.from, 'Backends'));
            for (let ld in libdirs) {
                let libdir = path.join(options.from, 'Backends', libdirs[ld]);
                if (fs.statSync(libdir).isDirectory()) {
                    let exe = path.join(libdir, 'krafix', 'krafix-' + options.target + '.exe');
                    if (fs.existsSync(exe)) {
                        options.krafix = exe;
                    }
                }
            }
        }
        let shaderCompiler = new ShaderCompiler_1.ShaderCompiler(exporter, baseTarget, options.krafix, shaderDir, temp, buildDir, options, project.shaderMatchers);
        lastShaderCompiler = shaderCompiler;
        try {
            if (baseTarget !== Platform_1.Platform.Java && baseTarget !== Platform_1.Platform.WPF) {
                exportedShaders = await shaderCompiler.run(options.watch, recompileAllShaders);
            }
        }
        catch (err) {
            return Promise.reject(err);
        }
    }
    function findShader(name) {
        let fallback = {};
        fallback.files = [];
        fallback.inputs = [];
        fallback.outputs = [];
        fallback.uniforms = [];
        fallback.types = [];
        try {
            for (let file of oldResources.files) {
                if (file.type === 'shader' && file.name === fixName(name)) {
                    return file;
                }
            }
        }
        catch (error) {
            return fallback;
        }
        return fallback;
    }
    let files = [];
    for (let asset of assets) {
        let file = {
            name: fixName(asset.name),
            files: asset.files,
            file_sizes: asset.file_sizes,
            type: asset.type
        };
        if (file.type === 'image') {
            file.original_width = asset.original_width;
            file.original_height = asset.original_height;
            if (asset.readable)
                file.readable = asset.readable;
        }
        files.push(file);
    }
    for (let shader of exportedShaders) {
        if (shader.noembed)
            continue;
        let oldShader = findShader(shader.name);
        files.push({
            name: fixName(shader.name),
            files: shader.files === null ? oldShader.files : shader.files,
            file_sizes: [1],
            type: 'shader',
            inputs: shader.inputs === null ? oldShader.inputs : shader.inputs,
            outputs: shader.outputs === null ? oldShader.outputs : shader.outputs,
            uniforms: shader.uniforms === null ? oldShader.uniforms : shader.uniforms,
            types: shader.types === null ? oldShader.types : shader.types
        });
    }
    // Sort to prevent files.json from changing between makes when no files have changed.
    files.sort(function (a, b) {
        if (a.name > b.name)
            return 1;
        if (a.name < b.name)
            return -1;
        return 0;
    });
    function secondPass() {
        // First pass is for main project files. Second pass is for shaders.
        // Will try to look for the folder, e.g. 'build/Shaders'.
        // if it exists, export files similar to other a
        let hxslDir = path.join('build', 'Shaders');
        /** if (fs.existsSync(hxslDir) && fs.readdirSync(hxslDir).length > 0) {
            addShaders(exporter, platform, project, from, to.resolve(exporter.sysdir() + '-resources'), temp, from.resolve(Paths.get(hxslDir)), krafix);
            if (foundProjectFile) {
                fs.outputFileSync(to.resolve(Paths.get(exporter.sysdir() + '-resources', 'files.json')).toString(), JSON.stringify({ files: files }, null, '\t'), { encoding: 'utf8' });
                log.info('Assets done.');
                exportProjectFiles(name, from, to, options, exporter, platform, khaDirectory, haxeDirectory, kore, project.libraries, project.targetOptions, callback);
            }
            else {
                exportProjectFiles(name, from, to, options, exporter, platform, khaDirectory, haxeDirectory, kore, project.libraries, project.targetOptions, callback);
            }
        }*/
    }
    if (foundProjectFile) {
        fs.outputFileSync(path.join(options.to, exporter.sysdir() + '-resources', 'files.json'), JSON.stringify({ files: files }, null, '\t'));
    }
    for (let callback of ProjectFile_1.Callbacks.preHaxeCompilation) {
        callback();
    }
    return await exportProjectFiles(project.name, path.join(options.to, exporter.sysdir() + '-resources'), options, exporter, kore, korehl, project.icon, project.libraries, project.targetOptions, project.defines, project.cdefines, project.cflags, project.cppflags, project.stackSize, project.version, project.id);
}
function isKhaProject(directory, projectfile) {
    return fs.existsSync(path.join(directory, 'Kha')) || fs.existsSync(path.join(directory, projectfile));
}
async function exportProject(options) {
    if (isKhaProject(options.from, options.projectfile)) {
        return await exportKhaProject(options);
    }
    else {
        log.error('Neither Kha directory nor project file (' + options.projectfile + ') found.');
        return 'Unknown';
    }
}
function runProject(options, name) {
    return new Promise((resolve, reject) => {
        log.info('Running...');
        let run = child_process.spawn(path.join(process.cwd(), options.to, 'linux-build', name), [], { cwd: path.join(process.cwd(), options.to, 'linux') });
        run.stdout.on('data', function (data) {
            log.info(data.toString());
        });
        run.stderr.on('data', function (data) {
            log.error(data.toString());
        });
        run.on('close', function (code) {
            resolve();
        });
    });
}
exports.api = 2;
function findKhaVersion(dir) {
    let p = path.join(dir, '.git');
    let hasGitInfo = false;
    if (fs.existsSync(p)) {
        let stat = fs.statSync(p);
        hasGitInfo = stat.isDirectory();
        // otherwise git might not utilize an in-place directory
        if (!hasGitInfo) {
            let contents = fs.readFileSync(p).toString('utf8', 0, 7);
            hasGitInfo = contents === 'gitdir:';
        }
    }
    if (hasGitInfo) {
        let gitVersion = 'git-error';
        try {
            const output = child_process.spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', cwd: dir }).output;
            for (const str of output) {
                if (str != null && str.length > 0) {
                    gitVersion = str.substr(0, 8);
                    break;
                }
            }
        }
        catch (error) {
        }
        let gitStatus = 'git-error';
        try {
            const output = child_process.spawnSync('git', ['status', '--porcelain'], { encoding: 'utf8', cwd: dir }).output;
            gitStatus = '';
            for (const str of output) {
                if (str != null && str.length > 0) {
                    gitStatus = str.trim();
                    break;
                }
            }
        }
        catch (error) {
        }
        if (gitStatus) {
            return gitVersion + ', ' + gitStatus.replace(/\n/g, ',');
        }
        else {
            return gitVersion;
        }
    }
    else {
        return '¯\\_(ツ)_/¯';
    }
}
async function run(options, loglog) {
    if (options.silent) {
        log.silent();
    }
    else {
        log.set(loglog);
    }
    if (options.quiet) {
        log.silent(true);
    }
    if (!options.kha) {
        let p = path.join(__dirname, '..', '..', '..');
        if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
            options.kha = p;
        }
    }
    else {
        options.kha = path.resolve(options.kha);
    }
    log.info('Using Kha (' + findKhaVersion(options.kha) + ') from ' + options.kha);
    if (options.parallelAssetConversion === undefined) {
        options.parallelAssetConversion = 0;
    }
    if (!options.haxe) {
        let haxepath = path.join(options.kha, 'Tools', (0, exec_1.sysdir)());
        if (fs.existsSync(haxepath) && fs.statSync(haxepath).isDirectory())
            options.haxe = haxepath;
    }
    if (!options.krafix) {
        let krafixpath = path.join(options.kha, 'Kore', 'Tools', (0, exec_1.sysdir2)(), 'krafix' + (0, exec_1.sys)());
        if (fs.existsSync(krafixpath))
            options.krafix = krafixpath;
    }
    if (!options.kraffiti) {
        const kraffitipath = path.join(options.kha, 'Kore', 'Tools', (0, exec_1.sysdir2)(), 'kraffiti' + (0, exec_1.sys)());
        if (fs.existsSync(kraffitipath))
            options.kraffiti = kraffitipath;
    }
    else {
        log.info('Using kraffiti from ' + options.kraffiti);
    }
    if (!options.ogg && options.ffmpeg) {
        options.ogg = options.ffmpeg + ' -nostdin -i {in} {out} -y';
    }
    if (!options.mp3 && options.ffmpeg) {
        options.mp3 = options.ffmpeg + ' -nostdin -i {in} {out}';
    }
    if (!options.ogg) {
        let oggpath = path.join(options.kha, 'Tools', (0, exec_1.sysdir)(), 'oggenc' + (0, exec_1.sys)());
        if (fs.existsSync(oggpath))
            options.ogg = oggpath + ' {in} -o {out} --quiet';
    }
    if (!options.mp3) {
        let lamepath = path.join(options.kha, 'Tools', (0, exec_1.sysdir)(), 'lame' + (0, exec_1.sys)());
        if (fs.existsSync(lamepath))
            options.mp3 = lamepath + ' {in} {out}';
    }
    // if (!options.kravur) {
    //     let kravurpath = path.join(options.kha, 'Tools', 'kravur', 'kravur' + sys());
    //     if (fs.existsSync(kravurpath)) options.kravur = kravurpath + ' {in} {size} {out}';
    // }
    if (!options.aac && options.ffmpeg) {
        options.aac = options.ffmpeg + ' -nostdin -i {in} {out}';
    }
    if (!options.h264 && options.ffmpeg) {
        options.h264 = options.ffmpeg + ' -nostdin -i {in} {out}';
    }
    if (!options.webm && options.ffmpeg) {
        options.webm = options.ffmpeg + ' -nostdin -i {in} {out}';
    }
    if (!options.wmv && options.ffmpeg) {
        options.wmv = options.ffmpeg + ' -nostdin -i {in} {out}';
    }
    if (!options.theora && options.ffmpeg) {
        options.theora = options.ffmpeg + ' -nostdin -i {in} {out}';
    }
    if (options.target === 'emscripten') {
        console.log();
        console.log('Please note that the html5 target\n'
            + 'is usually a better choice.\n'
            + 'In particular the html5 target usually runs faster\n'
            + 'than the emscripten target. That is because\n'
            + 'Haxe and JavaScript are similar in many ways and\n'
            + 'therefore the html5 target can make direct use of\n'
            + 'all of the optimizations in modern JavaScript\n'
            + 'runtimes. The emscripten target on the other hand\n'
            + 'has to provide its own garbage collector and many\n'
            + 'other performance critical pieces of infrastructure.');
        console.log();
    }
    let name = '';
    try {
        name = await exportProject(options);
    }
    catch (err) {
        for (let callback of ProjectFile_1.Callbacks.onFailure) {
            callback(err);
        }
        throw err;
    }
    for (let callback of ProjectFile_1.Callbacks.postBuild) {
        callback();
    }
    if ((options.target === Platform_1.Platform.Linux || options.target === Platform_1.Platform.FreeBSD) && options.run) {
        await runProject(options, name);
    }
    return name;
}
exports.run = run;
function close() {
    if (lastAssetConverter)
        lastAssetConverter.close();
    if (lastShaderCompiler)
        lastShaderCompiler.close();
    if (lastHaxeCompiler)
        lastHaxeCompiler.close();
}
exports.close = close;
//# sourceMappingURL=main.js.map