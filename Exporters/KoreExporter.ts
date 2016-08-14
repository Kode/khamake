import * as fs from 'fs-extra';
import * as path from 'path';
import {KhaExporter} from './KhaExporter';
import {convert} from '../Converter';
import {executeHaxe} from '../Haxe';
import {Platform} from '../Platform';
import {exportImage} from '../ImageTool';
import {writeHaxeProject} from '../HaxeProject';
import {hxml} from '../HaxeProject';
import {Options} from '../Options';

export class KoreExporter extends KhaExporter {
	parameters: Array<string>
	
	constructor(options: Options) {
		super(options);
		this.addSourceDirectory(path.join(options.kha, 'Backends', 'Kore'));
	}

	sysdir() {
		if (this.options.target === 'android') return 'android-native';
		else if (this.options.target === 'html5') return 'html5-native';
		return this.options.target;
	}

	haxeOptions(name: string, targetOptions: any, defines: Array<string>) {
		defines.push('no-compilation');
		defines.push('sys_' + this.options.target);
		defines.push('sys_g1');
		defines.push('sys_g2');
		defines.push('sys_g3');
		defines.push('sys_g4');
		defines.push('sys_a1');
		defines.push('sys_a2');

		if (this.options.vr === 'gearvr') {
			defines.push('vr_gearvr');
		}
		else if (this.options.vr === 'cardboard') {
			defines.push('vr_cardboard');
		}
		else if (this.options.vr === 'rift') {
			defines.push('vr_rift');
		}

		return {
			from: this.options.from,
			to: path.join(this.sysdir() + '-build', 'Sources'),
			sources: this.sources,
			libraries: this.libraries,
			defines: defines,
			parameters: this.parameters,
			haxeDirectory: this.options.haxe,
			system: this.sysdir(),
			language: 'cpp',
			width: this.width,
			height: this.height,
			name: name
		};
	}

	async exportSolution(name: string, targetOptions: any, haxeOptions: any): Promise<void> {
		hxml(this.options.to, haxeOptions);

		if (this.projectFiles) {
			writeHaxeProject(this.options.to, haxeOptions);
		}
		//Files.removeDirectory(this.directory.resolve(Paths.get(this.sysdir() + "-build", "Sources")));
	}

	/*copyMusic(platform, from, to, encoders, callback) {
		Files.createDirectories(this.directory.resolve(this.sysdir()).resolve(to).parent());
		Converter.convert(from, this.directory.resolve(this.sysdir()).resolve(to + '.ogg'), encoders.oggEncoder, (success) => {
			callback([to + '.ogg']);
		});
	}*/

	async copySound(platform: string, from: string, to: string) {
		fs.copySync(from.toString(), path.join(this.options.to, this.sysdir(), to + '.wav'), { clobber: true });
		return [to + '.wav'];
	}

	async copyImage(platform: string, from: string, to: string, options: any) {
		if (platform === Platform.iOS && options.quality < 1) {
			let format = await exportImage(this.options.kha, from, path.join(this.options.to, this.sysdir(), to), options, 'pvr', true);
			return [to + '.' + format];
		}
		/*else if (platform === Platform.Android && asset.compressed) {
		 var index = to.toString().lastIndexOf('.');
		 to = to.toString().substr(0, index) + '.astc';
		 asset.file = to.toString().replace(/\\/g, '/');
		 exportImage(from, this.directory.resolve(this.sysdir()).resolve(to), asset, 'astc', true, callback);
		 }*/
		else {
			let format = await exportImage(this.options.kha, from, path.join(this.options.to, this.sysdir(), to), options, undefined /*'snappy'*/, true);
			return [to + '.' + format];
		}
	}

	async copyBlob(platform: string, from: string, to: string) {
		fs.copySync(from.toString(), path.join(this.options.to, this.sysdir(), to), { clobber: true });
		return [to];
	}

	async copyVideo(platform: string, from: string, to: string) {
		fs.ensureDirSync(path.join(this.options.to, this.sysdir(), path.dirname(to)));
		if (platform === Platform.iOS) {
			await convert(from, path.join(this.options.to, this.sysdir(), to + '.mp4'), this.options.h264);
			return [to + '.mp4'];
		}
		else if (platform === Platform.Android) {
			await convert(from, path.join(this.options.to, this.sysdir(), to + '.ts'), this.options.h264);
			return [to + '.ts'];
		}
		else {
			await convert(from, path.join(this.options.to, this.sysdir(), to + '.ogv'), this.options.theora);
			return [to + '.ogv'];
		}
	}
}
