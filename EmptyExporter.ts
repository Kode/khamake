"use strict";

import * as child_process from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';
import {KhaExporter} from './KhaExporter';
import {convert} from './Converter';
import {executeHaxe} from './Haxe';
import {Options} from './Options';
import {exportImage} from './ImageTool';
import {writeHaxeProject} from './HaxeProject';
import * as log from './log';

export class EmptyExporter extends KhaExporter {
	parameters: Array<string>;
	
	constructor(khaDirectory, directory) {
		super(khaDirectory, directory);
		this.addSourceDirectory(path.join(khaDirectory.toString(), 'Backends/Empty'));
	}

	sysdir() {
		return 'empty';
	}

	async exportSolution(name, platform, khaDirectory, haxeDirectory, from, _targetOptions, defines) {
		fs.ensureDirSync(path.join(this.directory, this.sysdir()));

		defines.push('sys_g1');
		defines.push('sys_g2');
		defines.push('sys_g3');
		defines.push('sys_g4');
		defines.push('sys_a1');
		defines.push('sys_a2');
		
		const options = {
			from: from.toString(),
			to: path.join(this.sysdir(), 'docs.xml'),
			sources: this.sources,
			defines: defines,
			parameters: this.parameters,
			haxeDirectory: haxeDirectory.toString(),
			system: this.sysdir(),
			language: 'xml',
			width: this.width,
			height: this.height,
			name: name
		};
		await writeHaxeProject(this.directory.toString(), options);

		if (Options.compilation) {
			let result = await executeHaxe(this.directory, haxeDirectory, ['project-' + this.sysdir() + '.hxml']);
			if (result === 0) {
				let doxresult = child_process.spawnSync('haxelib', ['run', 'dox', '-in', 'kha.*', '-i', path.join('build', options.to)], { env: process.env, cwd: path.normalize(from.toString()) });
				if (doxresult.stdout.toString() !== '') {
					log.info(doxresult.stdout.toString());
				}

				if (doxresult.stderr.toString() !== '') {
					log.error(doxresult.stderr.toString());
				}
			}
			return result;
		}
		else {
			return 0;
		}
	}

	async copySound(platform, from, to, encoders) {
		return [];
	}

	async copyImage(platform, from, to, asset) {
		return [];
	}

	async copyBlob(platform, from, to) {
		return [];
	}

	async copyVideo(platform, from, to, encoders) {
		return [];
	}
}
