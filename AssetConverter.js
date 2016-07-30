"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const path = require('path');
const log = require('./log');
const chokidar = require('chokidar');
class AssetConverter {
    constructor(exporter, platform, assetMatchers) {
        this.exporter = exporter;
        this.platform = platform;
        this.assetMatchers = assetMatchers;
    }
    createName(fileinfo, keepextension, options, from) {
        if (options.name) {
            let name = options.name;
            return name.replace(/{name}/g, fileinfo.name).replace(/{ext}/g, fileinfo.ext).replace(/{dir}/g, path.relative(from, fileinfo.dir));
        }
        else if (keepextension)
            return fileinfo.name + '.' + fileinfo.ext;
        else
            return fileinfo.name;
    }
    watch(watch, match, options) {
        return new Promise((resolve, reject) => {
            if (!options)
                options = {};
            let ready = false;
            let files = [];
            this.watcher = chokidar.watch(match, { ignored: /[\/\\]\./, persistent: watch });
            this.watcher.on('add', (file) => {
                if (ready) {
                    let fileinfo = path.parse(file);
                    switch (fileinfo.ext) {
                        case '.png':
                            this.exporter.copyImage(this.platform, file, fileinfo.name, {});
                            break;
                    }
                }
                else {
                    files.push(file);
                }
            });
            this.watcher.on('change', (file) => {
            });
            this.watcher.on('ready', () => __awaiter(this, void 0, void 0, function* () {
                ready = true;
                let parsedFiles = [];
                let index = 0;
                for (let file of files) {
                    let fileinfo = path.parse(file);
                    log.info('Exporting asset ' + (index + 1) + ' of ' + files.length + ' (' + fileinfo.base + ').');
                    switch (fileinfo.ext) {
                        case '.png':
                        case '.jpg':
                        case '.jpeg':
                        case '.hdr':
                            let images = yield this.exporter.copyImage(this.platform, file, fileinfo.name, options);
                            parsedFiles.push({ name: this.createName(fileinfo, false, options, this.exporter.options.from), from: file, type: 'image', files: images });
                            break;
                        case '.wav':
                            let sounds = yield this.exporter.copySound(this.platform, file, fileinfo.name);
                            parsedFiles.push({ name: this.createName(fileinfo, false, options, this.exporter.options.from), from: file, type: 'sound', files: sounds });
                            break;
                        case '.ttf':
                            let fonts = yield this.exporter.copyFont(this.platform, file, fileinfo.name);
                            parsedFiles.push({ name: this.createName(fileinfo, false, options, this.exporter.options.from), from: file, type: 'font', files: fonts });
                            break;
                        case '.mp4':
                        case '.webm':
                        case '.wmv':
                        case '.avi':
                            let videos = yield this.exporter.copyVideo(this.platform, file, fileinfo.name);
                            parsedFiles.push({ name: this.createName(fileinfo, false, options, this.exporter.options.from), from: file, type: 'video', files: videos });
                            break;
                        default:
                            let blobs = yield this.exporter.copyBlob(this.platform, file, fileinfo.name);
                            parsedFiles.push({ name: this.createName(fileinfo, true, options, this.exporter.options.from), from: file, type: 'blob', files: blobs });
                            break;
                    }
                    ++index;
                }
                resolve(parsedFiles);
            }));
        });
    }
    run(watch) {
        return __awaiter(this, void 0, Promise, function* () {
            let files = [];
            for (let matcher of this.assetMatchers) {
                files = files.concat(yield this.watch(watch, matcher.match, matcher.options));
            }
            return files;
        });
    }
}
exports.AssetConverter = AssetConverter;
//# sourceMappingURL=AssetConverter.js.map