import * as child_process from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as chokidar from 'chokidar';
import {KhaExporter} from './Exporters/KhaExporter';
import {GraphicsApi} from './GraphicsApi';
import {Options} from './Options';
import {Platform} from './Platform';
import {AssetConverter} from './AssetConverter';
import * as log from './log';

export class ShaderCompiler {
	exporter: KhaExporter;
	platform: string;
	compiler: string;
	type: string;
	to: string;
	temp: string;
	builddir: string;
	options: Options;
	shaderMatchers: Array<{ match: string, options: any }>;
	watcher: fs.FSWatcher;
	
	constructor(exporter: KhaExporter, platform: string, compiler: string, to: string, temp: string, builddir: string, options: Options, shaderMatchers: Array<{ match: string, options: any }>) {
		this.exporter = exporter;
		if (platform.endsWith('-native')) platform = platform.substr(0, platform.length - '-native'.length);
		if (platform.endsWith('-hl')) platform = platform.substr(0, platform.length - '-hl'.length);
		this.platform = platform;
		this.compiler = compiler;
		this.type = ShaderCompiler.findType(platform, options);
		this.options = options;
		this.to = to;
		this.temp = temp;
		this.builddir = builddir;
		this.shaderMatchers = shaderMatchers;
	}

	static findType(platform: string, options: Options): string {
		switch (platform) {
		case Platform.Empty:
		case Platform.Node: 
			return 'glsl';
		case Platform.Flash:
			return 'agal';
		case Platform.Android:
			if (options.graphics === GraphicsApi.Vulkan) {
				return 'spirv';
			}
			else {
				return 'essl';
			}
		case Platform.HTML5:
		case Platform.DebugHTML5:
		case Platform.HTML5Worker:
		case Platform.Tizen:
		case Platform.Pi:
			return 'essl';
		case Platform.tvOS:
		case Platform.iOS:
			if (options.graphics === GraphicsApi.Metal) {
				return 'metal';
			}
			else {
				return 'essl';
			}
		case Platform.Windows:
			if (options.graphics === GraphicsApi.Vulkan) {
				return 'spirv';
			}
			else if (options.graphics === GraphicsApi.OpenGL || options.graphics === GraphicsApi.OpenGL2) {
				return 'glsl';
			}
			else if (options.graphics === GraphicsApi.Direct3D11 || options.graphics === GraphicsApi.Direct3D12) {
				return 'd3d11';
			}
			else {
				return 'd3d9';
			}
		case Platform.WindowsApp:
			return 'd3d11';
		case Platform.Xbox360:
		case Platform.PlayStation3:
			return 'd3d9';
		case Platform.Linux:
			if (options.graphics === GraphicsApi.Vulkan) {
				return 'spirv';
			}
			else {
				return 'glsl';
			}
		case Platform.OSX:
			if (options.graphics === GraphicsApi.Metal) {
				return 'metal';
			}
			else {
				return 'glsl';
			}
		case Platform.Unity:
			return 'hlsl';
		default:
			for (let p in Platform) {
				if (platform === p) {
					return 'none';
				}
			}
			return 'glsl';
		}
	}

	watch(watch: boolean, match: string, options: any) {
		return new Promise<Array<{ files: Array<string>, name: string }>>((resolve, reject) => {
			let shaders: string[] = [];
			let ready = false;
			this.watcher = chokidar.watch(match, { ignored: /[\/\\]\./, persistent: watch });
			this.watcher.on('add', (file: string) => {
				if (ready) {
					switch (path.parse(file).ext) {
						case '.glsl':
							this.compileShader(file, options);
							break;
					}
				}
				else {
					shaders.push(file);
				}
			});
			this.watcher.on('change', (file: string) => {
				switch (path.parse(file).ext) {
					case '.glsl':
						this.compileShader(file, options);
						break;
				}  
			});
			this.watcher.on('unlink', (file: string) => {
				
			});
			this.watcher.on('ready', async () => {
				ready = true;
				let parsedShaders: { files: string[], name: string }[] = [];
				let index = 0;
				for (let shader of shaders) {
					let parsed = path.parse(shader);
					log.info('Compiling shader ' + (index + 1) + ' of ' + shaders.length + ' (' + parsed.base + ').');
					try {
						await this.compileShader(shader, options);
					}
					catch (error) {
						reject(error);
						return;
					}
					parsedShaders.push({ files: [parsed.name + '.' + this.type], name: AssetConverter.createExportInfo(parsed, false, options, this.exporter.options.from).name});
					++index;
				}
				resolve(parsedShaders);
				return;
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
	
	compileShader(file: string, options: any): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			if (!this.compiler) reject('No shader compiler found.');

			if (this.type === 'none') {
				resolve();
				return;
			}

			let fileinfo = path.parse(file);
			let from = file;
			let to = path.join(this.to, fileinfo.name + '.' + this.type);
			let temp = to + '.temp';
			
			fs.stat(from, (fromErr: NodeJS.ErrnoException, fromStats: fs.Stats) => {
				fs.stat(to, (toErr: NodeJS.ErrnoException, toStats: fs.Stats) => {
					if (fromErr || (!toErr && toStats.mtime.getTime() > fromStats.mtime.getTime())) {
						if (fromErr) log.error('Shader compiler error: ' + fromErr);
						resolve();
					}
					else {
						if (this.type === 'metal') {
							fs.ensureDirSync(path.join(this.builddir, 'Sources'));
							let funcname = fileinfo.name;
							funcname = funcname.replace(/-/g, '_');
							funcname = funcname.replace(/\./g, '_');
							funcname += '_main';

							fs.writeFileSync(to, funcname, 'utf8');

							to = path.join(this.builddir, 'Sources', fileinfo.name + '.' + this.type);
							temp = to + '.temp';
						}
						let parameters = [this.type === 'hlsl' ? 'd3d9' : this.type, from, temp, this.temp, this.platform];
						if (this.options.glsl2) {
							parameters.push('--glsl2');
						}
						if (options.defines) {
							for (let define of options.defines) {
								parameters.push('-D' + define);
							}
						}
						let child = child_process.spawn(this.compiler, parameters);
						
						child.stdout.on('data', (data: any) => {
							log.info(data.toString());
						});

						let errorLine = '';
						let newErrorLine = true;
						let errorData = false;

						function parseData(data: string) {

						}

						child.stderr.on('data', (data: any) => {
							let str: string = data.toString();
							for (let char of str) {
								if (char === '\n') {
									if (errorData) {
										parseData(errorLine.trim());
									}
									else {
										log.error(errorLine.trim());
									}
									errorLine = '';
									newErrorLine = true;
									errorData = false;
								}
								else if (newErrorLine && char === '#') {
									errorData = true;
									newErrorLine = false;
								}
								else {
									errorLine += char;
									newErrorLine = false;
								}
							}
						});

						child.on('close', (code: number) => {
							if (errorLine.trim().length > 0) {
								if (errorData) {
									parseData(errorLine.trim());
								}
								else {
									log.error(errorLine.trim());
								}
							}
							
							if (code === 0) {
								fs.renameSync(temp, to);
								resolve();
							}
							else {
								process.exitCode = 1;
								reject('Shader compiler error.');
							}
						});
					}
				});
			});
		});
	}
}
