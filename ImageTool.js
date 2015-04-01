var cp = require('child_process');
var fs = require('fs');
var os = require('os');
var path = require('path');
var korepath = require('./korepath.js')
var Paths = require(korepath + 'Paths.js');
var Files = require(korepath + 'Files.js');
var log = require('./log.js');

module.exports = function (from, to, asset, format, prealpha, callback) {
	if (fs.existsSync(to.toString()) && fs.statSync(to.toString()).mtime.getTime() > fs.statSync(from.toString()).mtime.getTime()) {
		callback();
		return;
	}

	Files.createDirectories(Paths.get(path.dirname(to)));

	if (format === undefined) {
		if (to.toString().endsWith('.png')) format = 'png';
		else format = 'jpg';
	}

	if (format === 'jpg' && (asset.scale === undefined || asset.scale === 1) && asset.background === undefined) {
		Files.copy(from, to, true);
		callback();
		return;
	}

	var exe = "kraffiti-osx";
	if (os.platform() === "linux") {
		exe = "kraffiti-linux";
	}
	else if (os.platform() === "win32") {
		exe = "kraffiti.exe";
	}
	
	var params = ['from=' + from, 'to=' + to, 'format=' + format, 'filter=nearest'];
	if (prealpha) params.push('prealpha');
	if (asset.scale !== undefined && asset.scale !== 1) {
		params.push('scale=' + asset.scale);	
	}
	if (asset.background !== undefined) {
		params.push('transparent=' + ((asset.background.red << 24) | (asset.background.green << 16) | (asset.background.blue << 8) | 0xff).toString(16));
	}
	var child = cp.spawn(path.join(__dirname, '..', '..', 'Kore', 'Tools', 'kraffiti', exe), params);
	
	child.stdout.on('data', function (data) {
		log.info('kraffiti stdout: ' + data);
	});
	
	child.stderr.on('data', function (data) {
		log.error('kraffiti stderr: ' + data);
	});
	
	child.on('error', function (err) {
		log.error('kraffiti error: ' + err);
		callback();
	});
	
	child.on('close', function (code) {
		if (code !== 0) log.error('kraffiti process exited with code ' + code + ' when trying to convert ' + asset.name);
		callback();
	});
};
