var child_process = require('child_process');
var log = require('./log.js');

exports.convert = function (inFilename, outFilename, encoder) {
	if (encoder === '') return;
	var parts = encoder.split(' ');
	var options = [];
	for (var i = 1; i < parts.length; ++i) {
		if (parts[i] === '{in}') options.push(inFilename.toString());
		else if (parts[i] === '{out}') options.push(outFilename.toString());
		else options.push(parts[i]);
	}
	var child = child_process.spawn(parts[0], options);

	child.stdout.on('data', function (data) {
		log.info(encoder + ' stdout: ' + data);
	});
	
	child.stderr.on('data', function (data) {
		log.info(encoder + ' stderr: ' + data);
	});
	
	child.on('error', function (err) {
		log.error(encoder + ' error: ' + err);
	});
	
	child.on('close', function (code) {
		if (code !== 0) log.error(encoder + ' process exited with code ' + code);
	});
};
