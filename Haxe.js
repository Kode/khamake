var child_process = require('child_process');
var fs = require('fs');
var path = require('path');
var log = require('./log.js');
var exec = require('./exec.js');

exports.executeHaxe = function (from, haxeDirectory, options, callback) {
	var exe = 'haxe';
	var env = process.env;
	if (fs.existsSync(haxeDirectory.toString()) && fs.statSync(haxeDirectory.toString()).isDirectory()) {
		var localexe = haxeDirectory.resolve('haxe' + exec.sys()).toAbsolutePath().toString();
		if (!fs.existsSync(localexe)) localexe = haxeDirectory.resolve('haxe').toAbsolutePath().toString();
		if (fs.existsSync(localexe)) exe = localexe;
		env.HAXE_STD_PATH = haxeDirectory.toAbsolutePath().resolve('std').toString();
	}
	var haxe = child_process.spawn(exe, options, { env: env, cwd: path.normalize(from.toString()) });

	haxe.stdout.on('data', function (data) {
		log.info('Haxe stdout: ' + data);
	});

	haxe.stderr.on('data', function (data) {
		log.error('Haxe stderr: ' + data);
	});
	
	haxe.on('error', function (err) {
		log.error('Haxe error: ' + err);
	});

	haxe.on('close', function (code) {
		if (code !== 0) log.error('Haxe process exited with code ' + code);
		callback();
	});
};
