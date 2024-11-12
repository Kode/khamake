"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KromExporter = void 0;
const fs = require("fs-extra");
const path = require("path");
const defaults = require("../defaults");
const KhaExporter_1 = require("./KhaExporter");
const Converter_1 = require("../Converter");
const GraphicsApi_1 = require("../GraphicsApi");
const ImageTool_1 = require("../ImageTool");
const log = require("../log");
class KromExporter extends KhaExporter_1.KhaExporter {
    constructor(options) {
        super(options);
    }
    backend() {
        return 'Krom';
    }
    haxeOptions(name, targetOptions, defines) {
        defines.push('sys_' + this.options.target);
        defines.push('sys_g1');
        defines.push('sys_g2');
        defines.push('sys_g3');
        defines.push('sys_g4');
        defines.push('sys_a1');
        defines.push('sys_a2');
        defines.push('kha_js');
        defines.push('kha_' + this.options.target);
        defines.push('kha_' + this.options.target + '_js');
        let graphics = this.options.graphics;
        if (graphics === GraphicsApi_1.GraphicsApi.Default) {
            graphics = defaults.graphicsApi(this.options.target);
        }
        defines.push('kha_' + graphics);
        defines.push('kha_g1');
        defines.push('kha_g2');
        defines.push('kha_g3');
        defines.push('kha_g4');
        defines.push('kha_a1');
        defines.push('kha_a2');
        if (this.options.debug) {
            this.parameters.push('-debug');
            defines.push('js-classic');
        }
        return {
            from: this.options.from.toString(),
            to: path.join(this.sysdir(), 'krom.js.temp'),
            realto: path.join(this.sysdir(), 'krom.js'),
            sources: this.sources,
            libraries: this.libraries,
            defines: defines,
            parameters: this.parameters,
            haxeDirectory: this.options.haxe,
            system: this.sysdir(),
            language: 'js',
            width: this.width,
            height: this.height,
            name: name,
            main: this.options.main,
        };
    }
    async export(name, targetOptions, haxeOptions) {
        fs.ensureDirSync(path.join(this.options.to, this.sysdir()));
    }
    async copySound(platform, from, to, options) {
        if (options.quality < 1) {
            fs.ensureDirSync(path.join(this.options.to, this.sysdir(), path.dirname(to)));
            let ogg = await (0, Converter_1.convert)(from, path.join(this.options.to, this.sysdir(), to + '.ogg'), this.options.ogg);
            return { files: [to + '.ogg'], sizes: [1] };
        }
        else {
            if (from.endsWith('.wav')) {
                fs.copySync(from.toString(), path.join(this.options.to, this.sysdir(), to + '.wav'), { overwrite: true });
            }
            else {
                log.error('Can not convert ' + from + ' to wav format.\nSet `{quality: 0.99}` in `project.addAssets` if you want to convert your files to `ogg`.');
                process.exit(1);
            }
            return { files: [to + '.wav'], sizes: [1] };
        }
    }
    async copyImage(platform, from, to, options, cache) {
        let format = await (0, ImageTool_1.exportImage)(this.options.kha, this.options.kraffiti, from, path.join(this.options.to, this.sysdir(), to), options, undefined, false, false, cache);
        return { files: [to + '.' + format], sizes: [1] };
    }
    async copyBlob(platform, from, to) {
        fs.copySync(from.toString(), path.join(this.options.to, this.sysdir(), to), { overwrite: true });
        return { files: [to], sizes: [1] };
    }
    async copyVideo(platform, from, to) {
        fs.ensureDirSync(path.join(this.options.to, this.sysdir(), path.dirname(to)));
        let webm = await (0, Converter_1.convert)(from, path.join(this.options.to, this.sysdir(), to + '.webm'), this.options.webm);
        let files = [];
        let sizes = [];
        if (webm) {
            files.push(to + '.webm');
            sizes.push(1);
        }
        return { files: files, sizes: sizes };
    }
}
exports.KromExporter = KromExporter;
//# sourceMappingURL=KromExporter.js.map