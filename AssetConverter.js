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
const chokidar = require('chokidar');
class AssetConverter {
    constructor(exporter, platform, assetMatchers) {
        this.exporter = exporter;
        this.platform = platform;
        this.assetMatchers = assetMatchers;
    }
    watch(watch, match, options) {
        return new Promise((resolve, reject) => {
            this.watcher = chokidar.watch(match, { ignored: /[\/\\]\./, persistent: watch });
            this.watcher.on('add', (file) => {
                let fileinfo = path.parse(file);
                console.log('New file: ' + file + ' ' + fileinfo.ext);
                switch (fileinfo.ext) {
                    case '.png':
                        console.log('Exporting ' + fileinfo.name);
                        this.exporter.copyImage(this.platform, file, fileinfo.name, {});
                        break;
                }
            });
            this.watcher.on('change', (file) => {
            });
            this.watcher.on('ready', () => {
                resolve();
            });
        });
    }
    run(watch) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let matcher of this.assetMatchers) {
                yield this.watch(watch, matcher.match, matcher.options);
            }
        });
    }
}
exports.AssetConverter = AssetConverter;
//# sourceMappingURL=AssetConverter.js.map