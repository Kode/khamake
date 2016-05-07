"use strict";
const path = require('path');
const chokidar = require('chokidar');
class AssetConverter {
    constructor(exporter, platform, assetMatchers) {
        this.exporter = exporter;
        this.platform = platform;
        for (let matcher of assetMatchers) {
            console.log('Watching ' + matcher + '.');
        }
        this.watcher = chokidar.watch(assetMatchers, { persistent: true });
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
            //log('Initial scan complete. Ready for changes')
        });
    }
}
exports.AssetConverter = AssetConverter;
//# sourceMappingURL=AssetConverter.js.map