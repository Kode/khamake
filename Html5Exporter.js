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
const Options_1 = require('./Options');
const ImageTool_1 = require('./ImageTool');
const HaxeProject_1 = require('./HaxeProject');
class Html5Exporter extends KhaExporter_1.KhaExporter {
    constructor(khaDirectory, directory) {
        super(khaDirectory, directory);
        this.addSourceDirectory(path.join(khaDirectory.toString(), 'Backends/HTML5'));
    }
    sysdir() {
        return 'html5';
    }
    exportSolution(name, platform, khaDirectory, haxeDirectory, from, _targetOptions, defines) {
        return __awaiter(this, void 0, void 0, function* () {
            fs.ensureDirSync(path.join(this.directory, this.sysdir()));
            defines.push('sys_g1');
            defines.push('sys_g2');
            defines.push('sys_g3');
            defines.push('sys_g4');
            defines.push('sys_a1');
            defines.push('sys_a2');
            if (this.sysdir() === 'node') {
                defines.push('sys_node');
                defines.push('sys_server');
                defines.push('nodejs');
            }
            else {
                defines.push('sys_' + platform);
            }
            if (this.sysdir() === 'debug-html5') {
                defines.push('sys_debug_html5');
                this.parameters.push('-debug');
            }
            const options = {
                from: from.toString(),
                to: path.join(this.sysdir(), 'kha.js'),
                sources: this.sources,
                libraries: this.libraries,
                defines: defines,
                parameters: this.parameters,
                haxeDirectory: haxeDirectory.toString(),
                system: this.sysdir(),
                language: 'js',
                width: this.width,
                height: this.height,
                name: name
            };
            HaxeProject_1.writeHaxeProject(this.directory.toString(), options);
            if (this.sysdir() === 'debug-html5') {
                let index = path.join(this.directory, this.sysdir(), 'index.html');
                if (!fs.existsSync(index)) {
                    let protoindex = fs.readFileSync(path.join(__dirname, 'Data', 'debug-html5', 'index.html'), { encoding: 'utf8' });
                    protoindex = protoindex.replace(/{Name}/g, name);
                    protoindex = protoindex.replace(/{Width}/g, '' + this.width);
                    protoindex = protoindex.replace(/{Height}/g, '' + this.height);
                    fs.writeFileSync(index.toString(), protoindex);
                }
                let pack = path.join(this.directory, this.sysdir(), 'package.json');
                let protopackage = fs.readFileSync(path.join(__dirname, 'Data', 'debug-html5', 'package.json'), { encoding: 'utf8' });
                protopackage = protopackage.replace(/{Name}/g, name);
                fs.writeFileSync(pack.toString(), protopackage);
                let electron = path.join(this.directory, this.sysdir(), 'electron.js');
                let protoelectron = fs.readFileSync(path.join(__dirname, 'Data', 'debug-html5', 'electron.js'), { encoding: 'utf8' });
                protoelectron = protoelectron.replace(/{Width}/g, '' + this.width);
                protoelectron = protoelectron.replace(/{Height}/g, '' + this.height);
                fs.writeFileSync(electron.toString(), protoelectron);
            }
            else {
                let index = path.join(this.directory, this.sysdir(), 'index.html');
                if (!fs.existsSync(index)) {
                    let protoindex = fs.readFileSync(path.join(__dirname, 'Data', 'html5', 'index.html'), { encoding: 'utf8' });
                    protoindex = protoindex.replace(/{Name}/g, name);
                    protoindex = protoindex.replace(/{Width}/g, '' + this.width);
                    protoindex = protoindex.replace(/{Height}/g, '' + this.height);
                    fs.writeFileSync(index.toString(), protoindex);
                }
            }
            if (Options_1.Options.compilation) {
            }
            else {
                return 0;
            }
        });
    }
    /*copyMusic(platform, from, to, encoders, callback) {
        Files.createDirectories(this.directory.resolve(this.sysdir()).resolve(to).parent());
        Converter.convert(from, this.directory.resolve(this.sysdir()).resolve(to + '.ogg'), encoders.oggEncoder, (ogg) => {
            Converter.convert(from, this.directory.resolve(this.sysdir()).resolve(to + '.mp4'), encoders.aacEncoder, (mp4) => {
                var files = [];
                if (ogg) files.push(to + '.ogg');
                if (mp4) files.push(to + '.mp4');
                callback(files);
            });
        });
    }*/
    copySound(platform, from, to, encoders) {
        return __awaiter(this, void 0, void 0, function* () {
            fs.ensureDirSync(path.join(this.directory, this.sysdir(), path.dirname(to)));
            let ogg = yield Converter_1.convert(from, path.join(this.directory, this.sysdir(), to + '.ogg'), encoders.oggEncoder);
            let mp4 = yield Converter_1.convert(from, path.join(this.directory, this.sysdir(), to + '.mp4'), encoders.aacEncoder);
            var files = [];
            if (ogg)
                files.push(to + '.ogg');
            if (mp4)
                files.push(to + '.mp4');
            return files;
        });
    }
    copyImage(platform, from, to, asset) {
        return __awaiter(this, void 0, void 0, function* () {
            let format = yield ImageTool_1.exportImage(from, path.join(this.directory, this.sysdir(), to), asset, undefined, false);
            return [to + '.' + format];
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
            let mp4 = yield Converter_1.convert(from, path.join(this.directory, this.sysdir(), to + '.mp4'), encoders.h264Encoder);
            let webm = yield Converter_1.convert(from, path.join(this.directory, this.sysdir(), to + '.webm'), encoders.webmEncoder);
            let files = [];
            if (mp4)
                files.push(to + '.mp4');
            if (webm)
                files.push(to + '.webm');
            return files;
        });
    }
}
exports.Html5Exporter = Html5Exporter;
//# sourceMappingURL=Html5Exporter.js.map