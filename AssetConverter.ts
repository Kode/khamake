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
	
	static createName(fileinfo: path.ParsedPath, keepextension: boolean, options: any, from: string): string {
		if (options.name) {
			let name: string = options.name;
			let basePath: string = options.nameBaseDir ? path.join(from, options.nameBaseDir) : from;
			let dirValue: string = path.relative(basePath, fileinfo.dir);
            if (basePath.length > 0 
                && basePath[basePath.length - 1] == path.sep 
                && dirValue.length > 0
                && dirValue[dirValue.length - 1] != path.sep) 
                    dirValue += path.sep;
            if (options.namePathSeparator)
                dirValue = dirValue.split(path.sep).join(options.namePathSeparator);
			let nameValue = fileinfo.name;
			if(keepextension && name.indexOf("{ext}") < 0)
				nameValue += fileinfo.ext;
			return name.replace(/{name}/g, nameValue).replace(/{ext}/g, fileinfo.ext).replace(/{dir}/g, dirValue);
		}
		else if (keepextension) return fileinfo.name + fileinfo.ext;
		else return fileinfo.name;
	}
	
	watch(watch: boolean, match: string, options: any): Promise<{ name: string, from: string, type: string, files: string[], original_width:number, original_height:number }[]> {
		return new Promise<{ from: string, type: string, files: string[] }[]>((resolve, reject) => {
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
				let parsedFiles: { name: string, from: string, type: string, files: string[], original_width:number, original_height:number }[] = [];
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
							let images = await this.exporter.copyImage(this.platform, file, name, options);
							parsedFiles.push({ name: name, from: file, type: 'image', files: images, original_width:options.original_width, original_height:options.original_height });
							break;
						}
						case '.wav': {
							let name = AssetConverter.createName(fileinfo, false, options, this.exporter.options.from);
							let sounds = await this.exporter.copySound(this.platform, file, name);
							parsedFiles.push({ name: name, from: file, type: 'sound', files: sounds, original_width:undefined, original_height:undefined });
							break;
						}
						case '.ttf': {
							let name = AssetConverter.createName(fileinfo, false, options, this.exporter.options.from);
							let fonts = await this.exporter.copyFont(this.platform, file, name);
							parsedFiles.push({ name: name, from: file, type: 'font', files: fonts, original_width:undefined, original_height:undefined });
							break;
						}
						case '.mp4':
						case '.webm':
						case '.wmv':
						case '.avi': {
							let name = AssetConverter.createName(fileinfo, false, options, this.exporter.options.from);
							let videos = await this.exporter.copyVideo(this.platform, file, name);
							parsedFiles.push({ name: name, from: file, type: 'video', files: videos, original_width:undefined, original_height:undefined });
							break;
						}
						default: {
							let name = AssetConverter.createName(fileinfo, true, options, this.exporter.options.from);
							let blobs = await this.exporter.copyBlob(this.platform, file, name);
							parsedFiles.push({ name: name, from: file, type: 'blob', files: blobs, original_width:undefined, original_height:undefined });
							break;
						}
					}
					++index;
				}
				resolve(parsedFiles);
			});
		});
	}
	
	async run(watch: boolean): Promise<{ name: string, from: string, type: string, files: string[], original_width:number, original_height:number }[]> {
		let files: { name: string, from: string, type: string, files: string[], original_width:number, original_height:number }[] = [];
		for (let matcher of this.assetMatchers) {
			files = files.concat(await this.watch(watch, matcher.match, matcher.options));
		}
		return files;
	}
}
