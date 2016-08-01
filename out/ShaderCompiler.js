"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const child_process = require('child_process');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const GraphicsApi_1 = require('./GraphicsApi');
const Platform_1 = require('./Platform');
const log = require('./log');
class ShaderCompiler {
    constructor(exporter, platform, compiler, to, temp, options, shaderMatchers) {
        this.exporter = exporter;
        if (platform.endsWith('-native'))
            platform = platform.substr(0, platform.length - '-native'.length);
        if (platform.endsWith('-hl'))
            platform = platform.substr(0, platform.length - '-hl'.length);
        this.platform = platform;
        this.compiler = compiler;
        this.type = ShaderCompiler.findType(platform, options);
        this.to = to;
        this.temp = temp;
        this.shaderMatchers = shaderMatchers;
    }
    static findType(platform, options) {
        switch (platform) {
            case Platform_1.Platform.Empty:
            case Platform_1.Platform.Node:
                return 'glsl';
            case Platform_1.Platform.Flash:
                return 'agal';
            case Platform_1.Platform.Android:
                if (options.graphics === GraphicsApi_1.GraphicsApi.Vulkan) {
                    return 'spirv';
                }
                else {
                    return 'essl';
                }
            case Platform_1.Platform.HTML5:
            case Platform_1.Platform.DebugHTML5:
            case Platform_1.Platform.HTML5Worker:
            case Platform_1.Platform.Tizen:
            case Platform_1.Platform.Pi:
            case Platform_1.Platform.tvOS:
            case Platform_1.Platform.iOS:
                if (options.graphics === GraphicsApi_1.GraphicsApi.Metal) {
                    /*let builddir = 'ios-build';
                    if (platform === Platform.tvOS) {
                        builddir = 'tvos-build';
                    }
                    if (!Files.isDirectory(to.resolve(Paths.get('..', builddir, 'Sources')))) {
                        Files.createDirectories(to.resolve(Paths.get('..', builddir, 'Sources')));
                    }
                    let funcname = name;
                    funcname = funcname.replace(/-/g, '_');
                    funcname = funcname.replace(/\./g, '_');
                    funcname += '_main';
                    fs.writeFileSync(to.resolve(name + ".metal").toString(), funcname, { encoding: 'utf8' });
                    compileShader2(compiler, "metal", shader.files[0], to.resolve(Paths.get('..', builddir, 'Sources', name + ".metal")), temp, platform);
                    addShader(project, name, ".metal");*/
                    return 'metal';
                }
                else {
                    return 'essl';
                }
            case Platform_1.Platform.Windows:
                if (options.graphics === GraphicsApi_1.GraphicsApi.Vulkan) {
                    return 'spirv';
                }
                else if (options.graphics === GraphicsApi_1.GraphicsApi.OpenGL || options.graphics === GraphicsApi_1.GraphicsApi.OpenGL2) {
                    return 'glsl';
                }
                else if (options.graphics === GraphicsApi_1.GraphicsApi.Direct3D11 || options.graphics === GraphicsApi_1.GraphicsApi.Direct3D12) {
                    return 'd3d11';
                }
                else {
                    return 'd3d9';
                }
            case Platform_1.Platform.WindowsApp:
                return 'd3d11';
            case Platform_1.Platform.Xbox360:
            case Platform_1.Platform.PlayStation3:
                return 'd3d9';
            case Platform_1.Platform.Linux:
                if (options.graphics === GraphicsApi_1.GraphicsApi.Vulkan) {
                    return 'spirv';
                }
                else {
                    return 'glsl';
                }
            case Platform_1.Platform.OSX:
                return 'glsl';
            case Platform_1.Platform.Unity:
                return 'hlsl';
            default:
                return 'none';
        }
    }
    watch(watch, match, options) {
        return new Promise((resolve, reject) => {
            let shaders = [];
            let ready = false;
            this.watcher = chokidar.watch(match, { ignored: /[\/\\]\./, persistent: watch });
            this.watcher.on('add', (file) => {
                if (ready) {
                    switch (path.parse(file).ext) {
                        case '.glsl':
                            this.compileShader(file);
                            break;
                    }
                }
                else {
                    shaders.push(file);
                }
            });
            this.watcher.on('change', (file) => {
                switch (path.parse(file).ext) {
                    case '.glsl':
                        this.compileShader(file);
                        break;
                }
            });
            this.watcher.on('unlink', (file) => {
            });
            this.watcher.on('ready', () => __awaiter(this, void 0, void 0, function* () {
                ready = true;
                let parsedShaders = [];
                let index = 0;
                for (let shader of shaders) {
                    yield this.compileShader(shader);
                    let parsed = path.parse(shader);
                    log.info('Compiling shader ' + (index + 1) + ' of ' + shaders.length + ' (' + parsed.base + ').');
                    parsedShaders.push({ files: [parsed.name + '.' + this.type], name: parsed.name });
                    ++index;
                }
                resolve(parsedShaders);
            }));
        });
    }
    run(watch) {
        return __awaiter(this, void 0, Promise, function* () {
            let shaders = [];
            for (let matcher of this.shaderMatchers) {
                shaders = shaders.concat(yield this.watch(watch, matcher.match, matcher.options));
            }
            return shaders;
        });
    }
    compileShader(file) {
        return new Promise((resolve, reject) => {
            if (!this.compiler)
                reject('No shader compiler found.');
            if (this.type === 'none') {
                resolve();
                return;
            }
            let fileinfo = path.parse(file);
            let from = file;
            let to = path.join(this.to, fileinfo.name + '.' + this.type);
            let temp = to + '.temp';
            fs.stat(from, (fromErr, fromStats) => {
                fs.stat(to, (toErr, toStats) => {
                    if (fromErr || (!toErr && toStats.mtime.getTime() > fromStats.mtime.getTime())) {
                        if (fromErr)
                            log.error('Shader compiler error: ' + fromErr);
                        resolve();
                    }
                    else {
                        let process = child_process.spawn(this.compiler, [this.type, from, temp, this.temp, this.platform]);
                        process.stdout.on('data', (data) => {
                            log.info(data.toString());
                        });
                        process.stderr.on('data', (data) => {
                            log.info(data.toString());
                        });
                        process.on('close', (code) => {
                            if (code === 0) {
                                fs.renameSync(temp, to);
                                resolve();
                            }
                            else
                                reject('Shader compiler error.');
                        });
                    }
                });
            });
        });
    }
}
exports.ShaderCompiler = ShaderCompiler;
//# sourceMappingURL=ShaderCompiler.js.map