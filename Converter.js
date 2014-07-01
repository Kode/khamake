var child_process = require('child_process');

exports.convert = function (inFilename, outFilename, encoder) {
	if (encoder === '') return;
	var parts = encoder.split(' ');
	var options = [];
	for (var i = 1; i < parts.length; ++i) {
		if (parts[i] === '{in}') options.push(inFilename.toString());
		else if (parts[i] === '{out}') options.push(outFilename.toString());
		else options.push(parts[i]);
	}
	child_process.spawn(parts[0], options);
};
