"use strict";
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
        for (let matcher of shaderMatchers) {
            console.log('Watching ' + matcher + '.');
        }
        this.watcher = chokidar.watch(shaderMatchers, { ignored: /[\/\\]\./, persistent: true });
        this.watcher.on('add', (file) => {
            switch (path.parse(file).ext) {
                case '.glsl':
                    this.compileShader(file);
                    break;
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
        this.watcher.on('ready', () => {
            //log('Initial scan complete. Ready for changes')
        });
    }
    compileShader(file) {
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