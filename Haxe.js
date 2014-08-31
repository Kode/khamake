var child_process = require('child_process');
var os = require('os');
var path = require('path');

exports.executeHaxe = function (haxeDirectory, options, callback) {
	if (os.platform() === "linux") {
		var exe = haxeDirectory.resolve('haxe-linux').toAbsolutePath();
	}
	else if (os.platform() === "win32") {
		var exe = haxeDirectory.resolve('haxe.exe').toAbsolutePath();
	}
	else {
		var exe = haxeDirectory.resolve('haxe-osx').toAbsolutePath();
	}

	var env = process.env;
	env.HAXE_STD_PATH = '../' + haxeDirectory.resolve('std').toString();
	var haxe = child_process.spawn(exe.toString(), options, { env: env, cwd: path.resolve(process.cwd(), 'build') });

	haxe.stdout.on('data', function (data) {
		console.log('Haxe stdout: ' + data);
	});

	haxe.stderr.on('data', function (data) {
		console.log('Haxe stderr: ' + data);
	});

	haxe.on('close', function (code) {
		if (code !== 0) console.log('Haxe process exited with code ' + code);
		callback();
	});
};
