var path = require('path');
var Html5Exporter = require('./Html5Exporter.js');
var korepath = require('./korepath.js');
var Converter = require('./Converter.js');
var Files = require(path.join(korepath.get(), 'Files.js'));
var Haxe = require('./Haxe.js');
var Options = require('./Options.js');
var Paths = require(path.join(korepath.get(), 'Paths.js'));
var exportImage = require('./ImageTool.js');
var fs = require('fs');

function Html5WorkerExporter(khaDirectory, directory) {
	Html5Exporter.call(this, khaDirectory);
	this.directory = directory;
	this.sources.pop();
	this.addSourceDirectory(path.join(khaDirectory.toString(), 'Backends/HTML5-Worker'));
};

Html5WorkerExporter.prototype = Object.create(Html5Exporter.prototype);
Html5WorkerExporter.constructor = Html5WorkerExporter;

Html5WorkerExporter.prototype.sysdir = function () {
	return 'html5-worker';
};

module.exports = Html5WorkerExporter;
