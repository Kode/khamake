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

class EmptyExporter extends KhaExporter {
	constructor(khaDirectory, directory) {
		super(khaDirectory, directory);
		this.directory = directory;
		this.addSourceDirectory(path.join(khaDirectory.toString(), 'Backends/Empty'));
	}

	sysdir() {
		return 'empty';
	}

	exportSolution(name, platform, khaDirectory, haxeDirectory, from, _targetOptions, defines) {
		this.createDirectory(this.directory.resolve(this.sysdir()));

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
		HaxeProject(this.directory.toString(), options);

		if (Options.compilation) {
			return Haxe.executeHaxe(this.directory, haxeDirectory, ['project-' + this.sysdir() + '.hxml']);
		}
		else {
			return 0;
		}
	}

	copySound(platform, from, to, encoders) {
		return [];
	}

	copyImage(platform, from, to, asset) {
		return [];
	}

	copyBlob(platform, from, to) {
		return [];
	}

	copyVideo(platform, from, to, encoders) {
		return [];
	}
}

module.exports = EmptyExporter;
