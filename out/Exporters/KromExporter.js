"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const fs = require('fs-extra');
const path = require('path');
const KhaExporter_1 = require('./KhaExporter');
const Converter_1 = require('../Converter');
const ImageTool_1 = require('../ImageTool');
const HaxeProject_1 = require('../HaxeProject');
class KromExporter extends KhaExporter_1.KhaExporter {
    constructor(options) {
        super(options);
        this.addSourceDirectory(path.join(options.kha, 'Backends', 'Krom'));
    }
    sysdir() {
        return 'krom';
    }
    haxeOptions(name, defines) {
        defines.push('js-classic');
        defines.push('sys_g1');
        defines.push('sys_g2');
        defines.push('sys_g3');
        defines.push('sys_g4');
        defines.push('sys_a1');
        //defines.push('sys_a2');
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
            name: name
        };
    }
    exportSolution(name, _targetOptions, defines) {
        return __awaiter(this, void 0, Promise, function* () {
            fs.ensureDirSync(path.join(this.options.to, this.sysdir()));
            let haxeOptions = this.haxeOptions(name, defines);
            HaxeProject_1.writeHaxeProject(this.options.to, haxeOptions);
            return haxeOptions;
        });
    }
    copySound(platform, from, to) {
        return __awaiter(this, void 0, void 0, function* () {
            fs.ensureDirSync(path.join(this.options.to, this.sysdir(), path.dirname(to)));
            let ogg = yield Converter_1.convert(from, path.join(this.options.to, this.sysdir(), to + '.ogg'), this.options.ogg);
            var files = [];
            if (ogg)
                files.push(to + '.ogg');
            return files;
        });
    }
    copyImage(platform, from, to, options) {
        return __awaiter(this, void 0, void 0, function* () {
            let format = yield ImageTool_1.exportImage(this.options.kha, from, path.join(this.options.to, this.sysdir(), to), options, undefined, false);
            console.log('Image format is ' + format);
            return [to + '.' + format];
        });
    }
    copyBlob(platform, from, to) {
        return __awaiter(this, void 0, void 0, function* () {
            fs.copySync(from.toString(), path.join(this.options.to, this.sysdir(), to), { clobber: true });
            return [to];
        });
    }
    copyVideo(platform, from, to) {
        return __awaiter(this, void 0, void 0, function* () {
            fs.ensureDirSync(path.join(this.options.to, this.sysdir(), path.dirname(to)));
            let webm = yield Converter_1.convert(from, path.join(this.options.to, this.sysdir(), to + '.webm'), this.options.webm);
            let files = [];
            if (webm)
                files.push(to + '.webm');
            return files;
        });
    }
}
exports.KromExporter = KromExporter;
//# sourceMappingURL=KromExporter.js.map