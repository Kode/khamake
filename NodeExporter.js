var Html5Exporter = require('./Html5Exporter.js');
var korepath = require('./korepath.js');
var Converter = require('./Converter.js');
var Files = require(korepath + 'Files.js');
var Haxe = require('./Haxe.js');
var Options = require('./Options.js');
var Paths = require(korepath + 'Paths.js');
var exportImage = require('./ImageTool.js');
var fs = require('fs');
var path = require('path');

function NodeExporter(directory) {
	Html5Exporter.call(this);
	this.directory = directory;
	this.removeSourceDirectory("Kha/Backends/HTML5");
	this.addSourceDirectory("Kha/Backends/Node");
};

NodeExporter.prototype = Object.create(Html5Exporter.prototype);
NodeExporter.constructor = NodeExporter;

NodeExporter.prototype.sysdir = function () {
	return 'node';
};

module.exports = NodeExporter;
