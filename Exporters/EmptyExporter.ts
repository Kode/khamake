import * as child_process from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';
import {KhaExporter} from './KhaExporter';
import {convert} from '../Converter';
import {executeHaxe} from '../Haxe';
import {Options} from '../Options';
import {exportImage} from '../ImageTool';
import {writeHaxeProject} from '../HaxeProject';
import * as log from '../log';

export class EmptyExporter extends KhaExporter {
	parameters: Array<string>;
	
	constructor(options: Options) {
		super(options);
		this.addSourceDirectory(path.join(options.kha, 'Backends', 'Empty'));
	}

	sysdir() {
		return 'empty';
	}

	haxeOptions(name: string, targetOptions: any, defines: Array<string>) {
		defines.push('sys_g1');
		defines.push('sys_g2');
		defines.push('sys_g3');
		defines.push('sys_g4');
		defines.push('sys_a1');
		defines.push('sys_a2');
		
		return {
			from: this.options.from,
			to: path.join(this.sysdir(), 'docs.xml'),
			sources: this.sources,
			defines: defines,
			parameters: this.parameters,
			haxeDirectory: this.options.haxe,
			system: this.sysdir(),
			language: 'xml',
			width: this.width,
			height: this.height,
			name: name
		};
	}

	async exportSolution(name: string, _targetOptions: any, defines: Array<string>): Promise<any> {
		fs.ensureDirSync(path.join(this.options.to, this.sysdir()));

		let haxeOptions = this.haxeOptions(name, _targetOptions, defines);
		writeHaxeProject(this.options.to, haxeOptions);

		let result = await executeHaxe(this.options.to, this.options.haxe, ['project-' + this.sysdir() + '.hxml']);
		if (result === 0) {
			let doxresult = child_process.spawnSync('haxelib', ['run', 'dox', '-in', 'kha.*', '-i', path.join('build', this.sysdir(), 'docs.xml')], { env: process.env, cwd: path.normalize(this.options.from) });
			if (doxresult.stdout.toString() !== '') {
				log.info(doxresult.stdout.toString());
			}

			if (doxresult.stderr.toString() !== '') {
				log.error(doxresult.stderr.toString());
			}
		}

		return haxeOptions;
	}

	async copySound(platform: string, from: string, to: string) {
		return [];
	}

	async copyImage(platform: string, from: string, to: string, asset: any) {
		return [];
	}

	async copyBlob(platform: string, from: string, to: string) {
		return [];
	}

	async copyVideo(platform: string, from: string, to: string) {
		return [];
	}
}
