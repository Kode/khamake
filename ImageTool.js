var cp = require('child_process');
var fs = require('fs');
var os = require('os');
var path = require('path');
var korepath = require('./korepath.js')
var Paths = require(path.join(korepath.get(), 'Paths.js'));
var Files = require(path.join(korepath.get(), 'Files.js'));
var log = require('./log.js');
var exec = require('./exec.js');

function getWidthAndHeight(from, to, asset, format, prealpha, callback) {
	var exe = 'kraffiti' + exec.sys();
	
	var params = ['from=' + from, 'to=' + to, 'format=' + format, 'donothing'];
	if (asset.scale !== undefined && asset.scale !== 1) {
		params.push('scale=' + asset.scale);	
	}
	var stdout = '';
	var child = cp.spawn(path.join(__dirname, '..', '..', 'Kore', 'Tools', 'kraffiti', exe), params);
	
	child.stdout.on('data', function (data) {
		stdout += data.toString();
	});
	
	child.stderr.on('data', function (data) {
		log.error('kraffiti stderr: ' + data);
	});
	
	child.on('error', function (err) {
		log.error('kraffiti error: ' + err);
		callback({w: 0, h: 0});
	});
	
	child.on('close', function (code) {
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
	if (fs.existsSync(to.toString()) && fs.statSync(to.toString()).mtime.getTime() > fs.statSync(from.toString()).mtime.getTime()) {
		getWidthAndHeight(from, to, asset, format, prealpha, function (wh) {
			asset.original_width = wh.w;
			asset.original_height = wh.h;
			if (callback) callback();
		});
		return;
	}

	Files.createDirectories(Paths.get(path.dirname(to)));

	if (format === undefined) {
		if (to.toString().endsWith('.png')) format = 'png';
		else format = 'jpg';
	}

	if (format === 'jpg' && (asset.scale === undefined || asset.scale === 1) && asset.background === undefined) {
		Files.copy(from, to, true);
		getWidthAndHeight(from, to, asset, format, prealpha, function (wh) {
			asset.original_width = wh.w;
			asset.original_height = wh.h;
			if (callback) callback();
		});
		return;
	}

	var exe = 'kraffiti' + exec.sys();
	
	var params = ['from=' + from, 'to=' + to, 'format=' + format];
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
	var stdout = '';
	var child = cp.spawn(path.join(__dirname, '..', '..', 'Kore', 'Tools', 'kraffiti', exe), params);
	
	child.stdout.on('data', function (data) {
		stdout += data.toString();
	});
	
	child.stderr.on('data', function (data) {
		log.error('kraffiti stderr: ' + data);
	});
	
	child.on('error', function (err) {
		log.error('kraffiti error: ' + err);
		if (callback) callback();
	});
	
	child.on('close', function (code) {
		if (code !== 0) log.error('kraffiti process exited with code ' + code + ' when trying to convert ' + asset.name);
		var lines = stdout.split('\n');
		for (var l in lines) {
			var line = lines[l];
			if (line.startsWith('#')) {
				var numbers = line.substring(1).split('x');
				asset.original_width = parseInt(numbers[0]);
				asset.original_height = parseInt(numbers[1]);
				if (callback) callback();
				return;
			}
		}
		if (callback) callback();
	});
};
