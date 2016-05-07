import * as path from 'path';
import {KhaExporter} from './KhaExporter';
const chokidar = require('chokidar');

export class AssetConverter {
	exporter: KhaExporter;
	platform: string;
	watcher: any;
	
	constructor(exporter: KhaExporter, platform: string, assetMatchers: Array<string>) {
		this.exporter = exporter;
		this.platform = platform;
		for (let matcher of assetMatchers) {
			console.log('Watching ' + matcher + '.');
		}
		this.watcher = chokidar.watch(assetMatchers, { persistent: true });
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
			//log('Initial scan complete. Ready for changes')
		});
	}
}
