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
const Converter_1 = require('./Converter');
const Haxe_1 = require('./Haxe');
const Platform_1 = require('./Platform');
const ImageTool_1 = require('./ImageTool');
const HaxeProject_1 = require('./HaxeProject');
class KoreExporter extends KhaExporter_1.KhaExporter {
    constructor(platform, khaDirectory, vr, directory) {
        super(khaDirectory, directory);
        this.platform = platform;
        this.addSourceDirectory(path.join(khaDirectory.toString(), 'Backends/Kore'));
        this.vr = vr;
    }
    sysdir() {
        return this.platform;
    }
    exportSolution(name, platform, khaDirectory, haxeDirectory, from, _targetOptions, defines) {
        return __awaiter(this, void 0, void 0, function* () {
            defines.push('no-compilation');
            defines.push('sys_' + platform);
            defines.push('sys_g1');
            defines.push('sys_g2');
            defines.push('sys_g3');
            defines.push('sys_g4');
            defines.push('sys_a1');
            defines.push('sys_a2');
            if (this.vr === 'gearvr') {
                defines.push('vr_gearvr');
            }
            else if (this.vr === 'cardboard') {
                defines.push('vr_cardboard');
            }
            else if (this.vr === 'rift') {
                defines.push('vr_rift');
            }
            const options = {
                from: from.toString(),
                to: path.join(this.sysdir() + '-build', 'Sources'),
                sources: this.sources,
                libraries: this.libraries,
                defines: defines,
                parameters: this.parameters,
                haxeDirectory: haxeDirectory.toString(),
                system: this.sysdir(),
                language: 'cpp',
                width: this.width,
                height: this.height,
                name: name
            };
            HaxeProject_1.writeHaxeProject(this.directory.toString(), options);
            //Files.removeDirectory(this.directory.resolve(Paths.get(this.sysdir() + "-build", "Sources")));
            return Haxe_1.executeHaxe(this.directory, haxeDirectory, ["project-" + this.sysdir() + ".hxml"]);
        });
    }
    /*copyMusic(platform, from, to, encoders, callback) {
        Files.createDirectories(this.directory.resolve(this.sysdir()).resolve(to).parent());
        Converter.convert(from, this.directory.resolve(this.sysdir()).resolve(to + '.ogg'), encoders.oggEncoder, (success) => {
            callback([to + '.ogg']);
        });
    }*/
    copySound(platform, from, to, encoders) {
        return __awaiter(this, void 0, void 0, function* () {
            fs.copySync(from.toString(), path.join(this.directory, this.sysdir(), to + '.wav'), { clobber: true });
            return [to + '.wav'];
        });
    }
    copyImage(platform, from, to, asset) {
        return __awaiter(this, void 0, void 0, function* () {
            if (platform === Platform_1.Platform.iOS && asset.compressed) {
                let format = ImageTool_1.exportImage(from, path.join(this.directory, this.sysdir(), to), asset, 'pvr', true);
                return [to + '.' + format];
            }
            else {
                let format = yield ImageTool_1.exportImage(from, path.join(this.directory, this.sysdir(), to), asset, undefined, true);
                return [to + '.' + format];
            }
        });
    }
    copyBlob(platform, from, to) {
        return __awaiter(this, void 0, void 0, function* () {
            fs.copySync(from.toString(), path.join(this.directory, this.sysdir(), to), { clobber: true });
            return [to];
        });
    }
    copyVideo(platform, from, to, encoders) {
        return __awaiter(this, void 0, void 0, function* () {
            fs.ensureDirSync(path.join(this.directory, this.sysdir(), path.dirname(to)));
            if (platform === Platform_1.Platform.iOS) {
                yield Converter_1.convert(from, path.join(this.directory, this.sysdir(), to + '.mp4'), encoders.h264Encoder);
                return [to + '.mp4'];
            }
            else if (platform === Platform_1.Platform.Android) {
                yield Converter_1.convert(from, path.join(this.directory, this.sysdir(), to + '.ts'), encoders.h264Encoder);
                return [to + '.ts'];
            }
            else {
                yield Converter_1.convert(from, path.join(this.directory, this.sysdir(), to + '.ogv'), encoders.theoraEncoder);
                return [to + '.ogv'];
            }
        });
    }
}
exports.KoreExporter = KoreExporter;
//# sourceMappingURL=KoreExporter.js.map