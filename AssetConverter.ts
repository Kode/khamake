import * as fs from 'fs';
import * as path from 'path';
import {KhaExporter} from './Exporters/KhaExporter';
import * as log from './log';
import * as chokidar from 'chokidar';

export class AssetConverter {
	exporter: KhaExporter;
	platform: string;
	assetMatchers: Array<{ match: string, options: any }>;
	watcher: fs.FSWatcher;
	
	constructor(exporter: KhaExporter, platform: string, assetMatchers: Array<{ match: string, options: any }>) {
		this.exporter = exporter;
		this.platform = platform;
		this.assetMatchers = assetMatchers;
	}
	
	createName(fileinfo: path.ParsedPath, keepextension: boolean, options: any, from: string): string {
		if (options.name) {
			let name: string = options.name;
			return name.replace(/{name}/g, fileinfo.name).replace(/{ext}/g, fileinfo.ext).replace(/{dir}/g, path.relative(from, fileinfo.dir));
		}
		else if (keepextension) return fileinfo.name + '.' + fileinfo.ext;
		else return fileinfo.name;
	}
	
	watch(watch: boolean, match: string, options: any): Promise<{ name: string, from: string, type: string, files: string[] }[]> {
		return new Promise<{ from: string, type: string, files: string[] }[]>((resolve, reject) => {
			if (!options) options = {};
			let ready = false;
			let files: string[] = [];
			this.watcher = chokidar.watch(match, { ignored: /[\/\\]\./, persistent: watch });
			this.watcher.on('add', (file: string) => {
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
			
			this.watcher.on('change', (file: string) => {
				
			});
			
			this.watcher.on('ready', async () => {
				ready = true;
				let parsedFiles: { name: string, from: string, type: string, files: string[] }[] = [];
				let index = 0;
				for (let file of files) {
					let fileinfo = path.parse(file);
					log.info('Exporting asset ' + (index + 1) + ' of ' + files.length + ' (' + fileinfo.base + ').');
					switch (fileinfo.ext) {
						case '.png':
						case '.jpg':
						case '.jpeg':
						case '.hdr':
							let images = await this.exporter.copyImage(this.platform, file, fileinfo.name, options);
							parsedFiles.push({ name: this.createName(fileinfo, false, options, this.exporter.options.from), from: file, type: 'image', files: images });
							break;
						case '.wav':
							let sounds = await this.exporter.copySound(this.platform, file, fileinfo.name);
							parsedFiles.push({ name: this.createName(fileinfo, false, options, this.exporter.options.from), from: file, type: 'sound', files: sounds });
							break;
						case '.ttf':
							let fonts = await this.exporter.copyFont(this.platform, file, fileinfo.name);
							parsedFiles.push({ name: this.createName(fileinfo, false, options, this.exporter.options.from), from: file, type: 'font', files: fonts });
							break;
						case '.mp4':
						case '.webm':
						case '.wmv':
						case '.avi':
							let videos = await this.exporter.copyVideo(this.platform, file, fileinfo.name);
							parsedFiles.push({ name: this.createName(fileinfo, false, options, this.exporter.options.from), from: file, type: 'video', files: videos });
							break;
						default:
							let blobs = await this.exporter.copyBlob(this.platform, file, fileinfo.name);
							parsedFiles.push({ name: this.createName(fileinfo, true, options, this.exporter.options.from), from: file, type: 'blob', files: blobs });
							break;
					}
					++index;
				}
				resolve(parsedFiles);
			});
		});
	}
	
	async run(watch: boolean): Promise<{ from: string, type: string, files: string[] }[]> {
		let files: { from: string, type: string, files: string[] }[] = [];
		for (let matcher of this.assetMatchers) {
			files = files.concat(await this.watch(watch, matcher.match, matcher.options));
		}
		return files;
	}
}
