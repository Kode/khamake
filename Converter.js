"use strict";

const child_process = require('child_process');
const fs = require('fs');
const log = require('./log.js');

exports.convert = function (inFilename, outFilename, encoder, callback, args) {
	if (fs.existsSync(outFilename.toString()) && fs.statSync(outFilename.toString()).mtime.getTime() > fs.statSync(inFilename.toString()).mtime.getTime()) {
		callback(true);
		return;
	}
	
	if (encoder === undefined || encoder === '') {
		callback(false);
		return;
	}
	
	let dirend = Math.max(encoder.lastIndexOf('/'), encoder.lastIndexOf('\\'));
	let firstspace = encoder.indexOf(' ', dirend);
	let exe = encoder.substr(0, firstspace);
	let parts = encoder.substr(firstspace + 1).split(' ');
	let options = [];
	for (let i = 0; i < parts.length; ++i) {
		let foundarg = false;
		if (args !== undefined) {
			for (let arg in args) {
				if (parts[i] === '{' + arg + '}') {
					options.push(args[arg]);
					foundarg = true;
					break;
				}
			}
		}
		if (foundarg) continue;

		if (parts[i] === '{in}') options.push(inFilename.toString());
		else if (parts[i] === '{out}') options.push(outFilename.toString());
		else options.push(parts[i]);
	}
	let child = child_process.spawn(exe, options);

	child.stdout.on('data', function (data) {
		//log.info(encoder + ' stdout: ' + data);
	});
	
	child.stderr.on('data', function (data) {
		log.info(encoder + ' stderr: ' + data);
	});
	
	child.on('error', function (err) {
		log.error(encoder + ' error: ' + err);
		callback(false);
	});
	
	child.on('close', function (code) {
		if (code !== 0) log.error(encoder + ' process exited with code ' + code);
		callback(code === 0);
	});
};
