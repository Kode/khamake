import * as path from 'path';
import {KhaExporter} from './KhaExporter';
import * as chokidar from 'chokidar';

export class ShaderCompiler {
	exporter: KhaExporter;
	platform: string;
	watcher: chokidar.FSWatcher;
	
	constructor(exporter: KhaExporter, platform: string, shaderMatchers: Array<string>) {
		this.exporter = exporter;
		this.platform = platform;
		for (let matcher of shaderMatchers) {
			console.log('Watching ' + matcher + '.');
		}
		this.watcher = chokidar.watch(shaderMatchers, { ignored: /[\/\\]\./, persistent: true });
		this.watcher.on('add', (file: string) => {
			
			let fileinfo = path.parse(file);
			console.log('New file: ' + file + ' ' + fileinfo.ext);
			switch (fileinfo.ext) {
				case '.glsl':
					console.log('Compiling ' + fileinfo.name);
					this.compileShader(this.exporter, this.platform, {}, {}, fileinfo.name, 'temp', 'krafix');
					break;
			}
		});
  		this.watcher.on('change', (file: string) => {
			  
		});
		this.watcher.on('unlink', (file: string) => {
			
		});
		this.watcher.on('ready', () => {
			//log('Initial scan complete. Ready for changes')
		});
	}
	
	compileShader(exporter: KhaExporter, platform: string, project: any, shader, to: string, temp: string, compiler: string) {
		
	}
}
