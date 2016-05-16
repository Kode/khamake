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
const log = require('./log');
class ShaderCompiler {
    constructor(exporter, platform, compiler, type, system, to, temp, shaderMatchers) {
        this.exporter = exporter;
        this.platform = platform;
        this.compiler = compiler;
        this.type = type;
        this.system = system;
        this.to = to;
        this.temp = temp;
        this.shaderMatchers = shaderMatchers;
    }
    addShader(project, name, extension) {
        project.exportedShaders.push({ files: [name + extension], name: name });
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
                    let parsed = path.parse(file);
                    shaders.push({ files: [parsed.name + this.type], name: parsed.name });
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
                for (let shader of shaders) {
                    yield this.compileShader(shader.name + '.glsl');
                }
                resolve(shaders);
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
        /*
        let shaderpath = path.join(to, name + '.essl');
        await compileShader2(compiler, "essl", shader.files[0], shaderpath, temp, platform);
        addShader(project, name, ".essl");
        */
        return new Promise((resolve, reject) => {
            if (!this.compiler)
                reject('No shader compiler found.');
            let fileinfo = path.parse(file);
            let from = file;
            let to = path.join(this.to, fileinfo.name + '.' + this.type);
            fs.stat(from, (fromErr, fromStats) => {
                fs.stat(to, (toErr, toStats) => {
                    if (fromErr || toErr || toStats.mtime.getTime() > fromStats.mtime.getTime()) {
                        log.info('Not compiling ' + file);
                        resolve();
                    }
                    else {
                        log.info('Compiling ' + file + ' to ' + path.join(to, fileinfo.name + '.' + this.type));
                        let process = child_process.spawn(this.compiler, [this.type, from, to, this.temp, this.system]);
                        process.stdout.on('data', (data) => {
                            log.info(data.toString());
                        });
                        process.stderr.on('data', (data) => {
                            log.info(data.toString());
                        });
                        process.on('close', (code) => {
                            if (code === 0)
                                resolve();
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