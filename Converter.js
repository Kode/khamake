"use strict";

const child_process = require('child_process');
const fs = require('fs');
const log = require('./log.js');

exports.convert = function (inFilename, outFilename, encoder, args) {
	if (fs.existsSync(outFilename.toString()) && fs.statSync(outFilename.toString()).mtime.getTime() > fs.statSync(inFilename.toString()).mtime.getTime()) {
		return true;
	}
	
	if (encoder === undefined || encoder === '') {
		return false;
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

	return child_process.spawnSync(exe, options).status === 0;
};
