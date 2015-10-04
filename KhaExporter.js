"use strict";

const path = require('path');
const Exporter = require('./Exporter.js');
const Files = require('./Files.js');
const Converter = require('./Converter.js');

class KhaExporter extends Exporter {
	constructor(khaDirectory) {
		super();
		this.width = 640;
		this.height = 480;
		this.sources = [];
		this.addSourceDirectory('Sources');
		this.addSourceDirectory(path.join(khaDirectory.toString(), 'Sources'));
	}

	getCurrentDirectoryName(directory) {
		return directory.getFileName();
	}

	copyFile(from, to) {
		Files.copy(from, to, true);
	}

	copyDirectory(from, to) {
		this.createDirectory(to);
		var files = Files.newDirectoryStream(from);
		for (let f in files) {
			let file = Paths.get(from, files[f]);
			if (Files.isDirectory(file)) this.copyDirectory(file, to.resolve(file));
			else this.copyFile(file, to.resolve(file));
		}
	}

	createDirectory(dir) {
		if (!Files.exists(dir)) Files.createDirectories(dir);
	}

	setWidthAndHeight(width, height) {
		this.width = width;
		this.height = height;
	}

	setName(name) {
		this.name = name;
		this.safename = name.replaceAll(' ', '-');
	}

	addShader(shader) {

	}

	addSourceDirectory(path) {
		this.sources.push(path);
	}

	removeSourceDirectory(path) {
		for (let i in this.sources) {
			if (this.sources[i] === path) {
				this.sources.splice(i, 1);
				return;
			}
		}
	}

	copyImage(platform, from, to, asset, callback) {
		callback();
	}

	copyMusic(platform, from, to, encoders, callback) {
		callback();
	}

	copySound(platform, from, to, encoders, callback) {
		callback();
	}

	copyVideo(platform, from, to, encoders, callback) {
		callback();
	}

	copyBlob(platform, from, to, callback) {
		callback();
	}

	copyFont(platform, from, to, asset, encoders, callback) {
		Files.createDirectories(this.directory.resolve(this.sysdir()).resolve(to).parent());
		Converter.convert(from, this.directory.resolve(this.sysdir()).resolve(to), encoders.kravur, (success) => {
			callback([to]);
		}, {size: asset.size});
	}
}

module.exports = KhaExporter;
