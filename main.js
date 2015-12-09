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

function compileShader2(compiler, type, from, to, temp, system, kfx) {
	if (compiler !== '') {
		let result = child_process.spawnSync(compiler, [type, from.toString(), to.toString(), temp.toString(), system, kfx]);

		if (result.stdout.toString() !== '') {
			log.info(result.stdout.toString());
		}

		if (result.stderr.toString() !== '') {
			log.info(result.stderr.toString());
		}

		if (result.error) {
			log.error('Compilation of shader ' + from + ' failed: ' + result.error);
		}
	}
}

function addShader(project, name, extension) {
	project.exportedShaders.push({files: [name + extension], name: name});
}

function compileShader(exporter, platform, project, shader, to, temp, compiler, kfx) {
	let name = shader.name;
	if (name.endsWith('.inc')) return;
	switch (platform) {
		case Platform.Node: {
			Files.copy(shader.files[0], to.resolve(name + '.glsl'), true);
			addShader(project, name, '.glsl');
			exporter.addShader(name + '.glsl');
			break;
		}
		case Platform.Flash: {
			compileShader2(compiler, 'agal', shader.files[0], to.resolve(name + '.agal'), temp, platform, kfx);
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
				compileShader2(compiler, "metal", shader.files[0], to.resolve(Paths.get('..', 'ios-build', 'Sources', name + ".metal")), temp, platform, kfx);
				addShader(project, name, ".metal");
			}
			else {
				var shaderpath = to.resolve(name + '.essl');
				if (platform === Platform.Android) {
					shaderpath = to.resolve(Paths.get(exporter.safename, 'app', 'src', 'main', 'assets', name + '.essl'));
				}
				compileShader2(compiler, "essl", shader.files[0], shaderpath, temp, platform, kfx);
				addShader(project, name, ".essl");
			}
			break;
		}
		case Platform.Windows: {
			if (Options.graphicsApi == GraphicsApi.OpenGL || Options.graphicsApi == GraphicsApi.OpenGL2) {
				compileShader2(compiler, "glsl", shader.files[0], to.resolve(name + ".glsl"), temp, platform, kfx);
				addShader(project, name, ".glsl");
			}
			else if (Options.graphicsApi === GraphicsApi.Direct3D11 || Options.graphicsApi === GraphicsApi.Direct3D12) {
				compileShader2(compiler, "d3d11", shader.files[0], to.resolve(name + ".d3d11"), temp, platform, kfx);
				addShader(project, name, ".d3d11");
			}
			else {
				compileShader2(compiler, "d3d9", shader.files[0], to.resolve(name + ".d3d9"), temp, platform, kfx);
				addShader(project, name, ".d3d9");
			}
			break;
		}
		case Platform.WindowsApp: {
			compileShader2(compiler, "d3d11", shader.files[0], to.resolve(name + ".d3d11"), temp, platform, kfx);
			addShader(project, name, ".d3d11");
			break;
		}
		case Platform.Xbox360:
		case Platform.PlayStation3: {
			compileShader2(compiler, "d3d9", shader.files[0], to.resolve(name + ".d3d9"), temp, platform, kfx);
			addShader(project, name, ".d3d9");
			break;
		}
		case Platform.OSX: {
			compileShader2(compiler, "glsl", shader.files[0], to.resolve(name + ".glsl"), temp, platform, kfx);
			addShader(project, name, ".glsl");
			break;
		}
		case Platform.Unity: {
			compileShader2(compiler, "d3d9", shader.files[0], to.resolve(name + ".hlsl"), temp, platform, kfx);
			addShader(project, name, ".hlsl");
			break;
		}
		case Platform.WPF:
		case Platform.XNA:
		case Platform.Java:
		case Platform.PlayStationMobile:
			break;
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
			compileShader2(customCompiler, platform, shader.files[0], to.resolve(name + '.' + platform), temp, platform, kfx);
			addShader(project, name, '.' + platform);
			break;
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
			file = from.resolve(Paths.get(asset.libdir, asset.file));
		}
		else {
			file = from.resolve(Paths.get(asset.file));
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
			file = from.resolve(Paths.get(asset.libdir, asset.file));
		}
		else {
			file = from.resolve(Paths.get(asset.file));
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
			file = from.resolve(Paths.get(asset.libdir, asset.file));
		}
		else {
			file = from.resolve(Paths.get(asset.file));
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
			file = from.resolve(Paths.get(asset.libdir, asset.file));
		}
		else {
			file = from.resolve(Paths.get(asset.file));
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
			file = from.resolve(Paths.get(asset.libdir, asset.file));
		}
		else {
			file = from.resolve(Paths.get(asset.file));
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
			file = from.resolve(Paths.get(asset.libdir, asset.file));
		}
		else {
			file = from.resolve(Paths.get(asset.file));
		}
		exporter.copyBlob(platform, file, asset.file, function (files) {
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
					out += "if (fs.existsSync(path.join('" + lib.replaceAll('\\', '/') + "', 'korefile.js'))) {\n";
					out += "\tproject.addSubProject(Solution.createProject('" + lib.replaceAll('\\', '/') + "'));\n";
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
					run: options.run,
					debug: options.debug
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
	let project = null;

	let foundProjectFile = false;
	if (name === '') name = from.toAbsolutePath().getFileName();

	if (Files.exists(from.resolve('khafile.js'))) {
		project = ProjectFile(from);
		foundProjectFile = true;
	}
	else {
		log.error('No khafile found.');
		callback('Unknown');
		return;
	}

	name = project.name;
	exporter.setWidthAndHeight(800, 600); // project.game.width, project.game.height);
	exporter.setName(name);
	for (let source of project.sources) {
		exporter.addSourceDirectory(source);
	}
	project.scriptdir = options.kha;
	project.addShaders('Sources/Shaders/**');
	
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
		let shaderDir = to.resolve(exporter.sysdir() + '-resources');
		if (platform === Platform.Unity) {
			shaderDir = to.resolve(Paths.get(exporter.sysdir(), 'Assets', 'Shaders'));
		}
		if (!Files.exists(shaderDir)) Files.createDirectories(shaderDir);
		for (let shader of project.shaders) {
			compileShader(exporter, platform, project, shader, shaderDir, temp, options.nokrafix ? kfx : krafix, kfx);
		}
		if (platform === Platform.Unity) {
			let proto = fs.readFileSync(from.resolve(Paths.get(options.kha, 'Tools', 'khamake', 'Data', 'unity', 'Shaders', 'proto.shader')).toString(), { encoding: 'utf8' });
			for (let i1 = 0; i1 < project.exportedShaders.length; ++i1) {
				if (project.exportedShaders[i1].name.endsWith('.vert')) {
					for (let i2 = 0; i2 < project.exportedShaders.length; ++i2) {
						if (project.exportedShaders[i2].name.endsWith('.frag')) {
							let shadername = project.exportedShaders[i1].name + '.' + project.exportedShaders[i2].name;
							let proto2 = proto.replaceAll('{name}', shadername);
							proto2 = proto2.replaceAll('{vert}', project.exportedShaders[i1].name);
							proto2 = proto2.replaceAll('{frag}', project.exportedShaders[i2].name);
							fs.writeFileSync(shaderDir.resolve(shadername + '.shader').toString(), proto2, { encoding: 'utf8'});
						}
					}
				}
			}
			let blobDir = to.resolve(Paths.get(exporter.sysdir(), 'Assets', 'Resources', 'Blobs'));
			if (!Files.exists(blobDir)) Files.createDirectories(blobDir);
			for (let i = 0; i < project.exportedShaders.length; ++i) {
				fs.writeFileSync(blobDir.resolve(project.exportedShaders[i].files[0] + '.bytes').toString(), project.exportedShaders[i].name, { encoding: 'utf8'});
			}
		}

		let files = [];
		for (let asset of project.assets) {
			files.push(asset);
		}
		for (let shader of project.exportedShaders) {
			files.push({
				name: shader.name,
				files: shader.files,
				type: 'shader'
			});
		}

		function secondPass() {
			let hxslDir = pathlib.join('build', 'Shaders');
			if (fs.existsSync(hxslDir) && fs.readdirSync(hxslDir).length > 0) { 
				addShaders(exporter, platform, project, from, to.resolve(exporter.sysdir() + '-resources'), temp, from.resolve(Paths.get(hxslDir)), krafix, kfx);
				if (foundProjectFile) {
					fs.outputFileSync(to.resolve(Paths.get(exporter.sysdir() + '-resources', 'files.json')).toString(), JSON.stringify({ files: files }, null, '\t'), { encoding: 'utf8' });
					log.info('Assets done.');
					exportProjectFiles(name, from, to, options, exporter, platform, khaDirectory, haxeDirectory, kore, project.libraries, callback);
				}
				else {
					exportProjectFiles(name, from, to, options, exporter, platform, khaDirectory, haxeDirectory, kore, project.libraries,callback);
				}
			}
		}

		if (foundProjectFile) {
			fs.outputFileSync(to.resolve(Paths.get(exporter.sysdir() + '-resources', 'files.json')).toString(), JSON.stringify({ files: files }, null, '\t'), { encoding: 'utf8' });
			log.info('Assets done.');
			exportProjectFiles(name, from, to, options, exporter, platform, khaDirectory, haxeDirectory, kore, project.libraries, secondPass);
		}
		else {
			exportProjectFiles(name, from, to, options, exporter, platform, khaDirectory, haxeDirectory, kore, project.libraries, secondPass);
		}
	});
}

function isKhaProject(directory) {
	return Files.exists(directory.resolve('Kha')) || Files.exists(directory.resolve('khafile.js'));
}

function exportProject(from, to, platform, khaDirectory, haxeDirectory, oggEncoder, aacEncoder, mp3Encoder, h264Encoder, webmEncoder, wmvEncoder, theoraEncoder, kfx, krafix, khafolders, embedflashassets, options, callback) {
	if (isKhaProject(from)) {
		exportKhaProject(from, to, platform, khaDirectory, haxeDirectory, oggEncoder, aacEncoder, mp3Encoder, h264Encoder, webmEncoder, wmvEncoder, theoraEncoder, kfx, krafix, khafolders, embedflashassets, options, callback);
	}
	else {
		log.error('Neither Kha directory nor khafile.js found.');
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
