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
const fs = require('fs-extra');
const path = require('path');
const chokidar = require('chokidar');
const GraphicsApi_1 = require('./GraphicsApi');
const Platform_1 = require('./Platform');
const AssetConverter_1 = require('./AssetConverter');
const log = require('./log');
class Variables {
    constructor() {
        this.inputs = [];
        this.outputs = [];
        this.uniforms = [];
    }
}
class ShaderCompiler {
    constructor(exporter, platform, compiler, to, temp, builddir, options, shaderMatchers) {
        this.exporter = exporter;
        if (platform.endsWith('-native'))
            platform = platform.substr(0, platform.length - '-native'.length);
        if (platform.endsWith('-hl'))
            platform = platform.substr(0, platform.length - '-hl'.length);
        this.platform = platform;
        this.compiler = compiler;
        this.type = ShaderCompiler.findType(platform, options);
        this.options = options;
        this.to = to;
        this.temp = temp;
        this.builddir = builddir;
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
                return 'essl';
            case Platform_1.Platform.tvOS:
            case Platform_1.Platform.iOS:
                if (options.graphics === GraphicsApi_1.GraphicsApi.Metal) {
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
                if (options.graphics === GraphicsApi_1.GraphicsApi.Metal) {
                    return 'metal';
                }
                else {
                    return 'glsl';
                }
            case Platform_1.Platform.Unity:
                return 'hlsl';
            default:
                for (let p in Platform_1.Platform) {
                    if (platform === p) {
                        return 'none';
                    }
                }
                return 'glsl';
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
                            this.compileShader(file, options);
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
                        this.compileShader(file, options);
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
                    let parsed = path.parse(shader);
                    log.info('Compiling shader ' + (index + 1) + ' of ' + shaders.length + ' (' + parsed.base + ').');
                    let variables = new Variables();
                    try {
                        variables = yield this.compileShader(shader, options);
                    }
                    catch (error) {
                        reject(error);
                        return;
                    }
                    parsedShaders.push({
                        files: [parsed.name + '.' + this.type],
                        name: AssetConverter_1.AssetConverter.createExportInfo(parsed, false, options, this.exporter.options.from).name,
                        inputs: variables.inputs,
                        outputs: variables.outputs,
                        uniforms: variables.uniforms
                    });
                    ++index;
                }
                resolve(parsedShaders);
                return;
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
    compileShader(file, options) {
        return new Promise((resolve, reject) => {
            if (!this.compiler)
                reject('No shader compiler found.');
            if (this.type === 'none') {
                resolve(new Variables());
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
                        resolve(new Variables()); // TODO
                    }
                    else {
                        if (this.type === 'metal') {
                            fs.ensureDirSync(path.join(this.builddir, 'Sources'));
                            let funcname = fileinfo.name;
                            funcname = funcname.replace(/-/g, '_');
                            funcname = funcname.replace(/\./g, '_');
                            funcname += '_main';
                            fs.writeFileSync(to, funcname, 'utf8');
                            to = path.join(this.builddir, 'Sources', fileinfo.name + '.' + this.type);
                            temp = to + '.temp';
                        }
                        let parameters = [this.type === 'hlsl' ? 'd3d9' : this.type, from, temp, this.temp, this.platform];
                        if (this.options.glsl2) {
                            parameters.push('--glsl2');
                        }
                        if (options.defines) {
                            for (let define of options.defines) {
                                parameters.push('-D' + define);
                            }
                        }
                        let child = child_process.spawn(this.compiler, parameters);
                        child.stdout.on('data', (data) => {
                            log.info(data.toString());
                        });
                        let errorLine = '';
                        let newErrorLine = true;
                        let errorData = false;
                        let variables = new Variables();
                        function parseData(data) {
                            let parts = data.split(':');
                            if (parts.length >= 3) {
                                if (parts[0] === 'uniform') {
                                    variables.uniforms.push({ name: parts[1], type: parts[2] });
                                }
                                else if (parts[0] === 'input') {
                                    variables.inputs.push({ name: parts[1], type: parts[2] });
                                }
                                else if (parts[0] === 'output') {
                                    variables.outputs.push({ name: parts[1], type: parts[2] });
                                }
                            }
                        }
                        child.stderr.on('data', (data) => {
                            let str = data.toString();
                            for (let char of str) {
                                if (char === '\n') {
                                    if (errorData) {
                                        parseData(errorLine.trim());
                                    }
                                    else {
                                        log.error(errorLine.trim());
                                    }
                                    errorLine = '';
                                    newErrorLine = true;
                                    errorData = false;
                                }
                                else if (newErrorLine && char === '#') {
                                    errorData = true;
                                    newErrorLine = false;
                                }
                                else {
                                    errorLine += char;
                                    newErrorLine = false;
                                }
                            }
                        });
                        child.on('close', (code) => {
                            if (errorLine.trim().length > 0) {
                                if (errorData) {
                                    parseData(errorLine.trim());
                                }
                                else {
                                    log.error(errorLine.trim());
                                }
                            }
                            if (code === 0) {
                                fs.renameSync(temp, to);
                                resolve(variables);
                            }
                            else {
                                process.exitCode = 1;
                                reject('Shader compiler error.');
                            }
                        });
                    }
                });
            });
        });
    }
}
exports.ShaderCompiler = ShaderCompiler;
//# sourceMappingURL=ShaderCompiler.js.map