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
class Html5Exporter extends KhaExporter_1.KhaExporter {
    constructor(options) {
        super(options);
        this.addSourceDirectory(path.join(options.kha, 'Backends', 'HTML5'));
    }
    sysdir() {
        return 'html5';
    }
    isDebugHtml5() {
        return this.sysdir() === 'debug-html5';
    }
    isNode() {
        return this.sysdir() === 'node';
    }
    haxeOptions(name, defines) {
        defines.push('sys_g1');
        defines.push('sys_g2');
        defines.push('sys_g3');
        defines.push('sys_g4');
        defines.push('sys_a1');
        defines.push('sys_a2');
        if (this.isNode()) {
            defines.push('sys_node');
            defines.push('sys_server');
            defines.push('nodejs');
        }
        else {
            defines.push('sys_' + this.options.target);
        }
        if (this.isDebugHtml5()) {
            defines.push('sys_debug_html5');
            this.parameters.push('-debug');
        }
        return {
            from: this.options.from.toString(),
            to: path.join(this.sysdir(), 'kha.js'),
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
            if (this.isDebugHtml5()) {
                let index = path.join(this.options.to, this.sysdir(), 'index.html');
                if (!fs.existsSync(index)) {
                    let protoindex = fs.readFileSync(path.join(__dirname, '..', '..', 'Data', 'debug-html5', 'index.html'), { encoding: 'utf8' });
                    protoindex = protoindex.replace(/{Name}/g, name);
                    protoindex = protoindex.replace(/{Width}/g, '' + this.width);
                    protoindex = protoindex.replace(/{Height}/g, '' + this.height);
                    fs.writeFileSync(index.toString(), protoindex);
                }
                let pack = path.join(this.options.to, this.sysdir(), 'package.json');
                let protopackage = fs.readFileSync(path.join(__dirname, '..', '..', 'Data', 'debug-html5', 'package.json'), { encoding: 'utf8' });
                protopackage = protopackage.replace(/{Name}/g, name);
                fs.writeFileSync(pack.toString(), protopackage);
                let electron = path.join(this.options.to, this.sysdir(), 'electron.js');
                let protoelectron = fs.readFileSync(path.join(__dirname, '..', '..', 'Data', 'debug-html5', 'electron.js'), { encoding: 'utf8' });
                protoelectron = protoelectron.replace(/{Width}/g, '' + this.width);
                protoelectron = protoelectron.replace(/{Height}/g, '' + this.height);
                fs.writeFileSync(electron.toString(), protoelectron);
            }
            else if (this.isNode()) {
                let pack = path.join(this.options.to, this.sysdir(), 'package.json');
                let protopackage = fs.readFileSync(path.join(__dirname, '..', '..', 'Data', 'node', 'package.json'), { encoding: 'utf8' });
                protopackage = protopackage.replace(/{Name}/g, name);
                fs.writeFileSync(pack.toString(), protopackage);
            }
            else {
                let index = path.join(this.options.to, this.sysdir(), 'index.html');
                if (!fs.existsSync(index)) {
                    let protoindex = fs.readFileSync(path.join(__dirname, '..', '..', 'Data', 'html5', 'index.html'), { encoding: 'utf8' });
                    protoindex = protoindex.replace(/{Name}/g, name);
                    protoindex = protoindex.replace(/{Width}/g, '' + this.width);
                    protoindex = protoindex.replace(/{Height}/g, '' + this.height);
                    fs.writeFileSync(index.toString(), protoindex);
                }
            }
            return haxeOptions;
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
    copySound(platform, from, to) {
        return __awaiter(this, void 0, void 0, function* () {
            fs.ensureDirSync(path.join(this.options.to, this.sysdir(), path.dirname(to)));
            let ogg = yield Converter_1.convert(from, path.join(this.options.to, this.sysdir(), to + '.ogg'), this.options.ogg);
            let mp4 = null;
            if (!this.isDebugHtml5()) {
                mp4 = yield Converter_1.convert(from, path.join(this.options.to, this.sysdir(), to + '.mp4'), this.options.aac);
            }
            var files = [];
            if (ogg)
                files.push(to + '.ogg');
            if (mp4)
                files.push(to + '.mp4');
            return files;
        });
    }
    copyImage(platform, from, to, options) {
        return __awaiter(this, void 0, void 0, function* () {
            let format = yield ImageTool_1.exportImage(this.options.kha, from, path.join(this.options.to, this.sysdir(), to), options, undefined, false);
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
            let mp4 = null;
            if (!this.isDebugHtml5()) {
                mp4 = yield Converter_1.convert(from, path.join(this.options.to, this.sysdir(), to + '.mp4'), this.options.h264);
            }
            let webm = yield Converter_1.convert(from, path.join(this.options.to, this.sysdir(), to + '.webm'), this.options.webm);
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