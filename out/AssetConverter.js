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
    static createName(fileinfo, keepextension, options, from) {
        if (options.name) {
            let name = options.name;
            let basePath = options.nameBaseDir ? path.join(from, options.nameBaseDir) : from;
            let dirValue = path.relative(basePath, fileinfo.dir);
            if (basePath.length > 0
                && basePath[basePath.length - 1] == path.sep
                && dirValue.length > 0
                && dirValue[dirValue.length - 1] != path.sep)
                dirValue += path.sep;
            if (options.namePathSeparator)
                dirValue = dirValue.split(path.sep).join(options.namePathSeparator);
            let nameValue = fileinfo.name;
            if (keepextension && name.indexOf("{ext}") < 0)
                nameValue += fileinfo.ext;
            return name.replace(/{name}/g, nameValue).replace(/{ext}/g, fileinfo.ext).replace(/{dir}/g, dirValue);
        }
        else if (keepextension)
            return fileinfo.name + fileinfo.ext;
        else
            return fileinfo.name;
    }
    watch(watch, match, options) {
        return new Promise((resolve, reject) => {
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
                        case '.hdr': {
                            let name = AssetConverter.createName(fileinfo, false, options, this.exporter.options.from);
                            let images = yield this.exporter.copyImage(this.platform, file, name, options);
                            parsedFiles.push({ name: name, from: file, type: 'image', files: images, original_width: options.original_width, original_height: options.original_height });
                            break;
                        }
                        case '.wav': {
                            let name = AssetConverter.createName(fileinfo, false, options, this.exporter.options.from);
                            let sounds = yield this.exporter.copySound(this.platform, file, name);
                            parsedFiles.push({ name: name, from: file, type: 'sound', files: sounds, original_width: undefined, original_height: undefined });
                            break;
                        }
                        case '.ttf': {
                            let name = AssetConverter.createName(fileinfo, false, options, this.exporter.options.from);
                            let fonts = yield this.exporter.copyFont(this.platform, file, name);
                            parsedFiles.push({ name: name, from: file, type: 'font', files: fonts, original_width: undefined, original_height: undefined });
                            break;
                        }
                        case '.mp4':
                        case '.webm':
                        case '.wmv':
                        case '.avi': {
                            let name = AssetConverter.createName(fileinfo, false, options, this.exporter.options.from);
                            let videos = yield this.exporter.copyVideo(this.platform, file, name);
                            parsedFiles.push({ name: name, from: file, type: 'video', files: videos, original_width: undefined, original_height: undefined });
                            break;
                        }
                        default: {
                            let name = AssetConverter.createName(fileinfo, true, options, this.exporter.options.from);
                            let blobs = yield this.exporter.copyBlob(this.platform, file, name);
                            parsedFiles.push({ name: name, from: file, type: 'blob', files: blobs, original_width: undefined, original_height: undefined });
                            break;
                        }
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