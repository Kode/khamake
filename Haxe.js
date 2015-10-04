"use strict";

const child_process = require('child_process');
const fs = require('fs');
const path = require('path');
const log = require('./log.js');
const exec = require('./exec.js');

exports.executeHaxe = function (from, haxeDirectory, options, callback) {
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
	let haxe = child_process.spawn(exe, options, { env: env, cwd: path.normalize(from.toString()) });

	haxe.stdout.on('data', (data) => {
		log.info('Haxe stdout: ' + data);
	});

	haxe.stderr.on('data', (data) => {
		log.error('Haxe stderr: ' + data);
	});
	
	haxe.on('error', (err) => {
		log.error('Haxe error: ' + err);
	});

	haxe.on('close', (code) => {
		if (code !== 0) log.error('Haxe process exited with code ' + code);
		callback();
	});
};
