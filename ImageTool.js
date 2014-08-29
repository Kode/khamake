var cp = require('child_process');
var os = require('os');
var path = require('path');

module.exports = function (from, to, asset) {
	var exe = "kraffiti-osx";
	if (os.platform() === "linux") {
		exe = "kraffiti-linux";
	}
	else if (os.platform() === "win32") {
		exe = "kraffiti.exe";
	}
	
	var child = cp.spawn(path.join(__dirname, '..', '..', 'Kore', 'Tools', 'kraffiti', exe), ['from=' + from, 'to=' + to, 'format=png']);
	
	child.stdout.on('data', function (data) {
		console.log('kraffiti stdout: ' + data);
	});
	
	child.stderr.on('data', function (data) {
		console.log('kraffiti stderr: ' + data);
	});
	
	child.on('error', function (err) {
		console.log('kraffiti error: ' + err);
	});
	
	child.on('close', function (code) {
		if (code !== 0) console.log('kraffiti process exited with code ' + code);
	});
};
