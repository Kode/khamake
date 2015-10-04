"use strict";

const child_process = require('child_process');
const fs = require('fs-extra');
const os = require('os');
const pathlib = require('path');
const exec = require('./exec.js');
const korepath = require('./korepath.js');
const log = require('./log.js');
const Files = require('./Files.js');
const GraphicsApi = require('./GraphicsApi.js');
const VrApi = require('./VrApi.js');
const Options = require('./Options.js');
const Path = require('./Path.js');
const Paths = require('./Paths.js');
const Platform = require('./Platform.js');
const ProjectFile = require('./ProjectFile.js');
const VisualStudioVersion = require('./VisualStudioVersion.js');

const AndroidExporter = require('./AndroidExporter.js');
const FlashExporter = require('./FlashExporter.js');
const Html5Exporter = require('./Html5Exporter.js');
const Html5WorkerExporter = require('./Html5WorkerExporter.js');
const JavaExporter = require('./JavaExporter.js');
const KoreExporter = require('./KoreExporter.js');
const NodeExporter = require('./NodeExporter.js');
const PlayStationMobileExporter = require('./PlayStationMobileExporter.js');
const WpfExporter = require('./WpfExporter.js');
const XnaExporter = require('./XnaExporter.js');
const UnityExporter = require('./UnityExporter.js');

function escapeRegExp(string) {
	return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

String.prototype.replaceAll = function (find, replace) {
	return this.replace(new RegExp(escapeRegExp(find), 'g'), replace);
};

function compileShader(compiler, type, from, to, temp, system, kfx) {
	if (compiler !== '') {
		let compiler_process = child_process.spawn(compiler, [type, from.toString(), to.toString(), temp.toString(), system, kfx]);

		compiler_process.stdout.on('data', (data) => {
			if (data.toString().trim() !== '' && type !== 'agal') log.info('Shader compiler stdout: ' + data);
		});

		compiler_process.stderr.on('data', (data) => {
			if (data.toString().trim() !== '' && type !== 'agal') log.info('Shader compiler stderr: ' + data);
		});
		
		compiler_process.on('error', (err) => {
			log.error('Shader compiler error: ' + err);
		});

		compiler_process.on('close', (code) => {
			if (code !== 0) log.info('Shader compiler process exited with code ' + code + ' while trying to compile ' + from.toString());
		});
	}
}

function addShader(project, name, extension) {
	project.shaders.push({files: [name + extension], name: name});
}

function addShaders(exporter, platform, project, from, to, temp, shaderPath, compiler, kfx) {
	if (!Files.isDirectory(shaderPath)) return;
	let shaders = Files.newDirectoryStream(shaderPath);
	for (let shader of shaders) {
		let name = shader;
		if (!name.endsWith('.glsl')) continue;
		if (name.endsWith('.inc.glsl')) continue;
		name = name.substr(0, name.lastIndexOf('.'));
		switch (platform) {
			case Platform.Flash: {
				if (Files.exists(shaderPath.resolve(name + '.agal'))) Files.copy(shaderPath.resolve(name + '.agal'), to.resolve(name + '.agal'), true);
				else compileShader(compiler, 'agal', shaderPath.resolve(name + '.glsl'), to.resolve(name + '.agal'), temp, platform, kfx);
				addShader(project, name, '.agal');
				exporter.addShader(name + '.agal');
				break;
			}
			case Platform.HTML5:
			case Platform.HTML5 + '-native':
			case Platform.HTML5Worker:
			case Platform.Android:
			case Platform.Android + '-native':
			case Platform.Tizen:
			case Platform.Linux:
			case Platform.iOS: {
				if (Options.graphicsApi === GraphicsApi.Metal) {
					if (!Files.isDirectory(to.resolve(Paths.get('..', 'ios-build', 'Sources')))) {
						Files.createDirectories(to.resolve(Paths.get('..', 'ios-build', 'Sources')));
					}
					var funcname = name;
					funcname = funcname.replaceAll('-', '_');
					funcname = funcname.replaceAll('.', '_');
					funcname += '_main';
					fs.writeFileSync(to.resolve(name + ".metal").toString(), funcname, { encoding: 'utf8' });
					if (Files.exists(shaderPath.resolve(name + ".metal"))) Files.copy(shaderPath.resolve(name + ".metal"), to.resolve(Paths.get('..', 'ios-build', 'Sources', name + ".metal")), true);
					else compileShader(compiler, "metal", shaderPath.resolve(name + '.glsl'), to.resolve(Paths.get('..', 'ios-build', 'Sources', name + ".metal")), temp, platform, kfx);
					addShader(project, name, ".metal");
				}
				else {
					var shaderpath = to.resolve(name + '.essl');
					if (platform === Platform.Android) {
						shaderpath = to.resolve(Paths.get(exporter.safename, 'app', 'src', 'main', 'assets', name + '.essl'));
					}
					if (Files.exists(shaderPath.resolve(name + ".essl"))) Files.copy(shaderPath.resolve(name + ".essl"), shaderpath, true);
					else compileShader(compiler, "essl", shaderPath.resolve(name + '.glsl'), shaderpath, temp, platform, kfx);
					addShader(project, name, ".essl");
				}
				break;
			}
			case Platform.Windows: {
				if (Options.graphicsApi == GraphicsApi.OpenGL || Options.graphicsApi == GraphicsApi.OpenGL2) {
					if (compiler == "") Files.copy(shaderPath.resolve(name + ".glsl"), to.resolve(name + ".glsl"), true);
					else compileShader(compiler, "glsl", shaderPath.resolve(name + '.glsl'), to.resolve(name + ".glsl"), temp, platform, kfx);
					addShader(project, name, ".glsl");
				}
				else if (Options.graphicsApi === GraphicsApi.Direct3D11 || Options.graphicsApi === GraphicsApi.Direct3D12) {
					if (Files.exists(shaderPath.resolve(name + ".d3d11"))) Files.copy(shaderPath.resolve(name + ".d3d11"), to.resolve(name + ".d3d11"), true);
					else compileShader(compiler, "d3d11", shaderPath.resolve(name + '.glsl'), to.resolve(name + ".d3d11"), temp, platform, kfx);
					addShader(project, name, ".d3d11");
				}
				else {
					if (Files.exists(shaderPath.resolve(name + ".d3d9"))) Files.copy(shaderPath.resolve(name + ".d3d9"), to.resolve(name + ".d3d9"), true);
					else compileShader(compiler, "d3d9", shaderPath.resolve(name + '.glsl'), to.resolve(name + ".d3d9"), temp, platform, kfx);
					addShader(project, name, ".d3d9");
				}
				break;
			}
			case Platform.WindowsApp: {
				if (Files.exists(shaderPath.resolve(name + ".d3d11"))) Files.copy(shaderPath.resolve(name + ".d3d11"), to.resolve(name + ".d3d11"), true);
				else compileShader(compiler, "d3d11", shaderPath.resolve(name + '.glsl'), to.resolve(name + ".d3d11"), temp, platform, kfx);
				addShader(project, name, ".d3d11");
				break;
			}
			case Platform.Xbox360:
			case Platform.PlayStation3: {
				if (Files.exists(shaderPath.resolve(name + ".d3d9"))) Files.copy(shaderPath.resolve(name + ".d3d9"), to.resolve(name + ".d3d9"), true);
				else compileShader(compiler, "d3d9", shaderPath.resolve(name + '.glsl'), to.resolve(name + ".d3d9"), temp, platform, kfx);
				addShader(project, name, ".d3d9");
				break;
			}
			case Platform.OSX: {
				if (compiler == "") Files.copy(shaderPath.resolve(name + ".glsl"), to.resolve(name + ".glsl"), true);
				else compileShader(compiler, "glsl", shaderPath.resolve(name + '.glsl'), to.resolve(name + ".glsl"), temp, platform, kfx);
				addShader(project, name, ".glsl");
				break;
			}
			case Platform.Unity: {
				if (Files.exists(shaderPath.resolve(name + ".hlsl"))) Files.copy(shaderPath.resolve(name + ".hlsl"), to.resolve(name + ".hlsl"), true);
				else compileShader(compiler, "d3d9", shaderPath.resolve(name + '.glsl'), to.resolve(name + ".hlsl"), temp, platform, kfx);
				addShader(project, name, ".hlsl");
				break;
			}
			case Platform.WPF:
			case Platform.XNA:
			case Platform.Java:
			case Platform.PlayStationMobile:
			case Platform.Node: {
				break;
			}
			default: {
				var customCompiler = compiler;
				if (fs.existsSync(pathlib.join(from.toString(), 'Backends'))) {
					var libdirs = fs.readdirSync(pathlib.join(from.toString(), 'Backends'));
					for (var ld in libdirs) {
						var libdir = pathlib.join(from.toString(), 'Backends', libdirs[ld]);
						if (fs.statSync(libdir).isDirectory()) {
							var exe = pathlib.join(libdir, 'krafix', 'krafix-' + platform + '.exe');
							if (fs.existsSync(exe)) {
								customCompiler = exe;
							}
						}
					}
				}
				compileShader(customCompiler, platform, shaderPath.resolve(name + '.glsl'), to.resolve(name + '.' + platform), temp, platform, kfx);
				addShader(project, name, '.' + platform);
				break;
			}
		}
	}
}

function fixPaths(paths) {
	for (let p in paths) {
		paths[p] = paths[p].replaceAll('\\', '/');
	}
}

function exportAssets(assets, index, exporter, from, khafolders, platform, encoders, callback) {
	if (index >= assets.length) {
		callback();
		return;
	}
	let asset = assets[index];
	log.info('Exporting asset ' + (index + 1) + ' of ' + assets.length + ' (' + asset.file + ').');
	if (asset.type === 'image') {
		let file;
		if (asset.libdir !== undefined) {
			file = from.resolve(Paths.get(asset.libdir, 'Assets', asset.file));
		}
		else {
			file = from.resolve(Paths.get('Assets', asset.file));
		}
		exporter.copyImage(platform, file, asset.file.substr(0, asset.file.lastIndexOf('.')), asset, function (files) {
			fixPaths(files);
			asset.files = files;
			delete asset.file;
			exportAssets(assets, index + 1, exporter, from, khafolders, platform, encoders, callback);
		});
	}
	else if (asset.type === 'music') {
		let file;
		if (asset.libdir !== undefined) {
			file = from.resolve(Paths.get(asset.libdir, 'Assets', asset.file));
		}
		else {
			file = from.resolve(Paths.get('Assets', asset.file));
		}
		exporter.copyMusic(platform, file, asset.file.substr(0, asset.file.lastIndexOf('.')), encoders, function (files) {
			fixPaths(files);
			asset.files = files;
			delete asset.file;
			exportAssets(assets, index + 1, exporter, from, khafolders, platform, encoders, callback);
		});
	}
	else if (asset.type === 'sound') {
		let file;
		if (asset.libdir !== undefined) {
			file = from.resolve(Paths.get(asset.libdir, 'Assets', asset.file));
		}
		else {
			file = from.resolve(Paths.get('Assets', asset.file));
		}
		exporter.copySound(platform, file, asset.file.substr(0, asset.file.lastIndexOf('.')), encoders, function (files) {
			fixPaths(files);
			asset.files = files;
			delete asset.file;
			exportAssets(assets, index + 1, exporter, from, khafolders, platform, encoders, callback);
		});
	}
	else if (asset.type === 'blob') {
		let file;
		if (asset.libdir !== undefined) {
			file = from.resolve(Paths.get(asset.libdir, 'Assets', asset.file));
		}
		else {
			file = from.resolve(Paths.get('Assets', asset.file));
		}
		exporter.copyBlob(platform, file, asset.file, function (files) {
			fixPaths(files);
			asset.files = files;
			delete asset.file;
			exportAssets(assets, index + 1, exporter, from, khafolders, platform, encoders, callback);
		});
	}
	else if (asset.type === 'video') {
		let file;
		if (asset.libdir !== undefined) {
			file = from.resolve(Paths.get(asset.libdir, 'Assets', asset.file));
		}
		else {
			file = from.resolve(Paths.get('Assets', asset.file));
		}
		exporter.copyVideo(platform, file, asset.file.substr(0, asset.file.lastIndexOf('.')), encoders, function (files) {
			fixPaths(files);
			asset.files = files;
			delete asset.file;
			exportAssets(assets, index + 1, exporter, from, khafolders, platform, encoders, callback);
		});
	}
	else if (asset.type === 'font') {
		let file;
		if (asset.libdir !== undefined) {
			file = from.resolve(Paths.get(asset.libdir, 'Assets', asset.file));
		}
		else {
			file = from.resolve(Paths.get('Assets', asset.file));
		}
		asset.file = asset.name + asset.size;
		if (asset.bold) {
			asset.file += "#Bold";
		}
		if (asset.italic) {
			asset.file += "#Italic";
		}
		asset.file += '.kravur';
		asset.name = asset.file;
		asset.type = 'blob';
		exporter.copyFont(platform, file, asset.file, asset, encoders, function (files) {
			fixPaths(files);
			asset.files = files;
			delete asset.file;
			exportAssets(assets, index + 1, exporter, from, khafolders, platform, encoders, callback);
		});
	}
}

function exportProjectFiles(name, from, to, options, exporter, platform, khaDirectory, haxeDirectory, kore, libraries, callback) {
	if (haxeDirectory.path !== '') exporter.exportSolution(name, platform, khaDirectory, haxeDirectory, from, function () {
		if (haxeDirectory.path !== '' && kore) {
			{
				fs.copySync(pathlib.join(__dirname, 'Data', 'build-korefile.js'), pathlib.join(to.resolve(exporter.sysdir() + "-build").toString(), 'korefile.js'));

				let out = '';
				out += "var solution = new Solution('" + name + "');\n";
				out += "var project = new Project('" + name + "');\n";

				out += "project.setDebugDir('" + from.relativize(to.resolve(exporter.sysdir())).toString().replaceAll('\\', '/') + "');\n";

				let buildpath = from.relativize(to.resolve(exporter.sysdir() + "-build")).toString().replaceAll('\\', '/');
				if (buildpath.startsWith('..')) buildpath = pathlib.resolve(pathlib.join(from.toString(), buildpath));
				out += "project.addSubProject(Solution.createProject('" + buildpath.replaceAll('\\', '/') + "'));\n";
				out += "project.addSubProject(Solution.createProject('" + pathlib.normalize(options.kha).replaceAll('\\', '/') + "'));\n";
				out += "project.addSubProject(Solution.createProject('" + pathlib.join(options.kha, 'Kore').replaceAll('\\', '/') + "'));\n";
				out += "solution.addProject(project);\n";

				/*out += "if (fs.existsSync('Libraries')) {\n";
				out += "\tvar libraries = fs.readdirSync('Libraries');\n";
				out += "\tfor (var l in libraries) {\n";
				out += "\t\tvar lib = libraries[l];\n";
				out += "\t\tif (fs.existsSync(path.join('Libraries', lib, 'korefile.js'))) {\n";
				out += "\t\t\tproject.addSubProject(Solution.createProject('Libraries/' + lib));\n";
				out += "\t\t}\n";
				out += "\t}\n";
				out += "}\n";*/

				for (let lib of libraries) {
					out += "if (fs.existsSync(path.join('" + lib.directory.replaceAll('\\', '/') + "', 'korefile.js'))) {\n";
					out += "\tproject.addSubProject(Solution.createProject('" + lib.directory.replaceAll('\\', '/') + "'));\n";
					out += "}\n";
				}

				out += 'return solution;\n';
				fs.writeFileSync(from.resolve("korefile.js").toString(), out);
			}

			{
				require(pathlib.join(korepath.get(), 'main.js')).run(
				{
					from: from,
					to: to.resolve(Paths.get(exporter.sysdir() + "-build")).toString(),
					target: koreplatform(platform),
					graphics: Options.graphicsApi,
					vrApi: Options.vrApi,
					visualstudio: Options.visualStudioVersion,
					compile: options.compile,
					run: options.run
				},
				{
					info: log.info,
					error: log.error
				},
				function () {
					log.info('Done.');
					callback(name);
				});
			}
		}
		else {
			log.info('Done.');
			callback(name);
		}
	});
}

function koreplatform(platform) {
	if (platform === 'android-native') {
		return 'android';
	}
	if (platform === 'html5-native') {
		return 'html5';
	}
	return platform;
}

function exportKhaProject(from, to, platform, khaDirectory, haxeDirectory, oggEncoder, aacEncoder, mp3Encoder, h264Encoder, webmEncoder, wmvEncoder, theoraEncoder, kfx, krafix, khafolders, embedflashassets, options, callback) {
	log.info('Creating Kha project.');
	
	Files.createDirectories(to);
	let temp = to.resolve('temp');
	Files.createDirectories(temp);
	
	let exporter = null;
	let kore = false;
	switch (platform) {
		case Platform.Flash:
			exporter = new FlashExporter(khaDirectory, to, embedflashassets);
			break;
		case Platform.HTML5:
			exporter = new Html5Exporter(khaDirectory, to);
			break;
		case Platform.HTML5Worker:
			exporter = new Html5WorkerExporter(khaDirectory, to);
			break;
		case Platform.WPF:
			exporter = new WpfExporter(khaDirectory, to);
			break;
		case Platform.XNA:
			exporter = new XnaExporter(khaDirectory, to);
			break;
		case Platform.Java:
			exporter = new JavaExporter(khaDirectory, to);
			break;
		case Platform.PlayStationMobile:
			exporter = new PlayStationMobileExporter(khaDirectory, to);
			break;
		case Platform.Android:
			exporter = new AndroidExporter(khaDirectory, to);
			break;
		case Platform.Node:
			exporter = new NodeExporter(khaDirectory, to);
			break;
		case Platform.Unity:
			exporter = new UnityExporter(khaDirectory, to);
			break;
		default:
			kore = true;
			exporter = new KoreExporter(platform, khaDirectory, Options.vrApi, to);
			break;
	}

	Files.createDirectories(to.resolve(exporter.sysdir()));
	
	let name = '';
	let sources = [];
	let project = {
		format: 1,
		game: {
			name: "Unknown",
			width: 640,
			height: 480
		},
		assets: [],
		rooms: []
	};

	let foundProjectFile = false;
	if (name === '') name = from.toAbsolutePath().getFileName();
	project.game.name = name;
	
	if (Files.exists(from.resolve('project.kha'))) {
		project = ProjectFile(from);
		foundProjectFile = true;
	}

	let libraries = [];
	if (project.libraries !== undefined) {
		for (let libname of project.libraries) {
			var found = false;
			if (Files.isDirectory(from.resolve(Paths.get('Libraries', libname)))) {
				if (Files.newDirectoryStream(from.resolve(Paths.get('Libraries', libname))).length > 0) {
					let lib = {
						directory: 'Libraries/' + libname,
						project: {
							assets: [],
							rooms: []
						}
					};
					if (Files.exists(from.resolve(Paths.get('Libraries', libname, 'project.kha')))) {
						lib.project = JSON.parse(fs.readFileSync(from.resolve('Libraries', libname, 'project.kha').toString(), {encoding: 'utf8'}));
					}
					libraries.push(lib);
					found = true;
				}
			}

			if (!found) {
				if (process.env.HAXEPATH) {
					var libpath = pathlib.join(process.env.HAXEPATH, 'lib', libname.toLowerCase());
					if (fs.existsSync(libpath) && fs.statSync(libpath).isDirectory()) {
						let current;
						let libdeeppath;
						if (fs.existsSync(pathlib.join(libpath, '.current'))) {
							current = fs.readFileSync(pathlib.join(libpath, '.current'), {encoding: 'utf8'});
							libdeeppath = pathlib.join(libpath, current.replaceAll('.', ','));
						}
						else if (fs.existsSync(pathlib.join(libpath, '.dev'))) {
							current = fs.readFileSync(pathlib.join(libpath, '.dev'), {encoding: 'utf8'});
							libdeeppath = current;
						}
						if (fs.existsSync(libdeeppath) && fs.statSync(libdeeppath).isDirectory()) {
							let lib = {
								directory: libdeeppath,
								project: {
									assets: [],
									rooms: []
								}
							};
							if (Files.exists(from.resolve(Paths.get(libdeeppath, 'project.kha')))) {
								lib.project = JSON.parse(fs.readFileSync(from.resolve(libdeeppath, 'project.kha').toString(), { encoding: 'utf8' }));
							}
							libraries.push(lib);
							found = true;
						}
					}
				}
			}

			if (!found) {
				console.log('Warning, could not find library ' + libname + '.');
			}
		}
	}

	name = project.game.name;
	exporter.setWidthAndHeight(project.game.width, project.game.height);
	exporter.setName(name);

	if (project.sources !== undefined) {
		for (let i = 0; i < project.sources.length; ++i) {
			sources.push(project.sources[i]);
		}
	}
	for (let lib of libraries) {
		for (let asset of lib.project.assets) {
			asset.libdir = lib.directory;
			project.assets.push(asset);
		}
		for (let room of lib.project.rooms) {
			project.rooms.push(room);
		}

		if (Files.isDirectory(from.resolve(Paths.get(lib.directory, 'Sources')))) {
			sources.push(lib.directory + '/Sources');
		}
		if (lib.project.sources !== undefined) {
			for (let i = 0; i < project.sources.length; ++i) {
				sources.push(lib.directory + '/' + project.sources[i]);
			}
		}
	}

	let encoders = {
		oggEncoder: oggEncoder,
		aacEncoder: aacEncoder,
		mp3Encoder: mp3Encoder,
		h264Encoder: h264Encoder,
		webmEncoder: webmEncoder,
		wmvEncoder: wmvEncoder,
		theoraEncoder: theoraEncoder,
		kravur: options.kravur
	};
	exportAssets(project.assets, 0, exporter, from, khafolders, platform, encoders, function () {
		project.shaders = [];
		let shaderDir = to.resolve(exporter.sysdir());
		if (platform === Platform.Unity) {
			shaderDir = to.resolve(Paths.get(exporter.sysdir(), 'Assets', 'Shaders'));
			if (!Files.exists(shaderDir)) Files.createDirectories(shaderDir);
		}
		addShaders(exporter, platform, project, from, shaderDir, temp, from.resolve(Paths.get('Sources', 'Shaders')), options.nokrafix ? kfx : krafix, kfx);
		addShaders(exporter, platform, project, from, shaderDir, temp, from.resolve(Paths.get(options.kha, 'Sources', 'Shaders')), krafix, kfx);
		for (let i = 0; i < sources.length; ++i) {
			addShaders(exporter, platform, project, from, shaderDir, temp, from.resolve(sources[i]).resolve('Shaders'), options.nokrafix ? kfx : krafix, kfx);
			exporter.addSourceDirectory(sources[i]);
		}
		if (platform === Platform.Unity) {
			let proto = fs.readFileSync(from.resolve(Paths.get(options.kha, 'Tools', 'khamake', 'Data', 'unity', 'Shaders', 'proto.shader')).toString(), { encoding: 'utf8' });
			for (let i1 = 0; i1 < project.shaders.length; ++i1) {
				if (project.shaders[i1].name.endsWith('.vert')) {
					for (let i2 = 0; i2 < project.shaders.length; ++i2) {
						if (project.shaders[i2].name.endsWith('.frag')) {
							let shadername = project.shaders[i1].name + '.' + project.shaders[i2].name;
							let proto2 = proto.replaceAll('{name}', shadername);
							proto2 = proto2.replaceAll('{vert}', project.shaders[i1].name);
							proto2 = proto2.replaceAll('{frag}', project.shaders[i2].name);
							fs.writeFileSync(shaderDir.resolve(shadername + '.shader').toString(), proto2, { encoding: 'utf8'});
						}
					}
				}
			}
			for (let i = 0; i < project.shaders.length; ++i) {
				fs.writeFileSync(to.resolve(Paths.get(exporter.sysdir(), 'Assets', 'Resources', 'Blobs', project.shaders[i].files[0] + '.bytes')).toString(), project.shaders[i].name, { encoding: 'utf8'});
			}
		}
		
		function secondPass() {
			let hxslDir = pathlib.join('build', 'Shaders');
			if (fs.existsSync(hxslDir) && fs.readdirSync(hxslDir).length > 0) { 
				addShaders(exporter, platform, project, from, to.resolve(exporter.sysdir()), temp, from.resolve(Paths.get(hxslDir)), krafix, kfx);
				if (foundProjectFile) {	
					fs.writeFileSync(temp.resolve('project.kha').toString(), JSON.stringify(project, null, '\t'), { encoding: 'utf8' });
					exporter.copyBlob(platform, temp.resolve('project.kha'), 'project.kha', function () {
						log.info('Assets done.');
						exportProjectFiles(name, from, to, options, exporter, platform, khaDirectory, haxeDirectory, kore, libraries, callback);
					});
				}
				else {
					exportProjectFiles(name, from, to, options, exporter, platform, khaDirectory, haxeDirectory, kore, libraries,callback);
				}
			}
		}

		if (foundProjectFile) {	
			fs.writeFileSync(temp.resolve('project.kha').toString(), JSON.stringify(project, null, '\t'), { encoding: 'utf8' });
			exporter.copyBlob(platform, temp.resolve('project.kha'), 'project.kha', function () {
				log.info('Assets done.');
				exportProjectFiles(name, from, to, options, exporter, platform, khaDirectory, haxeDirectory, kore, libraries, secondPass);
			});
		}
		else {
			exportProjectFiles(name, from, to, options, exporter, platform, khaDirectory, haxeDirectory, kore, libraries, secondPass);
		}
	});
}

function isKhaProject(directory) {
	return Files.exists(directory.resolve('Kha')) || Files.exists(directory.resolve('project.kha'));
}

function exportProject(from, to, platform, khaDirectory, haxeDirectory, oggEncoder, aacEncoder, mp3Encoder, h264Encoder, webmEncoder, wmvEncoder, theoraEncoder, kfx, krafix, khafolders, embedflashassets, options, callback) {
	if (isKhaProject(from)) {
		exportKhaProject(from, to, platform, khaDirectory, haxeDirectory, oggEncoder, aacEncoder, mp3Encoder, h264Encoder, webmEncoder, wmvEncoder, theoraEncoder, kfx, krafix, khafolders, embedflashassets, options, callback);
	}
	else {
		log.error('Neither Kha directory nor project.kha found.');
		callback('Unknown');
	}
}

exports.api = 1;

exports.run = function (options, loglog, callback) {
	log.set(loglog);

	let done = (name) => {
		if (options.target === Platform.Linux && options.run) {
			log.info('Running...');
			var run = child_process.spawn(
				pathlib.join(process.cwd(), options.to, 'linux-build', name),
				[],
				{ cwd: pathlib.join(process.cwd(), options.to, 'linux') });

			run.stdout.on('data', function (data) {
				log.info(data.toString());
			});

			run.stderr.on('data', function (data) {
				log.error(data.toString());
			});

			run.on('close', function (code) {
				callback(name);
			});
		}
		else callback(name);
	};

	if (options.kha === undefined || options.kha === '') {
		let p = pathlib.join(__dirname, '..', '..');
		if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
			options.kha = p;
		}
	}
	else {
		options.kha = pathlib.resolve(options.kha);
	}

	if (options.haxe === '') {
		let path = Paths.get(options.kha, 'Tools', 'haxe');
		if (Files.isDirectory(path)) options.haxe = path.toString();
	}
	
	if (options.kfx === '') {
		let path = Paths.get(options.kha, "Kore", "Tools", "kfx", "kfx" + exec.sys());
		if (Files.exists(path)) options.kfx = path.toString();
	}

	if (options.krafix === '' || options.krafix === undefined) {
		let path = Paths.get(options.kha, "Kore", "Tools", "krafix", "krafix" + exec.sys());
		if (Files.exists(path)) options.krafix = path.toString();
	}
	
	if (options.ogg === '') {
		let path = Paths.get(options.kha, "Tools", "oggenc", "oggenc" + exec.sys());
		if (Files.exists(path)) options.ogg = path.toString() + ' {in} -o {out} --quiet';
	}

	if (options.kravur === '' || options.kravur === undefined) {
		let path = Paths.get(options.kha, 'Tools', 'kravur', 'kravur' + exec.sys());
		if (Files.exists(path)) options.kravur = path.toString() + ' {in} {size} {out}';
	}
	
	if (options.graphics !== undefined) {
		Options.graphicsApi = options.graphics;
	}
	
	if (options.visualstudio !== undefined) {
		Options.visualStudioVersion = options.visualstudio;	
	}

	if (options.vr != undefined) {
		Options.vrApi = options.vr;
		//log.info("Vr API is: " + Options.vrApi);
	}
	
	if (options.visualStudioVersion !== undefined) {
		Options.visualStudioVersion = options.visualStudioVersion;	
	}

	exportProject(Paths.get(options.from), Paths.get(options.to), options.target, Paths.get(options.kha), Paths.get(options.haxe), options.ogg, options.aac, options.mp3, options.h264, options.webm, options.wmv, options.theora, options.kfx, options.krafix, false, options.embedflashassets, options, done);
};
