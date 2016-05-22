"use strict";

import * as fs from 'fs-extra';
import * as path from 'path';
import {KhaExporter} from './KhaExporter';
import {convert} from './Converter';
import {executeHaxe} from './Haxe';
import {Options} from './Options';
import {exportImage} from './ImageTool';
import {writeHaxeProject} from './HaxeProject';

export class KromExporter extends KhaExporter {
	parameters: Array<string>;
	width: number;
	height: number;
	
	constructor(options: Options) {
		super(options);
		this.addSourceDirectory(path.join(options.kha, 'Backends', 'Krom'));
	}

	sysdir() {
		return 'krom';
	}
	
	haxeOptions(name: string, defines: Array<string>) {
		defines.push('sys_g1');
		defines.push('sys_g2');
		defines.push('sys_g3');
		defines.push('sys_g4');
		defines.push('sys_a1');
		//defines.push('sys_a2');
		
		return {
			from: this.options.from.toString(),
			to: path.join(this.sysdir(), 'krom.js'),
			sources: this.sources,
			libraries: this.libraries,
			defines: defines,
			parameters: this.parameters,
			haxeDirectory: this.options.haxe,
			system: this.sysdir(),
			language: 'js',
			width: this.width,
			height: this.height,
			name: name
		};
	}

	async exportSolution(name: string, _targetOptions: any, defines: Array<string>): Promise<void> {
		fs.ensureDirSync(path.join(this.options.to, this.sysdir()));

		writeHaxeProject(this.options.to, this.haxeOptions(name, defines));
	}

	async copySound(platform: string, from: string, to: string) {
		fs.ensureDirSync(path.join(this.options.to, this.sysdir(), path.dirname(to)));
		let ogg = await convert(from, path.join(this.options.to, this.sysdir(), to + '.ogg'), this.options.ogg);
		var files = [];
		if (ogg) files.push(to + '.ogg');
		return files;
	}

	async copyImage(platform: string, from: string, to: string, options: any) {
		let format = await exportImage(from, path.join(this.options.to, this.sysdir(), to), options, undefined, false);
		return [to + '.' + format];
	}

	async copyBlob(platform: string, from: string, to: string) {
		fs.copySync(from.toString(), path.join(this.options.to, this.sysdir(), to), { clobber: true });
		return [to];
	}

	async copyVideo(platform: string, from: string, to: string) {
		fs.ensureDirSync(path.join(this.options.to, this.sysdir(), path.dirname(to)));
		let webm = await convert(from, path.join(this.options.to, this.sysdir(), to + '.webm'), this.options.webm);
		let files = [];
		if (webm) files.push(to + '.webm');
		return files;
	}
}
