import * as path from 'path';
import {KhaExporter} from './KhaExporter';
import * as log from './log';
import * as chokidar from 'chokidar';

export class AssetConverter {
	exporter: KhaExporter;
	platform: string;
	assetMatchers: Array<{ match: string, options: any }>;
	watcher: chokidar.FSWatcher;
	
	constructor(exporter: KhaExporter, platform: string, assetMatchers: Array<{ match: string, options: any }>) {
		this.exporter = exporter;
		this.platform = platform;
		this.assetMatchers = assetMatchers;
	}
	
	watch(watch: boolean, match: string, options: any): Promise<{ from: string, type: string, files: string[] }[]> {
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
				let parsedFiles: { from: string, type: string, files: string[] }[] = [];
				let index = 0;
				for (let file of files) {
					let fileinfo = path.parse(file);
					log.info('Exporting asset ' + (index + 1) + ' of ' + files.length + ' (' + fileinfo.base + ').');
					switch (fileinfo.ext) {
						case '.png':
						case '.jpg':
						case '.jpeg':
						case '.hdr':
							let images = await this.exporter.copyImage(this.platform, file, fileinfo.name, {});
							parsedFiles.push({ from: file, type: 'image', files: images });
							break;
						case '.wav':
							let sounds = await this.exporter.copySound(this.platform, file, fileinfo.name);
							parsedFiles.push({ from: file, type: 'sound', files: sounds });
							break;
						case '.ttf':
							let fonts = await this.exporter.copyFont(this.platform, file, fileinfo.name);
							parsedFiles.push({ from: file, type: 'font', files: fonts });
							break;
						case '.mp4':
						case '.webm':
						case '.wmv':
						case '.avi':
							let videos = await this.exporter.copyVideo(this.platform, file, fileinfo.name);
							parsedFiles.push({ from: file, type: 'video', files: videos });
							break;
						default:
							let blobs = await this.exporter.copyBlob(this.platform, file, fileinfo.name);
							parsedFiles.push({ from: file, type: 'blob', files: blobs });
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
