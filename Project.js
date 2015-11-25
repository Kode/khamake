"use strict";

const Files = require('./Files.js');
const Paths = require('./Paths.js');

function isAbsolute(path) {
	return (path.length > 0 && path[0] == '/') || (path.length > 1 && path[1] == ':');
}

function matches(text, pattern) {
	const regexstring = pattern.replace(/\./g, "\\.").replace(/\*\*/g, ".?").replace(/\*/g, "[^/]*").replace(/\?/g, '*');
	const regex = new RegExp('^' + regexstring + '$', 'g');
	return regex.test(text);
}

function stringify(path) {
	return path.toString().replace(/\\/g, '/');
}

class Project {
	constructor(name) {
		this.name = name;
		this.assets = [];
		this.assetIncludes = [];
		this.sources = [];
		this.defines = [];
	}

	addAssets(asset) {
		this.assetIncludes.push(asset);
	}

	addSources(source) {
		this.sources.push(source);
	}

	addShaders(shaders) {

	}

	addDefine(define) {
		this.defines.push(define);
	}

	addLibrary(library) {

	}

	searchAssets(current) {
		let files = Files.newDirectoryStream(current);
		nextfile: for (let f in files) {
			let file = Paths.get(current, files[f]);
			if (Files.isDirectory(file)) continue;
			//if (!current.isAbsolute())
			file = this.basedir.relativize(file);
			//for (let exclude of this.excludes) {
			//	if (this.matches(this.stringify(file), exclude)) continue nextfile;
			//}
			for (let include of this.assetIncludes) {
				if (isAbsolute(include)) {
					let inc = Paths.get(include);
					inc = this.basedir.relativize(inc);
					include = inc.path;
				}
				let filename = stringify(file);
				if (matches(filename, include)) {
					let slashindex = filename.lastIndexOf('/') + 1;
					if (slashindex < 0) slashindex = 0;

					let pointindex = filename.lastIndexOf('.');
					if (pointindex < 0) pointindex = filename.length - 1;

					let name = filename.substring(slashindex, pointindex);

					let type = 'blob';
					if (filename.endsWith('.png') || filename.endsWith('.jpg') || filename.endsWith('.jpeg')) {
						type = 'image';
					}
					else if (filename.endsWith('.wav')) {
						type = 'sound';
					}
					else if (filename.endsWith('.ttf')) {
						type = 'font';
					}
					else if (filename.endsWith('.mp4')) {
						type = 'video';
					}

					this.assets.push({
						name: name,
						file: stringify(file),
						type: type
					});
				}
			}
		}
		let dirs = Files.newDirectoryStream(current);
		nextdir: for (let d in dirs) {
			var dir = Paths.get(current, dirs[d]);
			if (!Files.isDirectory(dir)) continue;
			//for (let exclude of this.excludes) {
			//	if (this.matchesAllSubdirs(this.basedir.relativize(dir), exclude)) {
			//		continue nextdir;
			//	}
			//}
			this.searchAssets(dir);
		}
	}
}

module.exports = Project;
