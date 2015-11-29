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
		this.shaderIncludes = [];
		this.shaders = [];
		this.exportedShaders = [];
		this.defines = [];
		this.scriptdir = Project.scriptdir;
		this.libraries = [];
	}

	addAssets(asset) {
		this.assetIncludes.push(asset);
	}

	addSources(source) {
		this.sources.push(source);
	}

	addShaders(shaders) {
		this.shaderIncludes.push(shaders.replaceAll('\\', '/'));
	}

	addDefine(define) {
		this.defines.push(define);
	}

	addLibrary(library) {
		this.libraries.push('Libraries/' + library);
		this.sources.push('Libraries/' + library + '/Sources');
		this.shaderIncludes.push('Libraries/' + library + '/Sources/Shaders/**');

		/*
				if (process.env.HAXEPATH) {
					var libpath = pathlib.join(process.env.HAXEPATH, 'lib', libname.toLowerCase());
					if (fs.existsSync(libpath) && fs.statSync(libpath).isDirectory()) {
						let current;
						let libdeeppath;
						if (fs.existsSync(pathlib.join(libpath, '.current'))) {
							current = fs.readFileSync(pathlib.join(libpath, '.current'), {encoding: 'utf8'});
							libdeeppath = pathlib.join(libpath, current.replaceAll('.', ','));
						}
						else if (fs.existsSync(pathlib.join(libpath, '.dev'))) {
							current = fs.readFileSync(pathlib.join(libpath, '.dev'), {encoding: 'utf8'});
							libdeeppath = current;
						}
						if (fs.existsSync(libdeeppath) && fs.statSync(libdeeppath).isDirectory()) {
							let lib = {
								directory: libdeeppath,
								project: {
									assets: [],
									rooms: []
								}
							};
							if (Files.exists(from.resolve(Paths.get(libdeeppath, 'project.kha')))) {
								lib.project = JSON.parse(fs.readFileSync(from.resolve(libdeeppath, 'project.kha').toString(), { encoding: 'utf8' }));
							}
							libraries.push(lib);
							found = true;
						}
					}
				}

				for (let lib of libraries) {
					for (let asset of lib.project.assets) {
						asset.libdir = lib.directory;
						project.assets.push(asset);
					}
					for (let room of lib.project.rooms) {
						project.rooms.push(room);
					}

					if (Files.isDirectory(from.resolve(Paths.get(lib.directory, 'Sources')))) {
						sources.push(lib.directory + '/Sources');
					}
					if (lib.project.sources !== undefined) {
						for (let i = 0; i < project.sources.length; ++i) {
							sources.push(lib.directory + '/' + project.sources[i]);
						}
					}
				}
		*/
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

					if (!name.startsWith('.')) {
						this.assets.push({
							name: name,
							file: stringify(file),
							type: type
						});
					}
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

	searchShaders(current) {
		let files = Files.newDirectoryStream(current);
		nextfile: for (let f in files) {
			let file = Paths.get(current, files[f]);
			if (Files.isDirectory(file)) continue;
			//if (!current.isAbsolute())
			file = this.basedir.relativize(file);
			//for (let exclude of this.excludes) {
			//	if (this.matches(this.stringify(file), exclude)) continue nextfile;
			//}
			for (let include of this.shaderIncludes) {
				if (isAbsolute(include)) {
					let inc = Paths.get(include);
					inc = this.basedir.relativize(inc);
					include = inc.path.replaceAll('\\', '/');
				}
				let filename = stringify(file);
				if (matches(filename, include)) {
					let slashindex = filename.lastIndexOf('/') + 1;
					if (slashindex < 0) slashindex = 0;

					let pointindex = filename.lastIndexOf('.');
					if (pointindex < 0) pointindex = filename.length - 1;

					let name = filename.substring(slashindex, pointindex);

					if (!name.startsWith('.') && filename.endsWith('.glsl')) {
						this.shaders.push({
							name: name,
							files: [stringify(file)]
						})
					}
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
			this.searchShaders(dir);
		}
	}
}

module.exports = Project;
