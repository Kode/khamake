import * as child_process from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as chokidar from 'chokidar';
import {KhaExporter} from './KhaExporter';
import * as log from './log';

export class ShaderCompiler {
	exporter: KhaExporter;
	platform: string;
	compiler: string;
	type: string;
	system: string;
	to: string;
	temp: string;
	watcher: chokidar.FSWatcher;
	
	constructor(exporter: KhaExporter, platform: string, compiler: string, type: string, system: string, to: string, temp: string, shaderMatchers: Array<string>) {
		this.exporter = exporter;
		this.platform = platform;
		this.compiler = compiler;
		this.type = type;
		this.system = system;
		this.to = to;
		this.temp = temp;
		
		for (let matcher of shaderMatchers) {
			console.log('Watching ' + matcher + '.');
		}
		this.watcher = chokidar.watch(shaderMatchers, { ignored: /[\/\\]\./, persistent: true });
		this.watcher.on('add', (file: string) => {
			switch (path.parse(file).ext) {
				case '.glsl':
					this.compileShader(file);
					break;
			}
		});
  		this.watcher.on('change', (file: string) => {
			switch (path.parse(file).ext) {
				case '.glsl':
					this.compileShader(file);
					break;
			}  
		});
		this.watcher.on('unlink', (file: string) => {
			
		});
		this.watcher.on('ready', () => {
			//log('Initial scan complete. Ready for changes')
		});
	}
	
	compileShader(file: string) {
		return new Promise((resolve, reject) => {
			if (!this.compiler) reject('No shader compiler found.');
		
			let fileinfo = path.parse(file);
			let from = file;
			let to = path.join(this.to, fileinfo.name + '.' + this.type);
			
			fs.stat(from, (fromErr: NodeJS.ErrnoException, fromStats: fs.Stats) => {
				fs.stat(to, (toErr: NodeJS.ErrnoException, toStats: fs.Stats) => {
					if (fromErr || toErr || toStats.mtime.getTime() > fromStats.mtime.getTime()) {
						log.info('Not compiling ' + file);
						resolve();
					}
					else {
						log.info('Compiling ' + file + ' to ' + path.join(to, fileinfo.name + '.' + this.type));
						let process = child_process.spawn(this.compiler, [this.type, from, to, this.temp, this.system]);
						
						process.stdout.on('data', (data) => {
							log.info(data.toString());
						});

						process.stderr.on('data', (data) => {
							log.info(data.toString());
						});

						process.on('close', (code) => {
							if (code === 0) resolve();
							else reject('Shader compiler error.')
						});
					}
				});
			});
		});
	}
}
