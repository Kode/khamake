var child_process = require('child_process');
var path = require('path');

exports.executeHaxe = function (haxeDirectory, options) {
//#ifdef SYS_WINDOWS
	var exe = haxeDirectory.resolve('haxe.exe').toAbsolutePath();
//#elif defined SYS_OSX
//	Path exe = haxeDirectory.resolve("haxe-osx").toAbsolutePath();
//#elif defined SYS_LINUX
//	Path exe = haxeDirectory.resolve("haxe-linux").toAbsolutePath();
//#endif
	var env = process.env;
	env.HAXE_STD_PATH = '../' + haxeDirectory.resolve('std').toString();
	var haxe = child_process.spawn(exe.toString(), options, { env: env, cwd: path.resolve(process.cwd(), 'build') });

	haxe.stdout.on('data', function (data) {
		console.log('stdout: ' + data);
	});

	haxe.stderr.on('data', function (data) {
		console.log('stderr: ' + data);
	});

	haxe.on('close', function (code) {
		console.log('child process exited with code ' + code);
	});
};
