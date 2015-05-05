var child_process = require('child_process');
var os = require('os');
var path = require('path');
var log = require('./log.js');
var exec = require('./exec.js');

exports.executeHaxe = function (from, haxeDirectory, options, callback) {
	var exe = haxeDirectory.resolve('haxe' + exec.sys()).toAbsolutePath();
	var env = process.env;
	env.HAXE_STD_PATH = haxeDirectory.toAbsolutePath().resolve('std').toString();
	var haxe = child_process.spawn(exe.toString(), options, { env: env, cwd: path.resolve(from.toString(), 'build') });

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
