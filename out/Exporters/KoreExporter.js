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
const Platform_1 = require('../Platform');
const ImageTool_1 = require('../ImageTool');
const HaxeProject_1 = require('../HaxeProject');
const HaxeProject_2 = require('../HaxeProject');
class KoreExporter extends KhaExporter_1.KhaExporter {
    constructor(options) {
        super(options);
        this.addSourceDirectory(path.join(options.kha, 'Backends', 'Kore'));
    }
    sysdir() {
        if (this.options.target === 'android')
            return 'android-native';
        else if (this.options.target === 'html5')
            return 'html5-native';
        return this.options.target;
    }
    haxeOptions(name, targetOptions, defines) {
        defines.push('no-compilation');
        defines.push('sys_' + this.options.target);
        defines.push('sys_g1');
        defines.push('sys_g2');
        defines.push('sys_g3');
        defines.push('sys_g4');
        defines.push('sys_a1');
        defines.push('sys_a2');
        if (this.options.vr === 'gearvr') {
            defines.push('vr_gearvr');
        }
        else if (this.options.vr === 'cardboard') {
            defines.push('vr_cardboard');
        }
        else if (this.options.vr === 'rift') {
            defines.push('vr_rift');
        }
        return {
            from: this.options.from,
            to: path.join(this.sysdir() + '-build', 'Sources'),
            sources: this.sources,
            libraries: this.libraries,
            defines: defines,
            parameters: this.parameters,
            haxeDirectory: this.options.haxe,
            system: this.sysdir(),
            language: 'cpp',
            width: this.width,
            height: this.height,
            name: name
        };
    }
    exportSolution(name, targetOptions, haxeOptions) {
        return __awaiter(this, void 0, Promise, function* () {
            HaxeProject_2.hxml(this.options.to, haxeOptions);
            if (this.projectFiles) {
                HaxeProject_1.writeHaxeProject(this.options.to, haxeOptions);
            }
            //Files.removeDirectory(this.directory.resolve(Paths.get(this.sysdir() + "-build", "Sources")));
        });
    }
    /*copyMusic(platform, from, to, encoders, callback) {
        Files.createDirectories(this.directory.resolve(this.sysdir()).resolve(to).parent());
        Converter.convert(from, this.directory.resolve(this.sysdir()).resolve(to + '.ogg'), encoders.oggEncoder, (success) => {
            callback([to + '.ogg']);
        });
    }*/
    copySound(platform, from, to) {
        return __awaiter(this, void 0, void 0, function* () {
            fs.copySync(from.toString(), path.join(this.options.to, this.sysdir(), to + '.wav'), { clobber: true });
            return [to + '.wav'];
        });
    }
    copyImage(platform, from, to, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (platform === Platform_1.Platform.iOS && options.quality < 1) {
                let format = yield ImageTool_1.exportImage(this.options.kha, from, path.join(this.options.to, this.sysdir(), to), options, 'pvr', true);
                return [to + '.' + format];
            }
            else {
                let format = yield ImageTool_1.exportImage(this.options.kha, from, path.join(this.options.to, this.sysdir(), to), options, undefined /*'snappy'*/, true);
                return [to + '.' + format];
            }
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
            if (platform === Platform_1.Platform.iOS) {
                yield Converter_1.convert(from, path.join(this.options.to, this.sysdir(), to + '.mp4'), this.options.h264);
                return [to + '.mp4'];
            }
            else if (platform === Platform_1.Platform.Android) {
                yield Converter_1.convert(from, path.join(this.options.to, this.sysdir(), to + '.ts'), this.options.h264);
                return [to + '.ts'];
            }
            else {
                yield Converter_1.convert(from, path.join(this.options.to, this.sysdir(), to + '.ogv'), this.options.theora);
                return [to + '.ogv'];
            }
        });
    }
}
exports.KoreExporter = KoreExporter;
//# sourceMappingURL=KoreExporter.js.map