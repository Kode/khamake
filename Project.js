"use strict";

const fs = require('fs');
const path = require('path');
const Files = require('./Files.js');
const Paths = require('./Paths.js');

function findFiles(dir, match) {
	if (path.isAbsolute(match)) {
		match = path.relative(dir, match);
	}
	match = match.replace(/\\/g, '/');
	
	let subdir = '.'
	if (match.indexOf('*') >= 0) {
		let beforeStar = match.substring(0, match.indexOf('*'));
		subdir = beforeStar.substring(0, beforeStar.lastIndexOf('/'));
	}
		
	let regex = new RegExp('^' + match.replace(/\./g, "\\.").replace(/\*\*/g, ".?").replace(/\*/g, "[^/]*").replace(/\?/g, '*') + '$', 'g');
	
	let collected = [];
	findFiles2(dir, subdir, regex, collected);
	return collected;
}

function findFiles2(basedir, dir, regex, collected) {
	let dirpath = path.resolve(basedir, dir);
	if (!fs.existsSync(dirpath) || !fs.statSync(dirpath).isDirectory()) return;
	let files = fs.readdirSync(dirpath);
	nextfile: for (let f of files) {
		let file = path.resolve(dirpath, f);
		if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) continue;
		//for (let exclude of this.excludes) {
		//	if (this.matches(this.stringify(file), exclude)) continue nextfile;
		//}
		let filename = path.relative(basedir, file).replace(/\\/g, '/');
		if (regex.test(filename)) {
			collected.push(file.replace(/\\/g, '/'));
		}
		regex.lastIndex = 0;
	}
	nextdir: for (let f of files) {
		let file = path.resolve(dirpath, f);
		if (!fs.existsSync(file) || !fs.statSync(file).isDirectory()) continue;
		//for (let exclude of this.excludes) {
		//	if (this.matchesAllSubdirs(this.basedir.relativize(dir), exclude)) {
		//		continue nextdir;
		//	}
		//}
		findFiles2(basedir, file, regex, collected);
	}
}

class Project {
	constructor(name) {
		this.name = name;
		this.assets = [];
		this.sources = [];
		this.shaders = [];
		this.exportedShaders = [];
		this.defines = [];
		this.scriptdir = Project.scriptdir;
		this.libraries = [];
	}

	/**
	 * Add all assets matching the match regex relative to the directory containing the current khafile.
	 * Asset types are infered from the file suffix.
	 * The regex syntax is very simple: * for anything, ** for anything across directories.
	 */
	addAssets(match) {
		let files = findFiles(this.scriptdir, match);
		for (let f of files) {
			let file = path.parse(f);
			let name = file.name;
			let type = 'blob';
			if (file.ext === '.png' || file.ext === '.jpg' || file.ext === '.jpeg') {
				type = 'image';
			}
			else if (file.ext === '.wav') {
				type = 'sound';
			}
			else if (file.ext === '.ttf') {
				type = 'font';
			}
			else if (file.ext === '.mp4' || file.ext === '.webm' || file.ext === '.wmv' || file.ext === '.avi') {
				type = 'video';
			}
			else {
				name = file.base;
			}

			if (!file.name.startsWith('.') && file.name.length > 0) {
				this.assets.push({
					name: name,
					file: f,
					type: type
				});
			}
		}
	}

	addSources(source) {
		this.sources.push(source);
	}

	/**
	 * Add all shaders matching the match regex relative to the directory containing the current khafile.
	 * The regex syntax is very simple: * for anything, ** for anything across directories.
	 */
	addShaders(match) {
		let shaders = findFiles(this.scriptdir, match);
		for (let shader of shaders) {
			let file = path.parse(shader);
			if (!file.name.startsWith('.') && file.ext === '.glsl') {
				this.shaders.push({
					name: file.name,
					files: [shader]
				});
			}
		}
	}

	addDefine(define) {
		this.defines.push(define);
	}

	addLibrary(library) {
		this.libraries.push('Libraries/' + library);
		this.sources.push('Libraries/' + library + '/Sources');
		this.addShaders('Libraries/' + library + '/Sources/Shaders/**');

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
}

module.exports = Project;
