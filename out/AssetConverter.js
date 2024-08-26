"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetConverter = void 0;
const ProjectFile_1 = require("./ProjectFile");
const fs = require("fs-extra");
const path = require("path");
const log = require("./log");
const chokidar = require("chokidar");
const crypto = require("crypto");
const Throttle = require("promise-parallel-throttle");
class AssetConverter {
    constructor(exporter, options, assetMatchers) {
        this.exporter = exporter;
        this.options = options;
        this.platform = options.target;
        this.assetMatchers = assetMatchers;
    }
    close() {
        if (this.watcher)
            this.watcher.close();
    }
    static replacePattern(pattern, name, fileinfo, options, from) {
        let basePath = options.nameBaseDir ? path.join(from, options.nameBaseDir) : from;
        let dirValue = path.relative(basePath, fileinfo.dir);
        if (basePath.length > 0 && basePath[basePath.length - 1] === path.sep
            && dirValue.length > 0 && dirValue[dirValue.length - 1] !== path.sep) {
            dirValue += path.sep;
        }
        if (options.namePathSeparator) {
            dirValue = dirValue.split(path.sep).join(options.namePathSeparator);
        }
        const dirRegex = dirValue === ''
            ? /{dir}\//g
            : /{dir}/g;
        return pattern.replace(/{name}/g, name).replace(/{ext}/g, fileinfo.ext).replace(dirRegex, dirValue);
    }
    static createExportInfo(fileinfo, keepextension, options, from) {
        let nameValue = fileinfo.name;
        let destination = fileinfo.name;
        if (options.md5sum) {
            let data = fs.readFileSync(path.join(fileinfo.dir, fileinfo.base));
            let md5sum = crypto.createHash('md5').update(data).digest('hex'); // TODO yield generateMd5Sum(file);
            destination += '_' + md5sum;
        }
        if ((keepextension || options.noprocessing) && (!options.destination || options.destination.indexOf('{ext}') < 0)) {
            destination += fileinfo.ext;
        }
        if (options.destination) {
            destination = AssetConverter.replacePattern(options.destination, destination, fileinfo, options, from);
        }
        if (options.destinationCallback) {
            destination = options.destinationCallback(destination);
        }
        if (keepextension && (!options.name || options.name.indexOf('{ext}') < 0)) {
            nameValue += fileinfo.ext;
        }
        if (options.name) {
            nameValue = AssetConverter.replacePattern(options.name, nameValue, fileinfo, options, from);
        }
        return { name: nameValue, destination: destination };
    }
    watch(watch, match, temp, options) {
        return new Promise((resolve, reject) => {
            let ready = false;
            let files = [];
            this.watcher = chokidar.watch(match, { ignored: /[\/\\]\.(svn|git|DS_Store)/, persistent: watch, followSymlinks: false });
            const onFileChange = async (file) => {
                const fileinfo = path.parse(file);
                let outPath = fileinfo.name;
                // with subfolders
                if (options.destination) {
                    const from = path.resolve(options.baseDir, '..');
                    outPath = AssetConverter.replacePattern(options.destination, fileinfo.name, fileinfo, options, from);
                }
                log.info('Reexporting ' + outPath + fileinfo.ext);
                switch (fileinfo.ext) {
                    case '.png':
                    case '.jpg':
                    case '.jpeg':
                    case '.hdr':
                        { }
                        await this.exporter.copyImage(this.platform, file, outPath, {}, {});
                        break;
                    case '.ogg':
                    case '.mp3':
                    case '.flac':
                    case '.wav': {
                        await this.exporter.copySound(this.platform, file, outPath, {});
                        break;
                    }
                    case '.mp4':
                    case '.webm':
                    case '.mov':
                    case '.wmv':
                    case '.avi': {
                        await this.exporter.copyVideo(this.platform, file, outPath, {});
                        break;
                    }
                    case '.ttf':
                        await this.exporter.copyFont(this.platform, file, outPath, {});
                        break;
                    default:
                        await this.exporter.copyBlob(this.platform, file, outPath + fileinfo.ext, {});
                }
                for (let callback of ProjectFile_1.Callbacks.postAssetReexporting) {
                    callback(outPath + fileinfo.ext);
                }
            };
            this.watcher.on('add', (file) => {
                if (ready) {
                    onFileChange(file);
                }
                else {
                    files.push(file);
                }
            });
            if (watch) {
                this.watcher.on('change', (file) => {
                    if (ready) {
                        onFileChange(file);
                    }
                });
            }
            this.watcher.on('ready', async () => {
                ready = true;
                let parsedFiles = [];
                let cache = {};
                let cachePath = path.join(temp, 'cache.json');
                if (fs.existsSync(cachePath)) {
                    cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
                }
                const convertAsset = async (file, index) => {
                    let fileinfo = path.parse(file);
                    log.info('Exporting asset ' + (index + 1) + ' of ' + files.length + ' (' + fileinfo.base + ').');
                    const ext = fileinfo.ext.toLowerCase();
                    switch (ext) {
                        case '.png':
                        case '.jpg':
                        case '.jpeg':
                        case '.hdr': {
                            let exportInfo = AssetConverter.createExportInfo(fileinfo, false, options, this.exporter.options.from);
                            let images;
                            if (options.noprocessing) {
                                images = await this.exporter.copyBlob(this.platform, file, exportInfo.destination, options);
                            }
                            else {
                                images = await this.exporter.copyImage(this.platform, file, exportInfo.destination, options, cache);
                            }
                            if (!options.notinlist) {
                                parsedFiles.push({ name: exportInfo.name, from: file, type: 'image', files: images.files, file_sizes: images.sizes, original_width: options.original_width, original_height: options.original_height, readable: options.readable });
                            }
                            break;
                        }
                        case '.ogg':
                        case '.mp3':
                        case '.flac':
                        case '.wav': {
                            if (!this.canDecodeFormat(ext)) {
                                log.error(`Error: ${fileinfo.base} should be in wav format, or use \`--ffmpeg\` option to convert ogg/mp3/flac files`);
                                process.exit(1);
                            }
                            let exportInfo = AssetConverter.createExportInfo(fileinfo, false, options, this.exporter.options.from);
                            let sounds;
                            if (options.noprocessing) {
                                sounds = await this.exporter.copyBlob(this.platform, file, exportInfo.destination, options);
                            }
                            else {
                                sounds = await this.exporter.copySound(this.platform, file, exportInfo.destination, options);
                            }
                            if (sounds.files.length === 0) {
                                throw 'Audio file ' + file + ' could not be exported, you have to specify a path to ffmpeg.';
                            }
                            if (!options.notinlist) {
                                parsedFiles.push({ name: exportInfo.name, from: file, type: 'sound', files: sounds.files, file_sizes: sounds.sizes, original_width: undefined, original_height: undefined, readable: undefined });
                            }
                            break;
                        }
                        case '.ttf': {
                            let exportInfo = AssetConverter.createExportInfo(fileinfo, false, options, this.exporter.options.from);
                            let fonts;
                            if (options.noprocessing) {
                                fonts = await this.exporter.copyBlob(this.platform, file, exportInfo.destination, options);
                            }
                            else {
                                fonts = await this.exporter.copyFont(this.platform, file, exportInfo.destination, options);
                            }
                            if (!options.notinlist) {
                                parsedFiles.push({ name: exportInfo.name, from: file, type: 'font', files: fonts.files, file_sizes: fonts.sizes, original_width: undefined, original_height: undefined, readable: undefined });
                            }
                            break;
                        }
                        case '.mp4':
                        case '.webm':
                        case '.mov':
                        case '.wmv':
                        case '.avi': {
                            let exportInfo = AssetConverter.createExportInfo(fileinfo, false, options, this.exporter.options.from);
                            let videos;
                            if (options.noprocessing) {
                                videos = await this.exporter.copyBlob(this.platform, file, exportInfo.destination, options);
                            }
                            else {
                                videos = await this.exporter.copyVideo(this.platform, file, exportInfo.destination, options);
                            }
                            if (videos.files.length === 0) {
                                log.error('Video file ' + file + ' could not be exported, you have to specify a path to ffmpeg.');
                            }
                            if (!options.notinlist) {
                                parsedFiles.push({ name: exportInfo.name, from: file, type: 'video', files: videos.files, file_sizes: videos.sizes, original_width: undefined, original_height: undefined, readable: undefined });
                            }
                            break;
                        }
                        default: {
                            let exportInfo = AssetConverter.createExportInfo(fileinfo, true, options, this.exporter.options.from);
                            let blobs = await this.exporter.copyBlob(this.platform, file, exportInfo.destination, options);
                            if (!options.notinlist) {
                                parsedFiles.push({ name: exportInfo.name, from: file, type: 'blob', files: blobs.files, file_sizes: blobs.sizes, original_width: undefined, original_height: undefined, readable: undefined });
                            }
                            break;
                        }
                    }
                };
                if (this.options.parallelAssetConversion !== 0) {
                    let todo = files.map((file, index) => {
                        return async () => {
                            await convertAsset(file, index);
                        };
                    });
                    let processes = this.options.parallelAssetConversion === -1
                        ? require('os').cpus().length - 1
                        : this.options.parallelAssetConversion;
                    await Throttle.all(todo, {
                        maxInProgress: processes,
                    });
                }
                else {
                    let index = 0;
                    for (let file of files) {
                        await convertAsset(file, index);
                        index += 1;
                    }
                }
                fs.ensureDirSync(temp);
                fs.writeFileSync(cachePath, JSON.stringify(cache), { encoding: 'utf8' });
                resolve(parsedFiles);
            });
        });
    }
    async run(watch, temp) {
        let files = [];
        for (let matcher of this.assetMatchers) {
            files = files.concat(await this.watch(watch, matcher.match, temp, matcher.options));
        }
        return files;
    }
}
exports.AssetConverter = AssetConverter;
//# sourceMappingURL=AssetConverter.js.map