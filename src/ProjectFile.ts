import * as fs from 'fs';
import * as path from 'path';
import * as log from './log';
import {Platform} from './Platform';
import {Project} from './Project';

export let Callbacks = {
	preAssetConversion:    [() => {}],
	preShaderCompilation:  [() => {}],
	preHaxeCompilation:    [() => {}],
	postHaxeCompilation:   [() => {}],
	postHaxeRecompilation: [() => {}],
	postCppCompilation:    [() => {}],
	postAssetReexporting:  [(filePath: string) => {}]
};

export async function loadProject(from: string, projectfile: string, platform: string): Promise<Project> {
	return new Promise<Project>((resolve, reject) => {
		fs.readFile(path.join(from, projectfile), 'utf8', (err, data) => {
			if (err) {
				throw new Error('Error reading ' + projectfile + ' from ' + from + '.');
			}

			let resolved = false;
			let callbacks = {
				preAssetConversion:    () => {},
				preShaderCompilation:  () => {},
				preHaxeCompilation:    () => {},
				postHaxeCompilation:   () => {},
				postHaxeRecompilation: () => {},
				postCppCompilation:    () => {},
				postAssetReexporting:  (filePath: string) => {},
			};
			let resolver = (project: Project) => {
				resolved = true;
				Callbacks.preAssetConversion.push(callbacks.preAssetConversion);
				Callbacks.preShaderCompilation.push(callbacks.preShaderCompilation);
				Callbacks.preHaxeCompilation.push(callbacks.preHaxeCompilation);
				Callbacks.postHaxeCompilation.push(callbacks.postHaxeCompilation);
				Callbacks.postHaxeRecompilation.push(callbacks.postHaxeRecompilation);
				Callbacks.postCppCompilation.push(callbacks.postCppCompilation);
				Callbacks.postAssetReexporting.push(callbacks.postAssetReexporting);
				resolve(project);
			};

			process.on('exit', (code: number) => {
				if (!resolved) {
					console.error('Error: khafile.js did not call resolve, no project created.');
				}
			});

			Project.platform = platform;
			Project.scriptdir = from;
			try {
				let AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;
				new AsyncFunction('Project', 'Platform', 'platform', 'require', '__dirname', 'process', 'resolve', 'reject', 'callbacks', data)
					(Project, Platform, platform, require, path.resolve(from), process, resolver, reject, callbacks);
			}
			catch (error) {
				reject(error);
			}
		});
	});
}
