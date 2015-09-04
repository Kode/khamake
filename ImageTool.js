"use strict";

const cp = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const Paths = require('./Paths.js');
const Files = require('./Files.js');
const log = require('./log.js');
const exec = require('./exec.js');

function getWidthAndHeight(from, to, asset, format, prealpha, callback) {
	const exe = 'kraffiti' + exec.sys();
	
	let params = ['from=' + from, 'to=' + to, 'format=' + format, 'donothing'];
	if (asset.scale !== undefined && asset.scale !== 1) {
		params.push('scale=' + asset.scale);	
	}
	let stdout = '';
	let child = cp.spawn(path.join(__dirname, '..', '..', 'Kore', 'Tools', 'kraffiti', exe), params);
	
	child.stdout.on('data', (data) => {
		stdout += data.toString();
	});
	
	child.stderr.on('data', (data) => {
		log.error('kraffiti stderr: ' + data);
	});
	
	child.on('error', (err) => {
		log.error('kraffiti error: ' + err);
		callback({w: 0, h: 0});
	});
	
	child.on('close', (code) => {
		if (code !== 0) log.error('kraffiti process exited with code ' + code + ' when trying to get size of ' + asset.name);
		var lines = stdout.split('\n');
		for (var l in lines) {
			var line = lines[l];
			if (line.startsWith('#')) {
				var numbers = line.substring(1).split('x');
				callback({w: parseInt(numbers[0]), h: parseInt(numbers[1])});
				return;
			}
		}
		callback({w: 0, h: 0});
	});
}

module.exports = function (from, to, asset, format, prealpha, callback, poweroftwo) {
	if (format === undefined) {
		if (from.toString().endsWith('.png')) format = 'png';
		else format = 'jpg';
	}

	if (format === 'jpg' && (asset.scale === undefined || asset.scale === 1) && asset.background === undefined) {
		to = to + '.jpg';
	}
	else if (format === 'pvr') {
		to = to + '.pvr';
	}
	else {
		format = 'png';
		to = to + '.png';
	}

	if (fs.existsSync(to) && fs.statSync(to).mtime.getTime() > fs.statSync(from.toString()).mtime.getTime()) {
		getWidthAndHeight(from, to, asset, format, prealpha, (wh) => {
			asset.original_width = wh.w;
			asset.original_height = wh.h;
			if (callback) callback(format);
		});
		return;
	}

	Files.createDirectories(Paths.get(path.dirname(to)));

	if (format === 'jpg') {
		Files.copy(from, Paths.get(to), true);
		getWidthAndHeight(from, to, asset, format, prealpha, (wh) => {
			asset.original_width = wh.w;
			asset.original_height = wh.h;
			if (callback) callback(format);
		});
		return;
	}

	const exe = 'kraffiti' + exec.sys();
	
	let params = ['from=' + from, 'to=' + to, 'format=' + format];
	if (!poweroftwo) {
		params.push('filter=nearest');
	}
	if (prealpha) params.push('prealpha');
	if (asset.scale !== undefined && asset.scale !== 1) {
		params.push('scale=' + asset.scale);	
	}
	if (asset.background !== undefined) {
		params.push('transparent=' + ((asset.background.red << 24) | (asset.background.green << 16) | (asset.background.blue << 8) | 0xff).toString(16));
	}
	if (poweroftwo) {
		params.push('poweroftwo');
	}
	let stdout = '';
	let child = cp.spawn(path.join(__dirname, '..', '..', 'Kore', 'Tools', 'kraffiti', exe), params);
	
	child.stdout.on('data', (data) => {
		stdout += data.toString();
	});
	
	child.stderr.on('data', (data) => {
		log.error('kraffiti stderr: ' + data);
	});
	
	child.on('error', (err) => {
		log.error('kraffiti error: ' + err);
		if (callback) callback(format);
	});
	
	child.on('close', (code) => {
		if (code !== 0) log.error('kraffiti process exited with code ' + code + ' when trying to convert ' + asset.name);
		const lines = stdout.split('\n');
		for (let line of lines) {
			if (line.startsWith('#')) {
				var numbers = line.substring(1).split('x');
				asset.original_width = parseInt(numbers[0]);
				asset.original_height = parseInt(numbers[1]);
				if (callback) callback(format);
				return;
			}
		}
		if (callback) callback(format);
	});
};
