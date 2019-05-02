import * as fs from 'fs-extra';
import * as path from 'path';
import {KhaExporter} from './Exporters/KhaExporter';
import * as log from './log';
import * as chokidar from 'chokidar';
import * as crypto from 'crypto';
import * as Throttle from 'promise-parallel-throttle';
import { Options } from './Options';

export class AssetConverter {
	options: Options;
	exporter: KhaExporter;
	platform: string;
	assetMatchers: Array<{ match: string, options: any }>;
	watcher: fs.FSWatcher;

	constructor(exporter: KhaExporter, options: Options, assetMatchers: Array<{ match: string, options: any }>) {
		this.exporter = exporter;
		this.options = options;
		this.platform = options.target;
		this.assetMatchers = assetMatchers;
	}

	close(): void {
		if (this.watcher) this.watcher.close();
	}

	static replacePattern(pattern: string, value: string, fileinfo: path.ParsedPath, options: any, from: string) {
		let basePath: string = options.nameBaseDir ? path.join(from, options.nameBaseDir) : from;
		let dirValue: string = path.relative(basePath, fileinfo.dir);
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

		return pattern.replace(/{name}/g, value).replace(/{ext}/g, fileinfo.ext).replace(dirRegex, dirValue);
	}

	static createExportInfo(fileinfo: path.ParsedPath, keepextension: boolean, options: any, from: string): {name: string, destination: string} {
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

		if (keepextension && (!options.name || options.name.indexOf('{ext}') < 0)) {
			nameValue += fileinfo.ext;
		}

		if (options.name) {
			nameValue = AssetConverter.replacePattern(options.name, nameValue, fileinfo, options, from);
		}

		return {name: nameValue, destination: destination};
	}

	watch(watch: boolean, match: string, temp: string, options: any): Promise<{ name: string, from: string, type: string, files: string[], original_width: number, original_height: number, readable: boolean }[]> {
		return new Promise<{ name: string, from: string, type: string, files: string[], original_width: number, original_height: number, readable: boolean }[]>((resolve, reject) => {
			let ready = false;
			let files: string[] = [];
			this.watcher = chokidar.watch(match, { ignored: /[\/\\]\.(git|DS_Store)/, persistent: watch });

			const onFileChange = (file: string) => {
				const fileinfo = path.parse(file);
				const baseDir = path.dirname(match);
				let outPath = fileinfo.dir + path.sep + fileinfo.name;
				outPath = path.relative(baseDir, outPath);
				log.info('Reexporting ' + outPath + fileinfo.ext);
				switch (fileinfo.ext) {
					case '.png':
					case '.jpg':
					case '.jpeg':
					case '.hdr': {}
						this.exporter.copyImage(this.platform, file, outPath, {}, {});
						break;

					case '.ogg':
					case '.mp3':
					case '.flac':
					case '.wav': {
						this.exporter.copySound(this.platform, file, outPath, {});
						break;
					}

					case '.mp4':
					case '.webm':
					case '.mov':
					case '.wmv':
					case '.avi': {
						this.exporter.copyVideo(this.platform, file, outPath, {});
						break;
					}

					case '.ttf':
						this.exporter.copyFont(this.platform, file, outPath, {});
						break;

					default:
						this.exporter.copyBlob(this.platform, file, outPath + fileinfo.ext, {});
				}
			};

			this.watcher.on('add', (file: string) => {
				if (ready) {
					onFileChange(file);
				}
				else {
					files.push(file);
				}
			});
			if (watch) {
				this.watcher.on('change', (file: string) => {
					if (ready) {
						onFileChange(file);
					}
				});
			}
			this.watcher.on('ready', async () => {
				ready = true;
				let parsedFiles: { name: string, from: string, type: string, files: string[], original_width: number, original_height: number, readable: boolean }[] = [];
				let cache: any = {};
				let cachePath = path.join(temp, 'cache.json');
				if (fs.existsSync(cachePath)) {
					cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
				}

				const self = this;

				async function convertAsset( file: string, index: number ) {
					let fileinfo = path.parse(file);
					log.info('Exporting asset ' + (index + 1) + ' of ' + files.length + ' (' + fileinfo.base + ').');
					const ext = fileinfo.ext.toLowerCase();
					switch (ext) {
						case '.png':
						case '.jpg':
						case '.jpeg':
						case '.hdr': {
							let exportInfo = AssetConverter.createExportInfo(fileinfo, false, options, self.exporter.options.from);
							let images: string[];
							if (options.noprocessing) {
								images = await self.exporter.copyBlob(self.platform, file, exportInfo.destination, options);
							}
							else {
								images = await self.exporter.copyImage(self.platform, file, exportInfo.destination, options, cache);
							}
							if (!options.notinlist) {
								parsedFiles.push({ name: exportInfo.name, from: file, type: 'image', files: images, original_width: options.original_width, original_height: options.original_height, readable: options.readable });
							}
							break;
						}
						case '.ogg':
						case '.mp3':
						case '.flac':
						case '.wav': {
							let exportInfo = AssetConverter.createExportInfo(fileinfo, false, options, self.exporter.options.from);
							let sounds: string[];
							if (options.noprocessing) {
								sounds = await self.exporter.copyBlob(self.platform, file, exportInfo.destination, options);
							}
							else {
								sounds = await self.exporter.copySound(self.platform, file, exportInfo.destination, options);
							}
							if (sounds.length === 0) {
								throw 'Audio file ' + file + ' could not be exported, you have to specify a path to ffmpeg.';
							}
							if (!options.notinlist) {
								parsedFiles.push({ name: exportInfo.name, from: file, type: 'sound', files: sounds, original_width: undefined, original_height: undefined, readable: undefined });
							}
							break;
						}
						case '.ttf': {
							let exportInfo = AssetConverter.createExportInfo(fileinfo, false, options, self.exporter.options.from);
							let fonts: string[];
							if (options.noprocessing) {
								fonts = await self.exporter.copyBlob(self.platform, file, exportInfo.destination, options);
							}
							else {
								fonts = await self.exporter.copyFont(self.platform, file, exportInfo.destination, options);
							}
							if (!options.notinlist) {
								parsedFiles.push({ name: exportInfo.name, from: file, type: 'font', files: fonts, original_width: undefined, original_height: undefined, readable: undefined });
							}
							break;
						}
						case '.mp4':
						case '.webm':
						case '.mov':
						case '.wmv':
						case '.avi': {
							let exportInfo = AssetConverter.createExportInfo(fileinfo, false, options, self.exporter.options.from);
							let videos: string[];
							if (options.noprocessing) {
								videos = await self.exporter.copyBlob(self.platform, file, exportInfo.destination, options);
							}
							else {
								videos = await self.exporter.copyVideo(self.platform, file, exportInfo.destination, options);
							}
							if (videos.length === 0) {
								log.error('Video file ' + file + ' could not be exported, you have to specify a path to ffmpeg.');
							}
							if (!options.notinlist) {
								parsedFiles.push({ name: exportInfo.name, from: file, type: 'video', files: videos, original_width: undefined, original_height: undefined, readable: undefined });
							}
							break;
						}
						default: {
							let exportInfo = AssetConverter.createExportInfo(fileinfo, true, options, self.exporter.options.from);
							let blobs = await self.exporter.copyBlob(self.platform, file, exportInfo.destination, options);
							if (!options.notinlist) {
								parsedFiles.push({ name: exportInfo.name, from: file, type: 'blob', files: blobs, original_width: undefined, original_height: undefined, readable: undefined });
							}
							break;
						}
					}
				}

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
				} else {
					let index = 0;
					for (let file of files) {
						await convertAsset(file, index);
						index += 1;
					}
				}

				fs.ensureDirSync(temp);
				fs.writeFileSync(cachePath, JSON.stringify(cache), { encoding: 'utf8'});
				resolve(parsedFiles);
			});
		});
	}

	async run(watch: boolean, temp: string): Promise<{ name: string, from: string, type: string, files: string[], original_width: number, original_height: number, readable: boolean }[]> {
		let files: { name: string, from: string, type: string, files: string[], original_width: number, original_height: number, readable: boolean }[] = [];
		for (let matcher of this.assetMatchers) {
			files = files.concat(await this.watch(watch, matcher.match, temp, matcher.options));
		}
		return files;
	}
}
