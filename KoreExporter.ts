"use strict";

import * as fs from 'fs-extra';
import * as path from 'path';
import {KhaExporter} from './KhaExporter';
import {convert} from './Converter';
import {executeHaxe} from './Haxe';
import {Platform} from './Platform';
import {exportImage} from './ImageTool';
import {writeHaxeProject} from './HaxeProject';

export class KoreExporter extends KhaExporter {
	platform: string;
	directory: string;
	vr: string;
	parameters: Array<string>
	
	constructor(platform, khaDirectory, vr, directory) {
		super(khaDirectory, directory);
		this.platform = platform;
		this.directory = directory;
		this.addSourceDirectory(path.join(khaDirectory.toString(), 'Backends/Kore'));
		this.vr = vr;
	}

	sysdir() {
		return this.platform;
	}

	async exportSolution(name: string, platform: string, khaDirectory: string, haxeDirectory: string, from: string, _targetOptions: any, defines: Array<string>) {
		defines.push('no-compilation');
		defines.push('sys_' + platform);
		defines.push('sys_g1');
		defines.push('sys_g2');
		defines.push('sys_g3');
		defines.push('sys_g4');
		defines.push('sys_a1');
		defines.push('sys_a2');

		if (this.vr === 'gearvr') {
			defines.push('vr_gearvr');
		}
		else if (this.vr === 'cardboard') {
			defines.push('vr_cardboard');
		}
		else if (this.vr === 'rift') {
			defines.push('vr_rift');
		}

		const options = {
			from: from.toString(),
			to: path.join(this.sysdir() + '-build', 'Sources'),
			sources: this.sources,
			libraries: this.libraries,
			defines: defines,
			parameters: this.parameters,
			haxeDirectory: haxeDirectory.toString(),
			system: this.sysdir(),
			language: 'cpp',
			width: this.width,
			height: this.height,
			name: name
		};
		writeHaxeProject(this.directory.toString(), options);

		//Files.removeDirectory(this.directory.resolve(Paths.get(this.sysdir() + "-build", "Sources")));

		return executeHaxe(this.directory, haxeDirectory, ["project-" + this.sysdir() + ".hxml"]);
	}

	/*copyMusic(platform, from, to, encoders, callback) {
		Files.createDirectories(this.directory.resolve(this.sysdir()).resolve(to).parent());
		Converter.convert(from, this.directory.resolve(this.sysdir()).resolve(to + '.ogg'), encoders.oggEncoder, (success) => {
			callback([to + '.ogg']);
		});
	}*/

	async copySound(platform, from, to, encoders) {
		fs.copySync(from.toString(), path.join(this.directory, this.sysdir(), to + '.wav'), { clobber: true });
		return [to + '.wav'];
	}

	async copyImage(platform, from, to, asset) {
		if (platform === Platform.iOS && asset.compressed) {
			let format = exportImage(from, path.join(this.directory, this.sysdir(), to), asset, 'pvr', true);
			return [to + '.' + format];
		}
		/*else if (platform === Platform.Android && asset.compressed) {
		 var index = to.toString().lastIndexOf('.');
		 to = to.toString().substr(0, index) + '.astc';
		 asset.file = to.toString().replaceAll('\\', '/');
		 exportImage(from, this.directory.resolve(this.sysdir()).resolve(to), asset, 'astc', true, callback);
		 }*/
		else {
			let format = await exportImage(from, path.join(this.directory, this.sysdir(), to), asset, undefined, true);
			return [to + '.' + format];
		}
	}

	async copyBlob(platform, from, to) {
		fs.copySync(from.toString(), path.join(this.directory, this.sysdir(), to), { clobber: true });
		return [to];
	}

	async copyVideo(platform, from, to, encoders) {
		fs.ensureDirSync(path.join(this.directory, this.sysdir(), path.dirname(to)));
		if (platform === Platform.iOS) {
			await convert(from, path.join(this.directory, this.sysdir(), to + '.mp4'), encoders.h264Encoder);
			return [to + '.mp4'];
		}
		else if (platform === Platform.Android) {
			await convert(from, path.join(this.directory, this.sysdir(), to + '.ts'), encoders.h264Encoder);
			return [to + '.ts'];
		}
		else {
			await convert(from, path.join(this.directory, this.sysdir(), to + '.ogv'), encoders.theoraEncoder);
			return [to + '.ogv'];
		}
	}
}
