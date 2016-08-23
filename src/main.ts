import * as child_process from 'child_process';
import * as fs from 'fs-extra';
import * as os from 'os';
import * as path from 'path';

import {sys} from './exec';
import * as korepath from './korepath';
import * as log from './log';
import {GraphicsApi} from './GraphicsApi';
import {VrApi} from './VrApi';
import {Options} from './Options';
import {Platform} from './Platform';
import {Project, Target} from './Project';
import {loadProject} from './ProjectFile';
import {VisualStudioVersion} from './VisualStudioVersion';
import {AssetConverter} from './AssetConverter';
import {HaxeCompiler} from './HaxeCompiler';
import {ShaderCompiler} from './ShaderCompiler';
import {KhaExporter} from './Exporters/KhaExporter';
import {AndroidExporter} from './Exporters/AndroidExporter';
import {DebugHtml5Exporter} from './Exporters/DebugHtml5Exporter';
import {EmptyExporter} from './Exporters/EmptyExporter';
import {FlashExporter} from './Exporters/FlashExporter';
import {Html5Exporter} from './Exporters/Html5Exporter';
import {Html5WorkerExporter} from './Exporters/Html5WorkerExporter';
import {JavaExporter} from './Exporters/JavaExporter';
import {KoreExporter} from './Exporters/KoreExporter';
import {KoreHLExporter} from './Exporters/KoreHLExporter';
import {KromExporter} from './Exporters/KromExporter';
import {NodeExporter} from './Exporters/NodeExporter';
import {PlayStationMobileExporter} from './Exporters/PlayStationMobileExporter';
import {WpfExporter} from './Exporters/WpfExporter';
import {XnaExporter} from './Exporters/XnaExporter';
import {UnityExporter} from './Exporters/UnityExporter';

function fixName(name: string): string {
	name = name.replace(/[-\ \.\/\\]/g, '_');
	if (name[0] === '0' || name[0] === '1' || name[0] === '2' || name[0] === '3' || name[0] === '4'
		|| name[0] === '5' || name[0] === '6' || name[0] === '7' || name[0] === '8' || name[0] === '9') {
		name = '_' + name;
	}
	return name;
}

async function exportProjectFiles(name: string, options: Options, exporter: KhaExporter, kore: boolean, korehl: boolean, libraries, targetOptions, defines): Promise<string> {
	if (options.haxe !== '') {
		let haxeOptions = exporter.haxeOptions(name, targetOptions, defines);
		//haxeOptions.defines.push('kha');
		//haxeOptions.defines.push('kha_version=1607');

		await exporter.exportSolution(name, targetOptions, haxeOptions);

		let compiler = new HaxeCompiler(options.to, haxeOptions.to, haxeOptions.realto, options.haxe, 'project-' + exporter.sysdir() + '.hxml', ['Sources']);
		await compiler.run(options.watch);
	}
	if (options.haxe !== '' && kore && !options.noproject) {
		// If target is a Kore project, generate additional project folders here.
		// generate the korefile.js
		{
			fs.copySync(path.join(__dirname, '..', 'Data', 'build-korefile.js'), path.join(options.to, exporter.sysdir() + '-build', 'korefile.js'), { clobber: true });

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

			out += "project.setDebugDir('" + path.relative(options.from, path.join(options.to, exporter.sysdir())).replace(/\\/g, '/') + "');\n";

			let buildpath = path.relative(options.from, path.join(options.to, exporter.sysdir() + "-build")).replace(/\\/g, '/');
			if (buildpath.startsWith('..')) buildpath = path.resolve(path.join(options.from.toString(), buildpath));
			out += "project.addSubProject(Solution.createProject('" + buildpath.replace(/\\/g, '/') + "'));\n";
			out += "project.addSubProject(Solution.createProject('" + path.normalize(options.kha).replace(/\\/g, '/') + "'));\n";
			out += "project.addSubProject(Solution.createProject('" + path.join(options.kha, 'Kore').replace(/\\/g, '/') + "'));\n";
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
				let libPath: string = lib.libroot;
				out += "if (fs.existsSync(path.join('" + libPath.replace(/\\/g, '/') + "', 'korefile.js'))) {\n";
				out += "\tproject.addSubProject(Solution.createProject('" + libPath.replace(/\\/g, '/') + "'));\n";
				out += "}\n";
			}

			out += 'return solution;\n';
			fs.writeFileSync(path.join(options.from, 'korefile.js'), out);
		}

		{
			// Similar to khamake.js -> main.js -> run(...)
			// We now do koremake.js -> main.js -> run(...)
			// This will create additional project folders for the target,
			// e.g. 'build/android-native-build'
			try {
				let name = await require(path.join(korepath.get(), 'out', 'main.js')).run(
				{
					from: options.from,
					to: path.join(options.to, exporter.sysdir() + '-build'),
					target: koreplatform(options.target),
					graphics: options.graphics,
					vrApi: options.vr,
					visualstudio: options.visualstudio,
					compile: options.compile,
					run: options.run,
					debug: options.debug
				},
				{
					info: log.info,
					error: log.error
				});
				log.info('Done.');
				return name;
			}
			catch (error) {
				log.error(error);
				return '';
			}
		}
	}
	else if (options.haxe !== '' && korehl && !options.noproject) {
		// If target is a Kore project, generate additional project folders here.
		// generate the korefile.js
		{
			fs.copySync(path.join(__dirname, 'Data', 'hl', 'kore_sources.c'), path.join(options.to, exporter.sysdir() + '-build', 'kore_sources.c'), { clobber: true });
			fs.copySync(path.join(__dirname, 'Data', 'hl', 'korefile.js'), path.join(options.to, exporter.sysdir() + '-build', 'korefile.js'), { clobber: true });

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

			out += "project.setDebugDir('" + path.relative(options.from, path.join(options.to, exporter.sysdir())).replace(/\\/g, '/') + "');\n";

			let buildpath = path.relative(options.from, path.join(options.to, exporter.sysdir() + '-build')).replace(/\\/g, '/');
			if (buildpath.startsWith('..')) buildpath = path.resolve(path.join(options.from.toString(), buildpath));
			out += "project.addSubProject(Solution.createProject('" + buildpath.replace(/\\/g, '/') + "'));\n";
			out += "project.addSubProject(Solution.createProject('" + path.join(options.kha, 'Backends', 'KoreHL').replace(/\\/g, '/') + "'));\n";
			out += "project.addSubProject(Solution.createProject('" + path.join(options.kha, 'Kore').replace(/\\/g, '/') + "'));\n";
			out += "solution.addProject(project);\n";

			for (let lib of libraries) {
				var libPath: string = lib.libroot;
				out += "if (fs.existsSync(path.join('" + libPath.replace(/\\/g, '/') + "', 'korefile.js'))) {\n";
				out += "\tproject.addSubProject(Solution.createProject('" + libPath.replace(/\\/g, '/') + "'));\n";
				out += "}\n";
			}

			out += 'return solution;\n';
			fs.writeFileSync(path.join(options.from, 'korefile.js'), out);
		}

		{
			let name = await require(path.join(korepath.get(), 'out', 'main.js')).run(
			{
				from: options.from,
				to: path.join(options.to, exporter.sysdir() + '-build'),
				target: koreplatform(options.target),
				graphics: options.graphics,
				vrApi: options.vr,
				visualstudio: options.visualstudio,
				compile: options.compile,
				run: options.run,
				debug: options.debug
			},
			{
				info: log.info,
				error: log.error
			});
			log.info('Done.');
			return name;
		}
	}
	else {
		// If target is not a Kore project, e.g. HTML5, finish building here.
		log.info('Done.');
		return name;
	}
}

function koreplatform(platform) {
	if (platform.endsWith('-native')) return platform.substr(0, platform.length - '-native'.length);
	else if (platform.endsWith('-hl')) return platform.substr(0, platform.length - '-hl'.length);
	else return platform;
}

async function exportKhaProject(options: Options): Promise<string> {
	log.info('Creating Kha project.');
		
	let project: Project = null;
	let foundProjectFile = false;

	// get the khafile.js and load the config code,
	// then create the project config object, which contains stuff
	// like project name, assets paths, sources path, library path...
	if (fs.existsSync(path.join(options.from, options.projectfile))) {
		project = await loadProject(options.from, options.projectfile);
		foundProjectFile = true;
	}
	
	if (!foundProjectFile) {
		throw 'No khafile found.';
	}

	let temp = path.join(options.to, 'temp');
	fs.ensureDirSync(temp);

	let exporter = null;
	let kore = false;
	let korehl = false;
	
	let target = options.target;
	let customTarget: Target = null;
	if (project.customTargets.get(options.target)) {
		customTarget = project.customTargets.get(options.target);
		target = customTarget.baseTarget;
	}
	
	switch (target) {
		case Platform.Krom:
			exporter = new KromExporter(options);
			break;
		case Platform.Flash:
			exporter = new FlashExporter(options);
			break;
		case Platform.HTML5:
			exporter = new Html5Exporter(options);
			break;
		case Platform.HTML5Worker:
			exporter = new Html5WorkerExporter(options);
			break;
		case Platform.DebugHTML5:
			exporter = new DebugHtml5Exporter(options);
			break;
		case Platform.WPF:
			exporter = new WpfExporter(options);
			break;
		case Platform.XNA:
			exporter = new XnaExporter(options);
			break;
		case Platform.Java:
			exporter = new JavaExporter(options);
			break;
		case Platform.PlayStationMobile:
			exporter = new PlayStationMobileExporter(options);
			break;
		case Platform.Android:
			exporter = new AndroidExporter(options);
			break;
		case Platform.Node:
			exporter = new NodeExporter(options);
			break;
		case Platform.Unity:
			exporter = new UnityExporter(options);
			break;
		case Platform.Empty:
			exporter = new EmptyExporter(options);
			break;
		default:
			if (target.endsWith('-hl')) {
				korehl = true;
				options.target = koreplatform(target);
				exporter = new KoreHLExporter(options);
			}
			else {
				kore = true;
				options.target = koreplatform(target);
				exporter = new KoreExporter(options);
			}
			break;
	}

	// Create the target build folder
	// e.g. 'build/android-native'
	fs.ensureDirSync(path.join(options.to, exporter.sysdir()));

	let defaultWindowOptions = {
		width: 800,
		height: 600
	}
	
	let windowOptions = project.windowOptions ? project.windowOptions : defaultWindowOptions;
	exporter.setName(project.name);
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
	project.addShaders('Sources/Shaders/**', {});

	let assetConverter = new AssetConverter(exporter, options.target, project.assetMatchers);
	let assets = await assetConverter.run(options.watch);
	let shaderDir = path.join(options.to, exporter.sysdir() + '-resources');
	if (target === Platform.Unity) {
		shaderDir = path.join(options.to, exporter.sysdir(), 'Assets', 'Shaders');
	}
	
	fs.ensureDirSync(shaderDir);
	let shaderCompiler = new ShaderCompiler(exporter, options.target, options.krafix, shaderDir, temp, options, project.shaderMatchers);
	let exportedShaders = await shaderCompiler.run(options.watch);

	if (target === Platform.Unity) {
		fs.ensureDirSync(path.join(options.to, exporter.sysdir() + '-resources'));
		for (let shader of exportedShaders) {
			fs.writeFileSync(path.join(options.to, exporter.sysdir() + '-resources', shader.name + '.hlsl'), shader.name);
		}
		let proto = fs.readFileSync(path.join(options.from, options.kha, 'Tools', 'khamake', 'Data', 'unity', 'Shaders', 'proto.shader'), 'utf8');
		for (let i1 = 0; i1 < exportedShaders.length; ++i1) {
			if (exportedShaders[i1].name.endsWith('.vert')) {
				for (let i2 = 0; i2 < exportedShaders.length; ++i2) {
					if (exportedShaders[i2].name.endsWith('.frag')) {
						let shadername = exportedShaders[i1].name + '.' + exportedShaders[i2].name;
						let proto2 = proto.replace(/{name}/g, shadername);
						proto2 = proto2.replace(/{vert}/g, exportedShaders[i1].name);
						proto2 = proto2.replace(/{frag}/g, exportedShaders[i2].name);
						fs.writeFileSync(path.join(shaderDir, shadername + '.shader'), proto2, 'utf8');
					}
				}
			}
		}
		let blobDir = path.join(options.to, exporter.sysdir(), 'Assets', 'Resources', 'Blobs');
		fs.ensureDirSync(blobDir);
		for (let i = 0; i < exportedShaders.length; ++i) {
			fs.writeFileSync(path.join(blobDir, exportedShaders[i].files[0] + '.bytes'), exportedShaders[i].name, 'utf8');
		}
	}

	let files = [];
	for (let asset of assets) {
		let file: any = {
			name: fixName(asset.name),
			files: asset.files,
			type: asset.type
		};
		if (file.type === 'image') {
			file.original_width = asset.original_width;
			file.original_height = asset.original_height;
		}
		files.push(file);
	}
	for (let shader of exportedShaders) {
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
		let hxslDir = path.join('build', 'Shaders');
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
		fs.outputFileSync(path.join(options.to, exporter.sysdir() + '-resources', 'files.json'), JSON.stringify({ files: files }, null, '\t'));
	}

	return await exportProjectFiles(project.name, options, exporter, kore, korehl, project.libraries, project.targetOptions, project.defines);
}

function isKhaProject(directory: string, projectfile: string) {
	return fs.existsSync(path.join(directory, 'Kha')) || fs.existsSync(path.join(directory, projectfile));
}

async function exportProject(options: Options): Promise<string> {
	if (isKhaProject(options.from, options.projectfile)) {
		return await exportKhaProject(options);
	}
	else {
		log.error('Neither Kha directory nor project file (' + options.projectfile + ') found.');
		return 'Unknown';
	}
}

function runProject(options: any): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		log.info('Running...');
		var run = child_process.spawn(
			path.join(process.cwd(), options.to, 'linux-build', name),
			[],
			{ cwd: path.join(process.cwd(), options.to, 'linux') });

		run.stdout.on('data', function (data) {
			log.info(data.toString());
		});

		run.stderr.on('data', function (data) {
			log.error(data.toString());
		});

		run.on('close', function (code) {
			resolve();
		});
	});
}

export let api = 2;

export async function run(options: Options, loglog): Promise<string> {
	if (options.silent) {
		log.silent();
	}
	else {
		log.set(loglog);
	}

	if (!options.kha) {
		let p = path.join(__dirname, '..', '..', '..');
		if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
			options.kha = p;
		}
	}
	else {
		options.kha = path.resolve(options.kha);
	}

	if (!options.haxe) {
		let haxepath = path.join(options.kha, 'Tools', 'haxe');
		if (fs.existsSync(haxepath) && fs.statSync(haxepath).isDirectory()) options.haxe = haxepath;
	}

	if (!options.krafix) {
		let krafixpath = path.join(options.kha, 'Kore', 'Tools', 'krafix', 'krafix' + sys());
		if (fs.existsSync(krafixpath)) options.krafix = krafixpath;
	}

	if (!options.ogg) {
		let oggpath = path.join(options.kha, 'Tools', 'oggenc', 'oggenc' + sys());
		if (fs.existsSync(oggpath)) options.ogg = oggpath + ' {in} -o {out} --quiet';
	}

	//if (!options.kravur) {
	//	let kravurpath = path.join(options.kha, 'Tools', 'kravur', 'kravur' + sys());
	//	if (fs.existsSync(kravurpath)) options.kravur = kravurpath + ' {in} {size} {out}';
	//}
	
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
	
	let name = await exportProject(options);

	if (options.target === Platform.Linux && options.run) {
		await runProject(options);
	}

	return name;
}
