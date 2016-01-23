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
const uuid = require('./uuid.js');
const HaxeProject = require('./HaxeProject.js');

class UnityExporter extends KhaExporter {
	constructor(khaDirectory, directory) {
		super(khaDirectory, directory);
		this.directory = directory;
	}

	sysdir() {
		return 'unity';
	}

	exportSolution(name, platform, khaDirectory, haxeDirectory, from, _targetOptions) {
		this.addSourceDirectory("Kha/Backends/Unity");

		const defines = [
			'no-root',
			'no-compilation',
			'sys_' + platform,
			'sys_g1', 'sys_g2', 'sys_g3', 'sys_g4',
			'sys_a1'
		];

		const options = {
			from: from.toString(),
			to: path.join(this.sysdir(), 'Assets', 'Sources'),
			sources: this.sources,
			defines: defines,
			parameters: this.parameters,
			haxeDirectory: haxeDirectory.toString(),
			system: this.sysdir(),
			language: 'cs',
			width: this.width,
			height: this.height,
			name: name
		};
		HaxeProject(this.directory.toString(), options);

		Files.removeDirectory(this.directory.resolve(Paths.get(this.sysdir(), "Assets", "Sources")));

		let result = Haxe.executeHaxe(this.directory, haxeDirectory, ['project-' + this.sysdir() + '.hxml']);
		var copyDirectory = (from, to) => {
			let files = fs.readdirSync(path.join(__dirname, 'Data', 'unity', from));
			this.createDirectory(this.directory.resolve(Paths.get(this.sysdir(), to)));
			for (let file of files) {
				var text = fs.readFileSync(path.join(__dirname, 'Data', 'unity', from, file), {encoding: 'utf8'});
				fs.writeFileSync(this.directory.resolve(Paths.get(this.sysdir(), to, file)).toString(), text);
			}
		};
		copyDirectory('Assets', 'Assets');
		copyDirectory('Editor', 'Assets/Editor');
		copyDirectory('ProjectSettings', 'ProjectSettings');
		return result;
	}

	/*copyMusic(platform, from, to, encoders, callback) {
		callback([to]);
	}*/

	copySound(platform, from, to, encoders) {
		return [to];
	}

	copyImage(platform, from, to, asset) {
		let format = exportImage(from, this.directory.resolve(this.sysdir()).resolve(Paths.get('Assets', 'Resources', 'Images', to)), asset, undefined, false, true);
		return [to + '.' + format];
	}

	copyBlob(platform, from, to) {
		fs.copySync(from.toString(), this.directory.resolve(this.sysdir()).resolve(Paths.get('Assets', 'Resources', 'Blobs', to.toString() + '.bytes')).toString(), { clobber: true });
		return [to];
	}

	copyVideo(platform, from, to, encoders) {
		return [to];
	}
}

module.exports = UnityExporter;
