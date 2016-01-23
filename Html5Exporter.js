"use strict";

const path = require('path');
const KhaExporter = require('./KhaExporter.js');
const Converter = require('./Converter.js');
const Files = require('./Files.js');
const Haxe = require('./Haxe.js');
const Options = require('./Options.js');
const Paths = require('./Paths.js');
const exportImage = require('./ImageTool.js');
const fs = require('fs-extra');
const HaxeProject = require('./HaxeProject.js');

class Html5Exporter extends KhaExporter {
	constructor(khaDirectory, directory) {
		super(khaDirectory, directory);
		this.directory = directory;
		this.addSourceDirectory(path.join(khaDirectory.toString(), 'Backends/HTML5'));
	}

	sysdir() {
		return 'html5';
	}

	exportSolution(name, platform, khaDirectory, haxeDirectory, from, _targetOptions) {
		this.createDirectory(this.directory.resolve(this.sysdir()));

		let defines = [
			'sys_' + platform,
			'sys_g1', 'sys_g2', 'sys_g3', 'sys_g4',
			'sys_a1', 'sys_a2'
		];
		if (this.sysdir() === 'node') {
			defines = [
				'sys_node',
				'sys_server',
				'nodejs'
			]
		}
		if (this.sysdir() === 'debug-html5') {
			defines.push('sys_debug_html5');
			this.parameters.push('-debug');
		}

		const options = {
			from: from.toString(),
			to: path.join(this.sysdir(), 'kha.js'),
			sources: this.sources,
			defines: defines,
			parameters: this.parameters,
			haxeDirectory: haxeDirectory.toString(),
			system: this.sysdir(),
			language: 'js',
			width: this.width,
			height: this.height,
			name: name
		};
		HaxeProject(this.directory.toString(), options);

		if (this.sysdir() === 'debug-html5') {
			let index = this.directory.resolve(Paths.get(this.sysdir(), 'index.html'));
			if (!Files.exists(index)) {
				let protoindex = fs.readFileSync(path.join(__dirname, 'Data', 'debug-html5', 'index.html'), {encoding: 'utf8'});
				protoindex = protoindex.replaceAll('{Name}', name);
				protoindex = protoindex.replaceAll('{Width}', this.width);
				protoindex = protoindex.replaceAll('{Height}', this.height);
				fs.writeFileSync(index.toString(), protoindex);
			}
			
			let pack = this.directory.resolve(Paths.get(this.sysdir(), 'package.json'));
			let protopackage = fs.readFileSync(path.join(__dirname, 'Data', 'debug-html5', 'package.json'), {encoding: 'utf8'});
			protopackage = protopackage.replaceAll('{Name}', name);
			fs.writeFileSync(pack.toString(), protopackage);
			
			let electron = this.directory.resolve(Paths.get(this.sysdir(), 'electron.js'));
			let protoelectron = fs.readFileSync(path.join(__dirname, 'Data', 'debug-html5', 'electron.js'), {encoding: 'utf8'});
			protoelectron = protoelectron.replaceAll('{Width}', this.width + 20);
			protoelectron = protoelectron.replaceAll('{Height}', this.height + 20);
			fs.writeFileSync(electron.toString(), protoelectron);
		}
		else {		
			let index = this.directory.resolve(Paths.get(this.sysdir(), 'index.html'));
			if (!Files.exists(index)) {
				let protoindex = fs.readFileSync(path.join(__dirname, 'Data', 'html5', 'index.html'), {encoding: 'utf8'});
				protoindex = protoindex.replaceAll('{Name}', name);
				protoindex = protoindex.replaceAll('{Width}', this.width);
				protoindex = protoindex.replaceAll('{Height}', this.height);
				fs.writeFileSync(index.toString(), protoindex);
			}
		}
		
		if (Options.compilation) {
			return Haxe.executeHaxe(this.directory, haxeDirectory, ['project-' + this.sysdir() + '.hxml']);
		}
		else {
			return 0;
		}
	}

	/*copyMusic(platform, from, to, encoders, callback) {
		Files.createDirectories(this.directory.resolve(this.sysdir()).resolve(to).parent());
		Converter.convert(from, this.directory.resolve(this.sysdir()).resolve(to + '.ogg'), encoders.oggEncoder, (ogg) => {
			Converter.convert(from, this.directory.resolve(this.sysdir()).resolve(to + '.mp4'), encoders.aacEncoder, (mp4) => {
				var files = [];
				if (ogg) files.push(to + '.ogg');
				if (mp4) files.push(to + '.mp4');
				callback(files);
			});
		});
	}*/

	copySound(platform, from, to, encoders) {
		Files.createDirectories(this.directory.resolve(this.sysdir()).resolve(to).parent());
		let ogg = Converter.convert(from, this.directory.resolve(this.sysdir()).resolve(to + '.ogg'), encoders.oggEncoder);
		let mp4 = Converter.convert(from, this.directory.resolve(this.sysdir()).resolve(to + '.mp4'), encoders.aacEncoder);
		var files = [];
		if (ogg) files.push(to + '.ogg');
		if (mp4) files.push(to + '.mp4');
		return files;
	}

	copyImage(platform, from, to, asset) {
		let format = exportImage(from, this.directory.resolve(this.sysdir()).resolve(to), asset, undefined, false);
		return [to + '.' + format];
	}

	copyBlob(platform, from, to) {
		fs.copySync(from.toString(), this.directory.resolve(this.sysdir()).resolve(to).toString(), { clobber: true });
		return [to];
	}

	copyVideo(platform, from, to, encoders) {
		Files.createDirectories(this.directory.resolve(this.sysdir()).resolve(to).parent());
		let mp4 = Converter.convert(from, this.directory.resolve(this.sysdir()).resolve(to + ".mp4"), encoders.h264Encoder);
		let webm = Converter.convert(from, this.directory.resolve(this.sysdir()).resolve(to + ".webm"), encoders.webmEncoder);
		let files = [];
		if (mp4) files.push(to + '.mp4');
		if (webm) files.push(to + '.webm');
		return files;
	}
}

module.exports = Html5Exporter;
