import * as child_process from 'child_process';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs-extra';
import * as Throttle from 'promise-parallel-throttle';

import * as log from './log';
import { executeHaxe } from './Haxe';
import { Library, Project } from './Project';
import { KhabindOptions } from './KhabindOptions';
import { Options } from './Options';

export async function generateBindings(lib:Library, bindOpts:KhabindOptions, options:Options, project:Project) {
	log.info(`Generating bindings for: ${path.basename(lib.libroot)}`);
	let webidlSourcePath = path.resolve(options.kha, 'Tools', 'webidl');
	// Call Haxe macro to generate Haxe JS/HL bindings
	// TODO: This is the longest step for a cached build. Maybe we can omit the
	// Haxe call when we don't need to update the bindings.
	await executeHaxe(lib.libroot, options.haxe, [
		'-cp', path.resolve(options.kha, 'Sources'),
		'-cp', webidlSourcePath,
		'--macro', 'kha.internal.WebIdlBinder.generate()',
	]);

	// Add webidl library to sources
	if (project.sources.indexOf(webidlSourcePath) == -1) project.sources.push(webidlSourcePath);

	// Create a Korefile for HL/C builds of the library
	var korefile = path.resolve(lib.libroot, 'korefile.js');
	var content = `let project = new Project('${path.basename(lib.libroot)}', __dirname);\n`;
	content += `project.addFile('${bindOpts.sourcesDir}/**');\n`;
	content += `project.addIncludeDir('${bindOpts.sourcesDir}');\n`;
	content += `project.addFile('khabind/${bindOpts.nativeLib}.cpp');\n`;
	content += 'resolve(project);\n';
	fs.writeFile(korefile, content);

	if (options.target == 'krom' || options.target == 'html5') {
		// Compile C++ to Javascript library
		let emsdk:string = "";
		let emcc:string = "";
		function ensureEmscripten() {
			if (emsdk != "") return;
			emsdk = process.env.EMSCRIPTEN;
			if (emsdk == undefined) {
				let msg = 'EMSCRIPTEN environment variable not set cannot compile C++ library for Javascript';
				log.error(msg);
				throw msg;
			}
			emcc = path.join(emsdk, 'emcc');
		}
		let optimizationArg = bindOpts.emccOptimizationLevel ? '-O' + bindOpts.emccOptimizationLevel : '-O2';
		let sourcesDir = path.resolve(lib.libroot, bindOpts.sourcesDir);
		let sourceFiles:string[] = [];
		let targetFiles:string[] = [];
		let invalidateCache = false;

		// Search sources
		function addSources(dir:string) {
			if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return;
			for (let item of fs.readdirSync(dir)) {
				if (fs.statSync(path.resolve(dir, item)).isDirectory()) {
					addSources(path.resolve(dir, item));

				} else if (item.endsWith('.cpp') || item.endsWith('.c')) {
					sourceFiles.push(path.resolve(dir, item));
				}
			}
		}

		addSources(sourcesDir);
		addSources(path.resolve(lib.libroot, 'khabind'));

		function compileSource(file:string) {
			return new Promise<void>(async (resolve, reject:(err:string)=>void) => {
				let needsRecompile = false;
				// TODO: Put bytecode in its own folder so we don't clutter the sources
				let targetFile = file.substr(0, file.length - path.extname(file).length) + ".bc";
				targetFiles.push(targetFile);

				if (await fs.pathExists(targetFile)) {
					if ((await fs.stat(file)).mtime.getTime() > (await fs.stat(targetFile)).mtime.getTime()) {
						ensureEmscripten();
						needsRecompile = invalidateCache = true;
					}  
				} else { ensureEmscripten(); needsRecompile = invalidateCache = true;}

				if (needsRecompile) {
					log.info(`    Compiling ${path.relative(lib.libroot, file)}`);
					let stderr = "";
					let run = child_process.spawn(
						emcc, [optimizationArg, `-I${sourcesDir}`, '-c', file, '-o', targetFile],
						{cwd: lib.libroot}
					);

					run.stderr.on('data', function (data: any) {
						stderr += data.toString();
					});

					run.on('close', function (code: number) {
						if (stderr != "") {
							reject(stderr);
						} else {
							resolve();
						}
					});
				} else {
					resolve();
				}
			});
		}

		let jobs = sourceFiles.map(file => () => compileSource(file));

		// Compile sources
		await Throttle.all(jobs, {
			maxInProgress: os.cpus().length,
			failFast: true
		}).catch(err => {
			log.info(err);
		});

		// Link bytecode to final JavaScript library
		if (invalidateCache || !fs.existsSync(path.join(lib.libroot, 'khabind', bindOpts.nativeLib + '.js'))) {
			log.info('    Linking Javascript Library');
			ensureEmscripten();
			let args = [
				optimizationArg,
				'-s', 'EXPORT_NAME=' + bindOpts.nativeLib,
				'-o', path.join('khabind', bindOpts.nativeLib) + '.js',
				...bindOpts.emccArgs.reduce((a, b) => {return a + ' ' + b}).split(" "), // Remove spaces from emccArgs
			];
			let output = child_process.spawnSync(emcc, 
				[...targetFiles, ...args],
				{cwd:lib.libroot}
			);
			if (output.stderr.toString() !== '') {
				log.error(output.stderr.toString());
			}
			if (output.stdout.toString() !== '') {
				log.info(output.stdout.toString());
			}
		}

		// Add JavaScript library to assets list
		project.addAssets(
			path.resolve(lib.libroot, 'khabind', bindOpts.nativeLib + '.js'),
			{name: '_khabind_' + bindOpts.nativeLib + '_js'}
		);
	} // If (options.target == 'krom' || options.target == 'html5')

	log.info(`Done generating bindings for: ${lib.libroot}`);
}
