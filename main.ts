// Called from the end of khamake.js
// Entry point is at the bottom, exports.run(...)

//"use strict";

import * as child_process from 'child_process';
import * as fs from 'fs-extra';
import * as os from 'os';
import * as pathlib from 'path';

import {sys} from './exec';
import * as korepath from './korepath';
import * as log from './log';
import {GraphicsApi} from './GraphicsApi';
import {VrApi} from './VrApi';
import {Options} from './Options';
import {Platform} from './Platform';
import {loadProject} from './ProjectFile';
import {VisualStudioVersion} from './VisualStudioVersion';

/*const AndroidExporter = require('./AndroidExporter.js');
const FlashExporter = require('./FlashExporter.js');
const Html5Exporter = require('./Html5Exporter.js');
const Html5WorkerExporter = require('./Html5WorkerExporter.js');
const JavaExporter = require('./JavaExporter.js');
const KoreExporter = require('./KoreExporter.js');
const KoreHLExporter = require('./KoreHLExporter.js');
const NodeExporter = require('./NodeExporter.js');
const PlayStationMobileExporter = require('./PlayStationMobileExporter.js');
const WpfExporter = require('./WpfExporter.js');
const XnaExporter = require('./XnaExporter.js');
const UnityExporter = require('./UnityExporter.js');
const DebugHtml5Exporter = require('./DebugHtml5Exporter.js');
const EmptyExporter = require('./EmptyExporter.js');*/
import {KhaExporter} from './KhaExporter';
import {Html5Exporter} from './Html5Exporter';
import {KoreExporter} from './KoreExporter';

function compileShader2(compiler: string, type: string, from: string, to: string, temp: string, system: string) {
	return new Promise((resolve, reject) => {
		if (compiler === '') reject('No shader compiler found.');
	
		let process = child_process.spawn(compiler, [type, from, to, temp, system]);	
		
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
	});
}

function addShader(project, name, extension) {
	project.exportedShaders.push({files: [name + extension], name: name});
}

async function compileShader(exporter, platform, project, shader, to: string, temp, compiler) {
	let name = shader.name;
	if (name.endsWith('.inc')) return;
	if (platform.endsWith('-hl')) platform = platform.substr(0, platform.length - '-hl'.length);
	switch (platform) {
		case Platform.Empty:
		case Platform.Node: {
			fs.copySync(shader.files[0], pathlib.join(to, name + '.glsl'), {clobber: true});
			addShader(project, name, '.glsl');
			exporter.addShader(name + '.glsl');
			break;
		}
		case Platform.Flash: {
			await compileShader2(compiler, 'agal', shader.files[0], pathlib.join(to, name + '.agal'), temp, platform);
			addShader(project, name, '.agal');
			exporter.addShader(name + '.agal');
			break;
		}
		case Platform.Android:
		case Platform.Android + '-native': {
			if (Options.graphicsApi === GraphicsApi.Vulkan) {
				await compileShader2(compiler, 'spirv', shader.files[0], pathlib.join(to, name + ".spirv"), temp, 'android');
				addShader(project, name, '.spirv');
			}
			else {
				let shaderpath = pathlib.join(to, name + '.essl');
				await compileShader2(compiler, "essl", shader.files[0], shaderpath, temp, 'android');
				addShader(project, name, ".essl");
			}
			break;
		}
		case Platform.HTML5:
		case Platform.HTML5 + '-native':
		case Platform.DebugHTML5:
		case Platform.HTML5Worker:
		case Platform.Tizen:
		case Platform.Pi:
		case Platform.iOS: {
			if (Options.graphicsApi === GraphicsApi.Metal) {
				fs.ensureDirSync(pathlib.join(to, '..', 'ios-build', 'Sources'));
				let funcname = name;
				funcname = funcname.replaceAll('-', '_');
				funcname = funcname.replaceAll('.', '_');
				funcname += '_main';
				fs.writeFileSync(pathlib.join(to, name + ".metal"), funcname, { encoding: 'utf8' });
				await compileShader2(compiler, "metal", shader.files[0], pathlib.join(to, '..', 'ios-build', 'Sources', name + '.metal'), temp, platform);
				addShader(project, name, ".metal");
			}
			else {
				let shaderpath = pathlib.join(to, name + '.essl');
				await compileShader2(compiler, "essl", shader.files[0], shaderpath, temp, platform);
				addShader(project, name, ".essl");
			}
			break;
		}
		case Platform.Windows: {
			if (Options.graphicsApi === GraphicsApi.Vulkan) {
				await compileShader2(compiler, 'spirv', shader.files[0], pathlib.join(to, name + ".spirv"), temp, platform);
				addShader(project, name, '.spirv');
			}
			else if (Options.graphicsApi === GraphicsApi.OpenGL || Options.graphicsApi === GraphicsApi.OpenGL2) {
				await compileShader2(compiler, "glsl", shader.files[0], pathlib.join(to, name + ".glsl"), temp, platform);
				addShader(project, name, ".glsl");
			}
			else if (Options.graphicsApi === GraphicsApi.Direct3D11 || Options.graphicsApi === GraphicsApi.Direct3D12) {
				await compileShader2(compiler, "d3d11", shader.files[0], pathlib.join(to, name + ".d3d11"), temp, platform);
				addShader(project, name, ".d3d11");
			}
			else {
				await compileShader2(compiler, "d3d9", shader.files[0], pathlib.join(to, name + ".d3d9"), temp, platform);
				addShader(project, name, ".d3d9");
			}
			break;
		}
		case Platform.WindowsApp: {
			await compileShader2(compiler, "d3d11", shader.files[0], pathlib.join(to, name + ".d3d11"), temp, platform);
			addShader(project, name, ".d3d11");
			break;
		}
		case Platform.Xbox360:
		case Platform.PlayStation3: {
			await compileShader2(compiler, "d3d9", shader.files[0], pathlib.join(to, name + ".d3d9"), temp, platform);
			addShader(project, name, ".d3d9");
			break;
		}
		case Platform.Linux: {
			if (Options.graphicsApi === GraphicsApi.Vulkan) {
				await compileShader2(compiler, 'spirv', shader.files[0], pathlib.join(to, name + ".spirv"), temp, platform);
				addShader(project, name, '.spirv');
			}
			else {
				await compileShader2(compiler, "glsl", shader.files[0], pathlib.join(to, name + ".glsl"), temp, platform);
				addShader(project, name, ".glsl");
			}
			break;
		}
		case Platform.OSX: {
			await compileShader2(compiler, "glsl", shader.files[0], pathlib.join(to, name + ".glsl"), temp, platform);
			addShader(project, name, ".glsl");
			break;
		}
		case Platform.Unity: {
			await compileShader2(compiler, "d3d9", shader.files[0], pathlib.join(to, name + ".hlsl"), temp, platform);
			addShader(project, name, ".hlsl");
			break;
		}
		case Platform.WPF:
		case Platform.XNA:
		case Platform.Java:
		case Platform.PlayStationMobile:
			break;
		default: {
			/** let customCompiler = compiler;
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
			compileShader2(customCompiler, platform, shader.files[0], to.resolve(name + '.' + platform), temp, platform);
			addShader(project, name, '.' + platform);*/
			break;
		}
	}
}

function fixName(name) {
	name = name.replace(/\./g, '_').replace(/-/g, '_');
	if (name[0] === '0' || name[0] === '1' || name[0] === '2' || name[0] === '3' || name[0] === '4'
		|| name[0] === '5' || name[0] === '6' || name[0] === '7' || name[0] === '8' || name[0] === '9') {
		name = '_' + name;
	}
	return name;
}

async function exportAssets(assets, exporter: KhaExporter, from, khafolders, platform, encoders) {
	let index = 0;
	for (let asset of assets) {
		let fileinfo = pathlib.parse(asset.file);
		log.info('Exporting asset ' + (index + 1) + ' of ' + assets.length + ' (' + fileinfo.base + ').');

		let files: Array<string> = [];

		switch (asset.type) {
			case 'image':
				files = await exporter.copyImage(platform, asset.file, fileinfo.name, asset);
				break;
			case 'sound':
				files = await exporter.copySound(platform, asset.file, fileinfo.name, encoders);
				break;
			case 'font':
				files = await exporter.copyFont(platform, asset.file, fileinfo.name);
				break;
			case 'video':
				files = await exporter.copyVideo(platform, asset.file, fileinfo.name, encoders);
				break;
			case 'blob':
				files = await exporter.copyBlob(platform, asset.file, fileinfo.base);
				break;
		}

		asset.name = fixName(asset.name);
		asset.files = files;
		delete asset.file;

		++index;
	}
}

async function exportProjectFiles(name: string, from: string, to: string, options, exporter, platform: string, khaDirectory: string, haxeDirectory: string, kore, korehl, libraries, targetOptions, defines, callback) {
	if (haxeDirectory !== '') await exporter.exportSolution(name, platform, khaDirectory, haxeDirectory, from, targetOptions, defines);
	if (haxeDirectory !== '' && kore) {
		// If target is a Kore project, generate additional project folders here.
		// generate the korefile.js
		{
			fs.copySync(pathlib.join(__dirname, 'Data', 'build-korefile.js'), pathlib.join(to, exporter.sysdir() + '-build', 'korefile.js'));

			let out = '';
			out += "var solution = new Solution('" + name + "');\n";
			out += "var project = new Project('" + name + "');\n";
			
			if (targetOptions) {
				let koreTargetOptions = {};
				for (let option in targetOptions) {
					if (option.endsWith('_native')) continue;
					koreTargetOptions[option] = targetOptions[option];
				}
				for (let option in targetOptions) {
					if (option.endsWith('_native')) {
						koreTargetOptions[option.substr(0, option.length - '_native'.length)] = targetOptions[option];
					}
				}
				out += "project.targetOptions = " + JSON.stringify(koreTargetOptions) + ";\n";
			}

			out += "project.setDebugDir('" + pathlib.relative(from, pathlib.join(to, exporter.sysdir())).replace(/\\/g, '/') + "');\n";

			let buildpath = pathlib.relative(from, pathlib.join(to, exporter.sysdir() + "-build")).replace(/\\/g, '/');
			if (buildpath.startsWith('..')) buildpath = pathlib.resolve(pathlib.join(from.toString(), buildpath));
			out += "project.addSubProject(Solution.createProject('" + buildpath.replace(/\\/g, '/') + "'));\n";
			out += "project.addSubProject(Solution.createProject('" + pathlib.normalize(options.kha).replace(/\\/g, '/') + "'));\n";
			out += "project.addSubProject(Solution.createProject('" + pathlib.join(options.kha, 'Kore').replace(/\\/g, '/') + "'));\n";
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
				var libPath = lib.libroot;
				out += "if (fs.existsSync(path.join('" + libPath.replaceAll('\\', '/') + "', 'korefile.js'))) {\n";
				out += "\tproject.addSubProject(Solution.createProject('" + libPath.replaceAll('\\', '/') + "'));\n";
				out += "}\n";
			}

			out += 'return solution;\n';
			fs.writeFileSync(pathlib.join(from, 'korefile.js'), out);
		}

		{
			// Similar to khamake.js -> main.js -> run(...)
			// We now do koremake.js -> main.js -> run(...)
			// This will create additional project folders for the target,
			// e.g. 'build/android-native-build'
			require(pathlib.join(korepath.get(), 'main.js')).run(
			{
				from: from,
				to: pathlib.join(to, exporter.sysdir() + '-build'),
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
	else if (haxeDirectory !== '' && korehl) {
		// If target is a Kore project, generate additional project folders here.
		// generate the korefile.js
		{
			fs.copySync(pathlib.join(__dirname, 'Data', 'hl', 'kore_sources.c'), pathlib.join(to, exporter.sysdir() + '-build', 'kore_sources.c'));
			fs.copySync(pathlib.join(__dirname, 'Data', 'hl', 'korefile.js'), pathlib.join(to, exporter.sysdir() + '-build', 'korefile.js'));

			let out = '';
			out += "var solution = new Solution('" + name + "');\n";
			out += "var project = new Project('" + name + "');\n";
			
			if (targetOptions) {
				let koreTargetOptions = {};
				for (let option in targetOptions) {
					if (option.endsWith('_native')) continue;
					koreTargetOptions[option] = targetOptions[option];
				}
				for (let option in targetOptions) {
					if (option.endsWith('_native')) {
						koreTargetOptions[option.substr(0, option.length - '_native'.length)] = targetOptions[option];
					}
				}
				out += "project.targetOptions = " + JSON.stringify(koreTargetOptions) + ";\n";
			}

			out += "project.setDebugDir('" + pathlib.relative(from, pathlib.join(to, exporter.sysdir())).replace(/\\/g, '/') + "');\n";

			let buildpath = pathlib.relative(from, pathlib.join(to, exporter.sysdir() + '-build')).replace(/\\/g, '/');
			if (buildpath.startsWith('..')) buildpath = pathlib.resolve(pathlib.join(from.toString(), buildpath));
			out += "project.addSubProject(Solution.createProject('" + buildpath.replace(/\\/g, '/') + "'));\n";
			out += "project.addSubProject(Solution.createProject('" + pathlib.join(options.kha, 'Backends', 'KoreHL').replace(/\\/g, '/') + "'));\n";
			out += "project.addSubProject(Solution.createProject('" + pathlib.join(options.kha, 'Kore').replace(/\\/g, '/') + "'));\n";
			out += "solution.addProject(project);\n";

			for (let lib of libraries) {
				var libPath = lib.libroot;
				out += "if (fs.existsSync(path.join('" + libPath.replaceAll('\\', '/') + "', 'korefile.js'))) {\n";
				out += "\tproject.addSubProject(Solution.createProject('" + libPath.replaceAll('\\', '/') + "'));\n";
				out += "}\n";
			}

			out += 'return solution;\n';
			fs.writeFileSync(pathlib.join(from, 'korefile.js'), out);
		}

		{
			require(pathlib.join(korepath.get(), 'main.js')).run(
			{
				from: from,
				to: pathlib.join(to, exporter.sysdir() + '-build'),
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
		// If target is not a Kore project, e.g. HTML5, finish building here.
		log.info('Done.');
		callback(name);
	}
}

function koreplatform(platform) {
	if (platform.endsWith('-native')) return platform.substr(0, platform.length - '-native'.length);
	else if (platform.endsWith('-hl')) return platform.substr(0, platform.length - '-hl'.length);
	else return platform;
}

async function exportKhaProject(from: string, to: string, platform: string, khaDirectory: string, haxeDirectory: string, oggEncoder, aacEncoder, mp3Encoder, h264Encoder, webmEncoder, wmvEncoder, theoraEncoder, krafix, khafolders, embedflashassets, options, callback) {
	log.info('Creating Kha project.');

	let temp = pathlib.join(to, 'temp');
	fs.ensureDirSync(temp);

	let exporter = null;
	let kore = false;
	let korehl = false;
	switch (platform) {
		case Platform.Flash:
			//**exporter = new FlashExporter(khaDirectory, to, embedflashassets);
			break;
		case Platform.HTML5:
			exporter = new Html5Exporter(khaDirectory, to);
			break;
		case Platform.HTML5Worker:
			//**exporter = new Html5WorkerExporter(khaDirectory, to);
			break;
		case Platform.DebugHTML5:
			//**exporter = new DebugHtml5Exporter(khaDirectory, to);
			break;
		case Platform.WPF:
			//**exporter = new WpfExporter(khaDirectory, to);
			break;
		case Platform.XNA:
			//**exporter = new XnaExporter(khaDirectory, to);
			break;
		case Platform.Java:
			//**exporter = new JavaExporter(khaDirectory, to);
			break;
		case Platform.PlayStationMobile:
			//**exporter = new PlayStationMobileExporter(khaDirectory, to);
			break;
		case Platform.Android:
			//**exporter = new AndroidExporter(khaDirectory, to);
			break;
		case Platform.Node:
			//**exporter = new NodeExporter(khaDirectory, to);
			break;
		case Platform.Unity:
			//**exporter = new UnityExporter(khaDirectory, to);
			break;
		case Platform.Empty:
			//**exporter = new EmptyExporter(khaDirectory, to);
			break;
		default:
			if (platform.endsWith('-hl')) {
				korehl = true;
				//**exporter = new KoreHLExporter(koreplatform(platform), khaDirectory, Options.vrApi, to);
			}
			else {
				kore = true;
				exporter = new KoreExporter(platform, khaDirectory, Options.vrApi, to);
			}
			break;
	}

	// Create the target build folder
	// e.g. 'build/android-native'
	fs.ensureDirSync(pathlib.join(to, exporter.sysdir()));

	let name = '';
	let project = null;

	let foundProjectFile = false;
	// get project name, e.g. 'MyBunnyMark'
	if (name === '') name = pathlib.basename(pathlib.resolve(from));

	// get the khafile.js and load the config code,
	// then create the project config object, which contains stuff
	// like project name, assets paths, sources path, library path...
	if (fs.existsSync(pathlib.join(from, options.projectfile))) {
		project = loadProject(from, options.projectfile);
		foundProjectFile = true;
	}
	else {
		log.error('No khafile found.');
		callback('Unknown');
		return;
	}

	name = project.name;
	
	let defaultWindowOptions = {
		width: 800,
		height: 600
	}
	
	let windowOptions = project.windowOptions ? project.windowOptions : defaultWindowOptions;
	exporter.setName(name);
	exporter.setWidthAndHeight(
		'width' in windowOptions ? windowOptions.width : defaultWindowOptions.width,
		'height' in windowOptions ? windowOptions.height : defaultWindowOptions.height
	);
	
	for (let source of project.sources) {
		exporter.addSourceDirectory(source);
	}
	for (let library of project.libraries) {
		exporter.addLibrary(library);
	}
	exporter.parameters = project.parameters;
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
	console.log('Exporting assets.');
	await exportAssets(project.assets, exporter, from, khafolders, platform, encoders);
	let shaderDir = pathlib.join(to, exporter.sysdir() + '-resources');
	if (platform === Platform.Unity) {
		shaderDir = pathlib.join(to, exporter.sysdir(), 'Assets', 'Shaders');
	}
	fs.ensureDirSync(shaderDir);
	for (let shader of project.shaders) {
		await compileShader(exporter, platform, project, shader, shaderDir, temp, krafix);
		if (platform === Platform.Unity) {
			fs.ensureDirSync(pathlib.join(to, exporter.sysdir() + '-resources'));
			fs.writeFileSync(pathlib.join(to, exporter.sysdir() + '-resources', shader.name + '.hlsl'), shader.name);
		}
	}
	if (platform === Platform.Unity) {
		let proto = fs.readFileSync(pathlib.join(from, options.kha, 'Tools', 'khamake', 'Data', 'unity', 'Shaders', 'proto.shader'), { encoding: 'utf8' });
		for (let i1 = 0; i1 < project.exportedShaders.length; ++i1) {
			if (project.exportedShaders[i1].name.endsWith('.vert')) {
				for (let i2 = 0; i2 < project.exportedShaders.length; ++i2) {
					if (project.exportedShaders[i2].name.endsWith('.frag')) {
						let shadername = project.exportedShaders[i1].name + '.' + project.exportedShaders[i2].name;
						let proto2 = proto.replace(/{name}/g, shadername);
						proto2 = proto2.replace(/{vert}/g, project.exportedShaders[i1].name);
						proto2 = proto2.replace(/{frag}/g, project.exportedShaders[i2].name);
						fs.writeFileSync(pathlib.join(shaderDir, shadername + '.shader'), proto2, { encoding: 'utf8'});
					}
				}
			}
		}
		let blobDir = pathlib.join(to, exporter.sysdir(), 'Assets', 'Resources', 'Blobs');
		fs.ensureDirSync(blobDir);
		for (let i = 0; i < project.exportedShaders.length; ++i) {
			fs.writeFileSync(pathlib.join(blobDir, project.exportedShaders[i].files[0] + '.bytes'), project.exportedShaders[i].name, { encoding: 'utf8'});
		}
	}

	// Push assets files to be loaded
	let files = [];
	for (let asset of project.assets) {
		files.push(asset);
	}
	for (let shader of project.exportedShaders) {
		files.push({
			name: fixName(shader.name),
			files: shader.files,
			type: 'shader'
		});
	}

	function secondPass() {
		// First pass is for main project files. Second pass is for shaders.
		// Will try to look for the folder, e.g. 'build/Shaders'.
		// if it exists, export files similar to other a
		let hxslDir = pathlib.join('build', 'Shaders');
		/** if (fs.existsSync(hxslDir) && fs.readdirSync(hxslDir).length > 0) {
			addShaders(exporter, platform, project, from, to.resolve(exporter.sysdir() + '-resources'), temp, from.resolve(Paths.get(hxslDir)), krafix);
			if (foundProjectFile) {
				fs.outputFileSync(to.resolve(Paths.get(exporter.sysdir() + '-resources', 'files.json')).toString(), JSON.stringify({ files: files }, null, '\t'), { encoding: 'utf8' });
				log.info('Assets done.');
				exportProjectFiles(name, from, to, options, exporter, platform, khaDirectory, haxeDirectory, kore, project.libraries, project.targetOptions, callback);
			}
			else {
				exportProjectFiles(name, from, to, options, exporter, platform, khaDirectory, haxeDirectory, kore, project.libraries, project.targetOptions, callback);
			}
		}*/
	}

	if (foundProjectFile) {
		fs.outputFileSync(pathlib.join(to, exporter.sysdir() + '-resources', 'files.json'), JSON.stringify({ files: files }, null, '\t'));
		log.info('Assets done.');
	}

	exportProjectFiles(name, from, to, options, exporter, platform, khaDirectory, haxeDirectory, kore, korehl, project.libraries, project.targetOptions, project.defines, secondPass);
}

function isKhaProject(directory, projectfile) {
	return fs.existsSync(pathlib.join(directory, 'Kha')) || fs.existsSync(pathlib.join(directory, projectfile));
}

async function exportProject(from: string, to: string, platform: string, khaDirectory: string, haxeDirectory: string, oggEncoder, aacEncoder, mp3Encoder, h264Encoder, webmEncoder, wmvEncoder, theoraEncoder, krafix, khafolders, embedflashassets, options, callback) {
	if (isKhaProject(from, options.projectfile)) {
		await exportKhaProject(from, to, platform, khaDirectory, haxeDirectory, oggEncoder, aacEncoder, mp3Encoder, h264Encoder, webmEncoder, wmvEncoder, theoraEncoder, krafix, khafolders, embedflashassets, options, callback);
	}
	else {
		log.error('Neither Kha directory nor project file (' + options.projectfile + ') found.');
		callback('Unknown');
	}
}

export var api = 1;

export async function run(options, loglog, callback) {
	if (options.silent) {
		log.silent();
	}
	else {
		log.set(loglog);
	}

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
		let path = pathlib.join(options.kha, 'Tools', 'haxe');
		if (fs.existsSync(path) && fs.statSync(path).isDirectory()) options.haxe = path.toString();
	}

	if (options.krafix === '' || options.krafix === undefined) {
		let path = pathlib.join(options.kha, 'Kore', 'Tools', 'krafix', 'krafix' + sys());
		if (fs.existsSync(path)) options.krafix = path.toString();
	}

	if (options.ogg === '' || options.ogg === undefined) {
		let path = pathlib.join(options.kha, 'Tools', 'oggenc', 'oggenc' + sys());
		if (fs.existsSync(path)) options.ogg = path.toString() + ' {in} -o {out} --quiet';
	}

	if (options.kravur === '' || options.kravur === undefined) {
		let path = pathlib.join(options.kha, 'Tools', 'kravur', 'kravur' + sys());
		if (fs.existsSync(path)) options.kravur = path.toString() + ' {in} {size} {out}';
	}
	
	if (!options.aac && options.ffmpeg) {
		options.aac = options.ffmpeg + ' -i {in} {out}';
	}
	
	if (!options.mp3 && options.ffmpeg) {
		options.mp3 = options.ffmpeg + ' -i {in} {out}'
	}
	
	if (!options.h264 && options.ffmpeg) {
		options.h264 = options.ffmpeg + ' -i {in} {out}';
	}
	
	if (!options.webm && options.ffmpeg) {
		options.webm = options.ffmpeg + ' -i {in} {out}';
	}
	
	if (!options.wmv && options.ffmpeg) {
		options.wmv = options.ffmpeg + ' -i {in} {out}';
	}
	
	if (!options.theora && options.ffmpeg) {
		options.theora = options.ffmpeg + ' -i {in} {out}';
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
	
	await exportProject(options.from, options.to, options.target, options.kha, options.haxe, options.ogg, options.aac, options.mp3, options.h264, options.webm, options.wmv, options.theora, options.krafix, false, options.embedflashassets, options, done);
};
