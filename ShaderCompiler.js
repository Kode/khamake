"use strict";
const path = require('path');
const chokidar = require('chokidar');
class ShaderCompiler {
    constructor(exporter, platform, shaderMatchers) {
        this.exporter = exporter;
        this.platform = platform;
        for (let matcher of shaderMatchers) {
            console.log('Watching ' + matcher + '.');
        }
        this.watcher = chokidar.watch(shaderMatchers, { ignored: /[\/\\]\./, persistent: true });
        this.watcher.on('add', (file) => {
            let fileinfo = path.parse(file);
            console.log('New file: ' + file + ' ' + fileinfo.ext);
            switch (fileinfo.ext) {
                case '.glsl':
                    console.log('Compiling ' + fileinfo.name);
                    this.compileShader(this.exporter, this.platform, {}, {}, fileinfo.name, 'temp', 'krafix');
                    break;
            }
        });
        this.watcher.on('change', (file) => {
        });
        this.watcher.on('ready', () => {
            //log('Initial scan complete. Ready for changes')
        });
    }
    compileShader(exporter, platform, project, shader, to, temp, compiler) {
    }
}
exports.ShaderCompiler = ShaderCompiler;
//# sourceMappingURL=ShaderCompiler.js.map