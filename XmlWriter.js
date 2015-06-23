var fs = require('fs-extra');

function printElement(elem, data, indents) {
	for (var i = 0; i < indents; ++i) data += '\t';

	if (typeof elem === 'string') {
		data += '<!-- ' + elem + ' -->\n';
		return data;
	}

	data += '<' + elem.n;
	for (var a in elem) {
		if (a === 'n') continue;
		if (a === 'e') continue;
		data += ' ' + a + '="' + elem[a] + '"';
	}

	if (elem.e === undefined || elem.e.length === 0) {
		data += ' />\n';
	}
	else {
		data += '>\n';
		for (var e in elem.e) {
			data = printElement(elem.e[e], data, indents + 1);
		}
		for (var i = 0; i < indents; ++i) data += '\t';
		data += '</' + elem.n + '>\n';
	}

	return data;
}

module.exports = function (xml, path) {
	var data = '';
	data += '<?xml version="1.0" encoding="utf-8"?>\n';
	data += '<' + xml.n;
	for (var a in xml) {
		if (a === 'n') continue;
		if (a === 'e') continue;
		data += ' ' + a + '="' + xml[a] + '"';
	}
	data += '>\n';
	for (var e in xml.e) {
		data = printElement(xml.e[e], data, 1);
	}
	data += '</' + xml.n + '>\n';
	fs.outputFileSync(path, data);
};
