import * as child_process from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as chokidar from 'chokidar';
import {KhaExporter} from './Exporters/KhaExporter';
import {GraphicsApi} from './GraphicsApi';
import {Options} from './Options';
import {Platform} from './Platform';
import * as log from './log';

export class ShaderCompiler {
	exporter: KhaExporter;
	platform: string;
	compiler: string;
	type: string;
	to: string;
	temp: string;
	shaderMatchers: Array<{ match: string, options: any }>;
	watcher: fs.FSWatcher;
	
	constructor(exporter: KhaExporter, platform: string, compiler: string, to: string, temp: string, options: Options, shaderMatchers: Array<{ match: string, options: any }>) {
		this.exporter = exporter;
		if (platform.endsWith('-native')) platform = platform.substr(0, platform.length - '-native'.length);
		if (platform.endsWith('-hl')) platform = platform.substr(0, platform.length - '-hl'.length);
		this.platform = platform;
		this.compiler = compiler;
		this.type = ShaderCompiler.findType(platform, options);
		this.to = to;
		this.temp = temp;
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
		case Platform.tvOS:
		case Platform.iOS:
			if (options.graphics === GraphicsApi.Metal) {
				/*let builddir = 'ios-build';
				if (platform === Platform.tvOS) {
					builddir = 'tvos-build';
				}
				if (!Files.isDirectory(to.resolve(Paths.get('..', builddir, 'Sources')))) {
					Files.createDirectories(to.resolve(Paths.get('..', builddir, 'Sources')));
				}
				let funcname = name;
				funcname = funcname.replaceAll('-', '_');
				funcname = funcname.replaceAll('.', '_');
				funcname += '_main';
				fs.writeFileSync(to.resolve(name + ".metal").toString(), funcname, { encoding: 'utf8' });
				compileShader2(compiler, "metal", shader.files[0], to.resolve(Paths.get('..', builddir, 'Sources', name + ".metal")), temp, platform);
				addShader(project, name, ".metal");*/
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
			return 'glsl';
		case Platform.Unity:
			return 'hlsl';
		default:
			return 'none';
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
							this.compileShader(file);
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
						this.compileShader(file);
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
					await this.compileShader(shader);
					let parsed = path.parse(shader);
					log.info('Compiling shader ' + (index + 1) + ' of ' + shaders.length + ' (' + parsed.base + ').');
					parsedShaders.push({ files: [parsed.name + '.' + this.type], name: parsed.name});
					++index;
				}
				resolve(parsedShaders);
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
		return new Promise((resolve, reject) => {
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
						let process = child_process.spawn(this.compiler, [this.type, from, temp, this.temp, this.platform]);
						
						process.stdout.on('data', (data) => {
							log.info(data.toString());
						});

						process.stderr.on('data', (data) => {
							log.info(data.toString());
						});

						process.on('close', (code) => {
							if (code === 0) {
								fs.renameSync(temp, to);
								resolve();
							}
							else reject('Shader compiler error.')
						});
					}
				});
			});
		});
	}
}
