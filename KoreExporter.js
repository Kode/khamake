"use strict";

const fs = require('fs-extra');
const path = require('path');
const KhaExporter = require('./KhaExporter.js');
const Converter = require('./Converter.js');
const Files = require('./Files.js');
const Haxe = require('./Haxe.js');
const Paths = require('./Paths.js');
const Platform = require('./Platform.js');
const exportImage = require('./ImageTool.js');
const HaxeProject = require('./HaxeProject.js');

class KoreExporter extends KhaExporter {
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

	exportSolution(name, platform, khaDirectory, haxeDirectory, from, _targetOptions, defines) {
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
		HaxeProject(this.directory.toString(), options);

		//Files.removeDirectory(this.directory.resolve(Paths.get(this.sysdir() + "-build", "Sources")));

		return Haxe.executeHaxe(this.directory, haxeDirectory, ["project-" + this.sysdir() + ".hxml"]);
	}

	/*copyMusic(platform, from, to, encoders, callback) {
		Files.createDirectories(this.directory.resolve(this.sysdir()).resolve(to).parent());
		Converter.convert(from, this.directory.resolve(this.sysdir()).resolve(to + '.ogg'), encoders.oggEncoder, (success) => {
			callback([to + '.ogg']);
		});
	}*/

	copySound(platform, from, to, encoders) {
		fs.copySync(from.toString(), this.directory.resolve(this.sysdir()).resolve(to + '.wav').toString(), { clobber: true });
		return [to + '.wav'];
	}

	copyImage(platform, from, to, asset) {
		if (platform === Platform.iOS && asset.compressed) {
			let format = exportImage(from, this.directory.resolve(this.sysdir()).resolve(to), asset, 'pvr', true);
			return [to + '.' + format];
		}
		/*else if (platform === Platform.Android && asset.compressed) {
		 var index = to.toString().lastIndexOf('.');
		 to = to.toString().substr(0, index) + '.astc';
		 asset.file = to.toString().replaceAll('\\', '/');
		 exportImage(from, this.directory.resolve(this.sysdir()).resolve(to), asset, 'astc', true, callback);
		 }*/
		else {
			let format = exportImage(from, this.directory.resolve(this.sysdir()).resolve(to), asset, undefined, true);
			return [to + '.' + format];
		}
	}

	copyBlob(platform, from, to) {
		fs.copySync(from.toString(), this.directory.resolve(this.sysdir()).resolve(to).toString(), { clobber: true });
		return [to];
	}

	copyVideo(platform, from, to, encoders) {
		Files.createDirectories(this.directory.resolve(this.sysdir()).resolve(to).parent());
		if (platform === Platform.iOS) {
			Converter.convert(from, this.directory.resolve(this.sysdir()).resolve(to + '.mp4'), encoders.h264Encoder);
			return [to + '.mp4'];
		}
		else if (platform === Platform.Android) {
			Converter.convert(from, this.directory.resolve(this.sysdir()).resolve(to + '.ts'), encoders.h264Encoder);
			return [to + '.ts'];
		}
		else {
			Converter.convert(from, this.directory.resolve(this.sysdir()).resolve(to + '.ogv'), encoders.theoraEncoder);
			return [to + '.ogv'];
		}
	}
}

module.exports = KoreExporter;
