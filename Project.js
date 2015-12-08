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
	
	/*if (match.indexOf('*') < 0) {
		this.shaders.push(path.relative(match, 'whatever'));
	}
	let beforeStar = match.substring(0, match.indexOf('*'));
	let startDir = beforeStar.substring(0, beforeStar.lastIndexOf('/'));
	this.searchShaders(path.relative(startDir, 'whatever'), match);*/
		
	let regex = new RegExp('^' + match.replace(/\./g, "\\.").replace(/\*\*/g, ".?").replace(/\*/g, "[^/]*").replace(/\?/g, '*') + '$', 'g');
	
	let collected = [];
	findFiles2(dir, '.', regex, collected);
	return collected;
}

function findFiles2(basedir, dir, regex, collected) {
	let dirpath = path.resolve(basedir, dir);
	let files = fs.readdirSync(dirpath);
	nextfile: for (let f of files) {
		let file = path.resolve(dirpath, f);
		if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) continue;
		//for (let exclude of this.excludes) {
		//	if (this.matches(this.stringify(file), exclude)) continue nextfile;
		//}
		let filename = path.resolve(dir, f).replace(/\\/g, '/');
		if (regex.test(filename)) {
			collected.push(file);
		}
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
		for (let file of files) {
			let slashindex = file.lastIndexOf('/') + 1;
			if (slashindex <= 0) slashindex = 0;

			let pointindex = file.lastIndexOf('.');
			if (pointindex < 0) pointindex = file.length - 1;

			let name = file.substring(slashindex, pointindex);

			let type = 'blob';
			if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')) {
				type = 'image';
			}
			else if (file.endsWith('.wav')) {
				type = 'sound';
			}
			else if (file.endsWith('.ttf')) {
				type = 'font';
			}
			else if (file.endsWith('.mp4')) {
				type = 'video';
			}

			if (!name.startsWith('.') && name.length > 0) {
				this.assets.push({
					name: name,
					file: file,
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
			let slashindex = shader.lastIndexOf('/') + 1;
			if (slashindex <= 0) slashindex = 0;

			let pointindex = shader.lastIndexOf('.');
			if (pointindex < 0) pointindex = shader.length - 1;

			let name = shader.substring(slashindex, pointindex);

			if (!name.startsWith('.') && shader.endsWith('.glsl')) {
				this.shaders.push({
					name: name,
					files: [shader]
				})
			}
		}
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
}

module.exports = Project;
