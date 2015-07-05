var child_process = require('child_process');
var fs = require('fs');
var log = require('./log.js');

exports.convert = function (inFilename, outFilename, encoder, callback, args) {
	if (fs.existsSync(outFilename.toString()) && fs.statSync(outFilename.toString()).mtime.getTime() > fs.statSync(inFilename.toString()).mtime.getTime()) {
		callback();
		return;
	}
	
	if (encoder === undefined || encoder === '') {
		callback();
		return;
	}
	var parts = encoder.split(' ');
	var options = [];
	for (var i = 1; i < parts.length; ++i) {
		var foundarg = false;
		if (args !== undefined) {
			for (var arg in args) {
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
	var child = child_process.spawn(parts[0], options);

	child.stdout.on('data', function (data) {
		//log.info(encoder + ' stdout: ' + data);
	});
	
	child.stderr.on('data', function (data) {
		log.info(encoder + ' stderr: ' + data);
	});
	
	child.on('error', function (err) {
		log.error(encoder + ' error: ' + err);
		callback();
	});
	
	child.on('close', function (code) {
		if (code !== 0) log.error(encoder + ' process exited with code ' + code);
		callback();
	});
};
