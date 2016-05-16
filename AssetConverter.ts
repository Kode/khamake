import * as path from 'path';
import {KhaExporter} from './KhaExporter';
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
	
	watch(watch: boolean, match: string, options: any): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			this.watcher = chokidar.watch(match, { ignored: /[\/\\]\./, persistent: watch });
			this.watcher.on('add', (file: string) => {
				let fileinfo = path.parse(file);
				console.log('New file: ' + file + ' ' + fileinfo.ext);
				switch (fileinfo.ext) {
					case '.png':
						console.log('Exporting ' + fileinfo.name);
						this.exporter.copyImage(this.platform, file, fileinfo.name, {});
						break;
				}
			});
			
			this.watcher.on('change', (file: string) => {
				
			});
			
			this.watcher.on('ready', () => {
				resolve();
			});
		});
	}
	
	async run(watch: boolean) {
		for (let matcher of this.assetMatchers) {
			await this.watch(watch, matcher.match, matcher.options);
		}
	}
}
