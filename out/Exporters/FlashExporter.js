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
const HaxeProject_2 = require('../HaxeProject');
function adjustFilename(filename) {
    filename = filename.replace(/\./g, '_');
    filename = filename.replace(/-/g, '_');
    filename = filename.replace(/\//g, '_');
    return filename;
}
class FlashExporter extends KhaExporter_1.KhaExporter {
    constructor(options) {
        super(options);
        this.images = [];
        this.sounds = [];
        this.blobs = [];
        this.addSourceDirectory(path.join(options.kha, 'Backends', 'Flash'));
    }
    sysdir() {
        return 'flash';
    }
    haxeOptions(name, targetOptions, defines) {
        defines.push('swf-script-timeout=60');
        defines.push('sys_' + this.options.target);
        defines.push('sys_g1');
        defines.push('sys_g2');
        defines.push('sys_g3');
        defines.push('sys_g4');
        defines.push('sys_a1');
        defines.push('sys_a2');
        if (this.options.embedflashassets)
            defines.push('KHA_EMBEDDED_ASSETS');
        let defaultFlashOptions = {
            framerate: 60,
            stageBackground: 'ffffff',
            swfVersion: '16.0'
        };
        let flashOptions = targetOptions ? (targetOptions.flash ? targetOptions.flash : defaultFlashOptions) : defaultFlashOptions;
        return {
            from: this.options.from,
            to: path.join(this.sysdir(), 'kha.swf'),
            sources: this.sources,
            libraries: this.libraries,
            defines: defines,
            parameters: this.parameters,
            haxeDirectory: this.options.haxe,
            system: this.sysdir(),
            language: 'as',
            width: this.width,
            height: this.height,
            name: name,
            framerate: 'framerate' in flashOptions ? flashOptions.framerate : defaultFlashOptions.framerate,
            stageBackground: 'stageBackground' in flashOptions ? flashOptions.stageBackground : defaultFlashOptions.stageBackground,
            swfVersion: 'swfVersion' in flashOptions ? flashOptions.swfVersion : defaultFlashOptions.swfVersion
        };
    }
    exportSolution(name, targetOptions, haxeOptions) {
        return __awaiter(this, void 0, Promise, function* () {
            HaxeProject_2.hxml(this.options.to, haxeOptions);
            if (this.projectFiles) {
                HaxeProject_1.writeHaxeProject(this.options.to, haxeOptions);
            }
            if (this.options.embedflashassets) {
                this.writeFile(path.join(this.options.to, '..', 'Sources', 'Assets.hx'));
                this.p("package;");
                this.p();
                this.p("import flash.display.BitmapData;");
                this.p("import flash.media.Sound;");
                this.p("import flash.utils.ByteArray;");
                this.p();
                for (let image of this.images) {
                    this.p("@:bitmap(\"flash/" + image + "\") class Assets_" + adjustFilename(image) + " extends BitmapData { }");
                }
                this.p();
                for (let sound of this.sounds) {
                    this.p("@:file(\"flash/" + sound + "\") class Assets_" + adjustFilename(sound) + " extends ByteArray { }");
                }
                this.p();
                for (let blob of this.blobs) {
                    this.p("@:file(\"flash/" + blob + "\") class Assets_" + adjustFilename(blob) + " extends ByteArray { }");
                }
                this.p();
                this.p("class Assets {");
                this.p("public static function visit(): Void {", 1);
                this.p("", 2);
                this.p("}", 1);
                this.p("}");
                this.closeFile();
            }
        });
    }
    copySound(platform, from, to) {
        return __awaiter(this, void 0, void 0, function* () {
            fs.ensureDirSync(path.join(this.options.to, this.sysdir(), path.dirname(to)));
            var ogg = yield Converter_1.convert(from, path.join(this.options.to, this.sysdir(), to + '.ogg'), this.options.ogg);
            var mp3 = yield Converter_1.convert(from, path.join(this.options.to, this.sysdir(), to + '.mp3'), this.options.mp3);
            var files = [];
            if (ogg) {
                files.push(to + '.ogg');
                if (this.options.embedflashassets)
                    this.sounds.push(to + '.ogg');
            }
            if (mp3) {
                files.push(to + '.mp3');
                if (this.options.embedflashassets)
                    this.sounds.push(to + '.mp3');
            }
            return files;
        });
    }
    copyImage(platform, from, to, asset) {
        return __awaiter(this, void 0, void 0, function* () {
            let format = yield ImageTool_1.exportImage(this.options.kha, from, path.join(this.options.to, this.sysdir(), to), asset, undefined, false);
            if (this.options.embedflashassets)
                this.images.push(to + '.' + format);
            return [to + '.' + format];
        });
    }
    copyBlob(platform, from, to) {
        return __awaiter(this, void 0, void 0, function* () {
            fs.copySync(from.toString(), path.join(this.options.to, this.sysdir(), to), { clobber: true });
            if (this.options.embedflashassets)
                this.blobs.push(to);
            return [to];
        });
    }
    copyVideo(platform, from, to) {
        return __awaiter(this, void 0, void 0, function* () {
            fs.ensureDirSync(path.join(this.options.to, this.sysdir(), path.dirname(to)));
            yield Converter_1.convert(from, path.join(this.options.to, this.sysdir(), to + '.mp4'), this.options.h264);
            return [to + '.mp4'];
        });
    }
    addShader(shader) {
        if (this.options.embedflashassets)
            this.blobs.push(shader);
    }
}
exports.FlashExporter = FlashExporter;
//# sourceMappingURL=FlashExporter.js.map