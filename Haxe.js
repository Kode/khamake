"use strict";

const child_process = require('child_process');
const fs = require('fs');
const path = require('path');
const log = require('./log.js');
const exec = require('./exec.js');

exports.executeHaxe = function (from, haxeDirectory, options) {
	let exe = 'haxe';
	let env = process.env;
	if (fs.existsSync(haxeDirectory.toString()) && fs.statSync(haxeDirectory.toString()).isDirectory()) {
		let localexe = haxeDirectory.resolve('haxe' + exec.sys()).toAbsolutePath().toString();
		if (!fs.existsSync(localexe)) localexe = haxeDirectory.resolve('haxe').toAbsolutePath().toString();
		if (fs.existsSync(localexe)) exe = localexe;
		const stddir = haxeDirectory.toAbsolutePath().resolve('std').toString();
		if (fs.existsSync(stddir) && fs.statSync(stddir).isDirectory()) {
			env.HAXE_STD_PATH = stddir;
		}
	}
	let result = child_process.spawnSync(exe, options, { env: env, cwd: path.normalize(from.toString()) });

	if (result.stdout && result.stdout.toString() !== '') {
		log.info(result.stdout.toString());
	}

	if (result.stderr && result.stderr.toString() !== '') {
		log.error(result.stderr.toString());
	}
	
	if (result.error) {
		log.error('Haxe.js ' + from + ' error (' + options + '): ' + result.error);
	}

	return result.status === 0;
};
