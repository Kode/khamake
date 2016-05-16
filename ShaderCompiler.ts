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
	shaderMatchers: Array<{ match: string, options: any }>;
	watcher: chokidar.FSWatcher;
	
	constructor(exporter: KhaExporter, platform: string, compiler: string, type: string, system: string, to: string, temp: string, shaderMatchers: Array<{ match: string, options: any }>) {
		this.exporter = exporter;
		this.platform = platform;
		this.compiler = compiler;
		this.type = type;
		this.system = system;
		this.to = to;
		this.temp = temp;
		this.shaderMatchers = shaderMatchers;
	}
	
	addShader(project, name, extension) {
		project.exportedShaders.push({files: [name + extension], name: name});
	}
	
	watch(watch: boolean, match: string, options: any) {
		return new Promise<Array<{ files: Array<string>, name: string }>>((resolve, reject) => {
			let shaders: Array<{ files: Array<string>, name: string }> = [];
			let ready = false;
			
			this.watcher = chokidar.watch(match, { ignored: /[\/\\]\./, persistent: watch });
			this.watcher.on('add', (file: string) => {
				if (ready) {
					switch (path.parse(file).ext) {
						case '.glsl':
							this.compileShader(file);
							break;
					}
				}
				else {
					let parsed = path.parse(file);
					shaders.push({ files: [parsed.name + this.type], name: parsed.name});
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
			this.watcher.on('ready', async () => {
				ready = true;
				for (let shader of shaders) {
					await this.compileShader(shader.name + '.glsl');
				}
				resolve(shaders);
			});
		});
	}
	
	async run(watch: boolean): Promise<Array<{ files: Array<string>, name: string }>> {
		let shaders: Array<{ files: Array<string>, name: string }> = [];
		for (let matcher of this.shaderMatchers) {
			shaders = shaders.concat(await this.watch(watch, matcher.match, matcher.options));
		}
		return shaders;
	}
	
	compileShader(file: string) {
		/*
		let shaderpath = path.join(to, name + '.essl');
		await compileShader2(compiler, "essl", shader.files[0], shaderpath, temp, platform);
		addShader(project, name, ".essl");
		*/
		
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
