import * as child_process from 'child_process';
import * as fs from 'fs-extra';
import * as os from 'os';
import * as path from 'path';

import {sys, sysdir} from './exec';
import * as korepath from './korepath';
import * as log from './log';
import {Options} from './Options';
import {Platform} from './Platform';
import {Project, Target, Library} from './Project';
import {loadProject, Callbacks} from './ProjectFile';
import {VisualStudioVersion} from './VisualStudioVersion';
import {AssetConverter} from './AssetConverter';
import {HaxeCompiler} from './HaxeCompiler';
import {ShaderCompiler, CompiledShader} from './ShaderCompiler';
import {KhaExporter} from './Exporters/KhaExporter';
import {DebugHtml5Exporter} from './Exporters/DebugHtml5Exporter';
import {EmptyExporter} from './Exporters/EmptyExporter';
import {FlashExporter} from './Exporters/FlashExporter';
import {Html5Exporter} from './Exporters/Html5Exporter';
import {Html5WorkerExporter} from './Exporters/Html5WorkerExporter';
import {JavaExporter} from './Exporters/JavaExporter';
import {KincExporter} from './Exporters/KincExporter';
import {KincHLExporter} from './Exporters/KincHLExporter';
import {KromExporter} from './Exporters/KromExporter';
import {NodeExporter} from './Exporters/NodeExporter';
import {PlayStationMobileExporter} from './Exporters/PlayStationMobileExporter';
import {WpfExporter} from './Exporters/WpfExporter';
import {writeHaxeProject} from './HaxeProject';
import * as Icon from './Icon';

let lastAssetConverter: AssetConverter;
let lastShaderCompiler: ShaderCompiler;
let lastHaxeCompiler: HaxeCompiler;

function fixName(name: string): string {
	name = name.replace(/[-@\ \.\/\\]/g, '_');
	if (name[0] === '0' || name[0] === '1' || name[0] === '2' || name[0] === '3' || name[0] === '4'
		|| name[0] === '5' || name[0] === '6' || name[0] === '7' || name[0] === '8' || name[0] === '9') {
		name = '_' + name;
	}
	return name;
}

function safeName(name: string): string {
	return name.replace(/[^A-z0-9\-\_]/g, '-');
}

function createKorefile(name: string, exporter: KhaExporter, options: Options, targetOptions: any, libraries: Library[], cdefines: string[], cflags: string[], cppflags: string[], stackSize: number, version: string, id: string, korehl: boolean, icon: string): string {
	let out = '';
	out += 'let fs = require(\'fs\');\n';
	out += 'let path = require(\'path\');\n';
	out += 'let project = new Project(\'' + name + '\');\n';
	if (version) {
		out += 'project.version = \'' + version + '\';\n';
	}
	if (id) {
		out += 'project.id = \'' + id + '\';\n';
	}
	if (icon != null) out += 'project.icon = \'' + icon + '\';\n';

	for (let cdefine of cdefines) {
		out += 'project.addDefine(\'' + cdefine + '\');\n';
	}

	for (let cppflag of cppflags) {
		out += 'project.addCppFlag(\'' + cppflag + '\');\n';
	}

	for (let cflag of cflags) {
		out += 'project.addCFlag(\'' + cflag + '\');\n';
	}

	out += 'project.addDefine(\'HXCPP_API_LEVEL=400\');\n';
	out += 'project.addDefine(\'HXCPP_DEBUG\', \'Debug\');\n';
	if (!options.slowgc) {
		out += 'project.addDefine(\'HXCPP_GC_GENERATIONAL\');\n';
	}

	if (targetOptions) {
		let koreTargetOptions: any = {};
		for (let option in targetOptions) {
			koreTargetOptions[option] = targetOptions[option];
		}
		out += 'project.targetOptions = ' + JSON.stringify(koreTargetOptions) + ';\n';
	}

	out += 'project.setDebugDir(\'' + path.relative(options.from, path.join(options.to, exporter.sysdir())).replace(/\\/g, '/') + '\');\n';

	let buildpath = path.relative(options.from, path.join(options.to, exporter.sysdir() + '-build')).replace(/\\/g, '/');
	if (buildpath.startsWith('..')) buildpath = path.resolve(path.join(options.from.toString(), buildpath));

	out += 'await project.addProject(\'' + path.join(options.kha, 'Kinc').replace(/\\/g, '/') + '\');\n';
	out += 'await project.addProject(\'' + buildpath.replace(/\\/g, '/') + '\');\n';
	if (korehl) out += 'await project.addProject(\'' + path.join(options.kha, 'Backends', 'Kinc-HL').replace(/\\/g, '/') + '\');\n';
	else out += 'await project.addProject(\'' + path.join(options.kha, 'Backends', 'Kinc-hxcpp').replace(/\\/g, '/') + '\');\n';

	for (let lib of libraries) {
		let libPath: string = lib.libpath.replace(/\\/g, '/');
		out += 'if (fs.existsSync(path.join(\'' + libPath + '\', \'kfile.js\')) || fs.existsSync(path.join(\'' + libPath + '\', \'kincfile.js\')) || fs.existsSync(path.join(\'' + libPath + '\', \'korefile.js\'))) {\n';
		out += '\tawait project.addProject(\'' + libPath + '\');\n';
		out += '}\n';
	}

	if (stackSize) {
		out += 'project.stackSize = ' + stackSize + ';\n';
	}

	out += 'project.flatten();\n';

	out += 'resolve(project);\n';

	return out;
}

function runKmake(options: string[]) {
	return new Promise<void>((resolve, reject) => {
		const child = child_process.spawn(path.join(korepath.get(), 'kmake' + sys()), options);

		child.stdout.on('data', (data: any) => {
			const str = data.toString();
			log.info(str, false);
		});

		child.stderr.on('data', (data: any) => {
			const str = data.toString();
			log.error(str, false);
		});

		child.on('error', (err: any) => {
			log.error('Could not start kmake.');
			reject();
		});

		child.on('close', (code: number) => {
			if (code === 0) {
				resolve();
			}
			else {
				reject();
			}
		});
	});
}

async function exportProjectFiles(name: string, resourceDir: string, options: Options, exporter: KhaExporter, kore: boolean, korehl: boolean, icon: string,
	libraries: Library[], targetOptions: any, defines: string[], cdefines: string[], cflags: string[], cppflags: string[], stackSize: number, version: string, id: string): Promise<string> {
	if (options.haxe !== '') {
		let haxeOptions = exporter.haxeOptions(name, targetOptions, defines);
		haxeOptions.defines.push('kha');
		haxeOptions.defines.push('kha_version=1810');
		haxeOptions.safeName = safeName(haxeOptions.name);
		haxeOptions.defines.push('kha_project_name=' + haxeOptions.name);
		if (options.livereload) haxeOptions.defines.push('kha_live_reload');

		if (options.debug && haxeOptions.parameters.indexOf('-debug') < 0) {
			haxeOptions.parameters.push('-debug');
		}

		writeHaxeProject(options.to, !options.noproject, haxeOptions);

		if (!options.nohaxe) {
			let compiler = new HaxeCompiler(options.to, haxeOptions.to, haxeOptions.realto, resourceDir, options.haxe, 'project-' + exporter.sysdir() + '.hxml', haxeOptions.sources, exporter.sysdir(), options.watchport, options.livereload, options.port);
			lastHaxeCompiler = compiler;
			try {
				await compiler.run(options.watch);
			}
			catch (error) {
				return Promise.reject(error);
			}
		}
		for (let callback of Callbacks.postHaxeCompilation) {
			callback();
		}

		await exporter.export(name, targetOptions, haxeOptions);
	}

	let buildDir = path.join(options.to, exporter.sysdir() + '-build');

	if (options.haxe !== '' && kore && !options.noproject) {
		// If target is a Kore project, generate additional project folders here.
		// generate the kincfile.js
		fs.copySync(path.join(__dirname, '..', 'Data', 'hxcpp', 'kfile.js'), path.join(buildDir, 'kfile.js'), { overwrite: true });
		fs.writeFileSync(path.join(options.to, 'kfile.js'), createKorefile(name, exporter, options, targetOptions, libraries, cdefines, cflags, cppflags, stackSize, version, id, false, icon));

		// Similar to khamake.js -> main.js -> run(...)
		// We now do kincmake.js -> main.js -> run(...)
		// This will create additional project folders for the target,
		// e.g. 'build/pi-build'
		try {
			const kmakeOptions = ['--from', options.from, '--to', buildDir, '--kfile', path.resolve(options.to, 'kfile.js'), '-t', koreplatform(options.target), '--noshaders',
				'--graphics', options.graphics, '--arch', options.arch, '--audio', options.audio, '--vr', options.vr, '-v', options.visualstudio
			];
			if (options.nosigning) {
				kmakeOptions.push('--nosigning');
			}
			if (options.debug) {
				kmakeOptions.push('--debug');
			}
			if (options.run) {
				kmakeOptions.push('--run');
			}
			if (options.compile) {
				kmakeOptions.push('--compile');
			}
			await runKmake(kmakeOptions);
			for (let callback of Callbacks.postCppCompilation) {
				callback();
			}
			log.info('Done.');
			return name;
		}
		catch (error) {
			if (error) {
				log.error('Error: ' + error);
			}
			else {
				log.error('Error.');
			}
			process.exit(1);
		}
	}
	else if (options.haxe !== '' && korehl && !options.noproject) {
		fs.copySync(path.join(__dirname, '..', 'Data', 'hl', 'kore_sources.c'), path.join(buildDir, 'kore_sources.c'), { overwrite: true });
		fs.copySync(path.join(__dirname, '..', 'Data', 'hl', 'kfile.js'), path.join(buildDir, 'kfile.js'), { overwrite: true });
		fs.writeFileSync(path.join(options.to, 'kfile.js'), createKorefile(name, exporter, options, targetOptions, libraries, cdefines, cflags, cppflags, stackSize, version, id, korehl, icon));

		try {
			const kmakeOptions = ['--from', options.from, '--to', buildDir, '--kfile', path.resolve(options.to, 'kfile.js'), '-t', koreplatform(options.target), '--noshaders',
				'--graphics', options.graphics, '--arch', options.arch, '--audio', options.audio, '--vr', options.vr, '-v', options.visualstudio
			];
			if (options.nosigning) {
				kmakeOptions.push('--nosigning');
			}
			if (options.debug) {
				kmakeOptions.push('--debug');
			}
			if (options.run) {
				kmakeOptions.push('--run');
			}
			if (options.compile) {
				kmakeOptions.push('--compile');
			}
			await runKmake(kmakeOptions);
			for (let callback of Callbacks.postCppCompilation) {
				callback();
			}
			log.info('Done.');
			return name;
		}
		catch (error) {
			if (error) {
				log.error('Error: ' + error);
			}
			else {
				log.error('Error.');
			}
			process.exit(1);
		}
	}
	else {
		// If target is not a Kore project, e.g. HTML5, finish building here.
		log.info('Done.');
		return name;
	}
}

function checkKorePlatform(platform: string) {
	return platform === 'windows'
		|| platform === 'windowsapp'
		|| platform === 'ios'
		|| platform === 'osx'
		|| platform === 'android'
		|| platform === 'linux'
		|| platform === 'emscripten'
		|| platform === 'pi'
		|| platform === 'tvos'
		|| platform === 'ps4'
		|| platform === 'xboxone'
		|| platform === 'switch'
		|| platform === 'xboxscarlett'
		|| platform === 'ps5'
		|| platform === 'freebsd';
}

function koreplatform(platform: string) {
	if (platform.endsWith('-hl')) return platform.substr(0, platform.length - '-hl'.length);
	else return platform;
}

let kore = false;
let korehl = false;

async function exportKhaProject(options: Options): Promise<string> {
	log.info('Creating Kha project.');

	let project: Project = null;
	let foundProjectFile = false;

	// get the khafile.js and load the config code,
	// then create the project config object, which contains stuff
	// like project name, assets paths, sources path, library path...
	if (fs.existsSync(path.join(options.from, options.projectfile))) {
		try {
			project = await loadProject(options.from, options.projectfile, options.target);
		}
		catch (x) {
			log.error(x);
			throw 'Loading the projectfile failed.';
		}

		foundProjectFile = true;
	}

	if (!foundProjectFile) {
		throw 'No khafile found.';
	}

	let temp = path.join(options.to, 'temp');
	fs.ensureDirSync(temp);

	let exporter: KhaExporter = null;

	let target = options.target.toLowerCase();
	let baseTarget = target;
	let customTarget: Target = null;
	if (project.customTargets.get(options.target)) {
		customTarget = project.customTargets.get(options.target);
		baseTarget = customTarget.baseTarget;
	}

	switch (baseTarget) {
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
		case Platform.Java:
			exporter = new JavaExporter(options);
			break;
		case Platform.PlayStationMobile:
			exporter = new PlayStationMobileExporter(options);
			break;
		case Platform.Node:
			exporter = new NodeExporter(options);
			break;
		case Platform.Empty:
			exporter = new EmptyExporter(options);
			break;
		default:
			if (baseTarget.endsWith('-hl')) {
				korehl = true;
				options.target = koreplatform(baseTarget);
				if (!checkKorePlatform(options.target)) {
					log.error(`Unknown platform: ${target} (baseTarget=$${baseTarget})`);
					return Promise.reject('');
				}
				exporter = new KincHLExporter(options);
			}
			else {
				kore = true;
				options.target = koreplatform(baseTarget);
				if (!checkKorePlatform(options.target)) {
					log.error(`Unknown platform: ${target} (baseTarget=$${baseTarget})`);
					return Promise.reject('');
				}
				exporter = new KincExporter(options);
			}
			break;
	}
	exporter.setSystemDirectory(target);
	let buildDir = path.join(options.to, exporter.sysdir() + '-build');

	// Create the target build folder
	// e.g. 'build/pi'
	fs.ensureDirSync(path.join(options.to, exporter.sysdir()));

	let defaultWindowOptions = {
		width: 800,
		height: 600
	};

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
	exporter.parameters = exporter.parameters.concat(project.parameters);
	project.scriptdir = options.kha;
	if (baseTarget !== Platform.Java && baseTarget !== Platform.WPF) {
		project.addShaders('Sources/Shaders/**', {});
	}

	for (let callback of Callbacks.preAssetConversion) {
		callback();
	}

	let assetConverter = new AssetConverter(exporter, options, project.assetMatchers);
	lastAssetConverter = assetConverter;
	let assets = await assetConverter.run(options.watch, temp);

	if ((target === Platform.DebugHTML5 && process.platform === 'win32') || target === Platform.HTML5) {
		Icon.exportIco(project.icon, path.join(options.to, exporter.sysdir(), 'favicon.ico'), options.from, options);
	}
	else if (target === Platform.DebugHTML5) {
		Icon.exportPng(project.icon, path.join(options.to, exporter.sysdir(), 'favicon.png'), 256, 256, 0xffffffff, true, options.from, options);
	}

	let shaderDir = path.join(options.to, exporter.sysdir() + '-resources');

	for (let callback of Callbacks.preShaderCompilation) {
		callback();
	}
	fs.ensureDirSync(shaderDir);

	let oldResources: any = null;
	let recompileAllShaders = false;
	try {
		oldResources = JSON.parse(fs.readFileSync(path.join(options.to, exporter.sysdir() + '-resources', 'files.json'), 'utf8'));
		for (let file of oldResources.files) {
			if (file.type === 'shader') {
				if (!file.files || file.files.length === 0) {
					recompileAllShaders = true;
					break;
				}
			}
		}
	}
	catch (error) {

	}

	let exportedShaders: CompiledShader[] = [];
	if (!options.noshaders) {
		if (fs.existsSync(path.join(options.from, 'Backends'))) {
			let libdirs = fs.readdirSync(path.join(options.from, 'Backends'));
			for (let ld in libdirs) {
				let libdir = path.join(options.from, 'Backends', libdirs[ld]);
				if (fs.statSync(libdir).isDirectory()) {
					let exe = path.join(libdir, 'krafix', 'krafix-' + options.target + '.exe');
					if (fs.existsSync(exe)) {
						options.krafix = exe;
					}
				}
			}
		}

		let shaderCompiler = new ShaderCompiler(exporter, baseTarget, options.krafix, shaderDir, temp,
		buildDir, options, project.shaderMatchers);
		lastShaderCompiler = shaderCompiler;
		try {
			if (baseTarget !== Platform.Java && baseTarget !== Platform.WPF) {
				exportedShaders = await shaderCompiler.run(options.watch, recompileAllShaders);
			}
		}
		catch (err) {
			return Promise.reject(err);
		}
	}

	function findShader(name: string) {
		let fallback: any = { };
		fallback.files = [];
		fallback.inputs = [];
		fallback.outputs = [];
		fallback.uniforms = [];
		fallback.types = [];

		try {
			for (let file of oldResources.files) {
				if (file.type === 'shader' && file.name === fixName(name)) {
					return file;
				}
			}
		}
		catch (error) {
			return fallback;
		}
		return fallback;
	}

	let files: {name: string, files: string[], file_sizes: number[], type: string, inputs: any[], outputs: any[], uniforms: any[], types: any[]}[] = [];
	for (let asset of assets) {
		let file: any = {
			name: fixName(asset.name),
			files: asset.files,
			file_sizes: asset.file_sizes,
			type: asset.type
		};
		if (file.type === 'image') {
			file.original_width = asset.original_width;
			file.original_height = asset.original_height;
			if (asset.readable) file.readable = asset.readable;
		}
		files.push(file);
	}
	for (let shader of exportedShaders) {
		if (shader.noembed) continue;
		let oldShader = findShader(shader.name);
		files.push({
			name: fixName(shader.name),
			files: shader.files === null ? oldShader.files : shader.files,
			file_sizes: [1],
			type: 'shader',
			inputs: shader.inputs === null ? oldShader.inputs : shader.inputs,
			outputs: shader.outputs === null ? oldShader.outputs : shader.outputs,
			uniforms: shader.uniforms === null ? oldShader.uniforms : shader.uniforms,
			types: shader.types === null ? oldShader.types : shader.types
		});
	}

	// Sort to prevent files.json from changing between makes when no files have changed.
	files.sort(function(a: any, b: any) {
		if (a.name > b.name) return 1;
		if (a.name < b.name) return -1;
		return 0;
	});

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

	for (let callback of Callbacks.preHaxeCompilation) {
		callback();
	}
	
	return await exportProjectFiles(project.name, path.join(options.to, exporter.sysdir() + '-resources'), options, exporter, kore, korehl, project.icon,
		project.libraries, project.targetOptions, project.defines, project.cdefines, project.cflags, project.cppflags, project.stackSize, project.version, project.id);
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

function runProject(options: any, name: string): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		log.info('Running...');
		let run = child_process.spawn(
			path.join(process.cwd(), options.to, 'linux-build', name),
			[],
			{ cwd: path.join(process.cwd(), options.to, 'linux') });

		run.stdout.on('data', function (data: any) {
			log.info(data.toString());
		});

		run.stderr.on('data', function (data: any) {
			log.error(data.toString());
		});

		run.on('close', function (code: number) {
			resolve();
		});
	});
}

export let api = 2;

function findKhaVersion(dir: string): string {
	let p = path.join(dir, '.git');
	let hasGitInfo = false;

	if (fs.existsSync(p)) {
		let stat = fs.statSync(p);
		hasGitInfo = stat.isDirectory();

		// otherwise git might not utilize an in-place directory
		if (!hasGitInfo) {
			let contents = fs.readFileSync(p).toString('utf8', 0, 7);
			hasGitInfo = contents === 'gitdir:';
		}
	}

	if (hasGitInfo) {
		let gitVersion = 'git-error';
		try {
			const output = child_process.spawnSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf8', cwd: dir}).output;
			for (const str of output) {
				if (str != null && str.length > 0) {
					gitVersion = str.substr(0, 8);
					break;
				}
			}
		}
		catch (error) {

		}

		let gitStatus = 'git-error';
		try {
			const output = child_process.spawnSync('git', ['status', '--porcelain'], {encoding: 'utf8', cwd: dir}).output;
			gitStatus = '';
			for (const str of output) {
				if (str != null && str.length > 0) {
					gitStatus = str.trim();
					break;
				}
			}
		}
		catch (error) {

		}

		if (gitStatus) {
			return gitVersion + ', ' + gitStatus.replace(/\n/g, ',');
		}
		else {
			return gitVersion;
		}
	}
	else {
		return '¯\\_(ツ)_/¯';
	}
}

export async function run(options: Options, loglog: any): Promise<string> {
	if (options.silent) {
		log.silent();
	}
	else {
		log.set(loglog);
	}

	if (options.quiet) {
		log.silent(true);
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
	log.info('Using Kha (' + findKhaVersion(options.kha) + ') from ' + options.kha);

	if (options.parallelAssetConversion === undefined) {
		options.parallelAssetConversion = 0;
	}

	if (!options.haxe) {
		let haxepath = path.join(options.kha, 'Tools', sysdir());
		if (fs.existsSync(haxepath) && fs.statSync(haxepath).isDirectory()) options.haxe = haxepath;
	}

	if (!options.krafix) {
		let krafixpath = path.join(options.kha, 'Kinc', 'Tools', sysdir(), 'krafix' + sys());
		if (fs.existsSync(krafixpath)) options.krafix = krafixpath;
	}

	if (!options.kraffiti) {
		const kraffitipath = path.join(options.kha, 'Kinc', 'Tools', sysdir(), 'kraffiti' + sys());
		if (fs.existsSync(kraffitipath)) options.kraffiti = kraffitipath;
	}
	else {
		log.info('Using kraffiti from ' + options.kraffiti);
	}

	if (!options.ogg && options.ffmpeg) {
		options.ogg = options.ffmpeg + ' -nostdin -i {in} {out} -y';
	}

	if (!options.mp3 && options.ffmpeg) {
		options.mp3 = options.ffmpeg + ' -nostdin -i {in} {out}';
	}

	if (!options.ogg) {
		let oggpath = path.join(options.kha, 'Tools', sysdir(), 'oggenc' + sys());
		if (fs.existsSync(oggpath)) options.ogg = oggpath + ' {in} -o {out} --quiet';
	}

	if (!options.mp3) {
		let lamepath = path.join(options.kha, 'Tools', sysdir(), 'lame' + sys());
		if (fs.existsSync(lamepath)) options.mp3 = lamepath + ' {in} {out}';
	}

	// if (!options.kravur) {
	//     let kravurpath = path.join(options.kha, 'Tools', 'kravur', 'kravur' + sys());
	//     if (fs.existsSync(kravurpath)) options.kravur = kravurpath + ' {in} {size} {out}';
	// }

	if (!options.aac && options.ffmpeg) {
		options.aac = options.ffmpeg + ' -nostdin -i {in} {out}';
	}

	if (!options.h264 && options.ffmpeg) {
		options.h264 = options.ffmpeg + ' -nostdin -i {in} {out}';
	}

	if (!options.webm && options.ffmpeg) {
		options.webm = options.ffmpeg + ' -nostdin -i {in} {out}';
	}

	if (!options.wmv && options.ffmpeg) {
		options.wmv = options.ffmpeg + ' -nostdin -i {in} {out}';
	}

	if (!options.theora && options.ffmpeg) {
		options.theora = options.ffmpeg + ' -nostdin -i {in} {out}';
	}

	if (options.target === 'emscripten') {
		console.log();
		console.log('Please note that the html5 target\n'
		+ 'is usually a better choice.\n'
		+ 'In particular the html5 target usually runs faster\n'
		+ 'than the emscripten target. That is because\n'
		+ 'Haxe and JavaScript are similar in many ways and\n'
		+ 'therefore the html5 target can make direct use of\n'
		+ 'all of the optimizations in modern JavaScript\n'
		+ 'runtimes. The emscripten target on the other hand\n'
		+ 'has to provide its own garbage collector and many\n'
		+ 'other performance critical pieces of infrastructure.'
		);
		console.log();
	}

	let name = '';
	try {
		name = await exportProject(options);
	}
	catch (err) {
		for (let callback of Callbacks.onFailure) {
			callback(err);
		}
		throw err;
	}
	
	for (let callback of Callbacks.postBuild) {
		callback();
	}

	if ((options.target === Platform.Linux || options.target === Platform.FreeBSD) && options.run) {
		await runProject(options, name);
	}

	return name;
}

export function close() {
	if (lastAssetConverter) lastAssetConverter.close();
	if (lastShaderCompiler) lastShaderCompiler.close();
	if (lastHaxeCompiler) lastHaxeCompiler.close();
}
