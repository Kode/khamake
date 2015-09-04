"use strict";

const path = require('path');
const Html5Exporter = require('./Html5Exporter.js');
const Converter = require('./Converter.js');
const Files = require('./Files.js');
const Haxe = require('./Haxe.js');
const Options = require('./Options.js');
const Paths = require('./Paths.js');
const exportImage = require('./ImageTool.js');
const fs = require('fs');

class NodeExporter extends Html5Exporter {
	constructor(khaDirectory, directory) {
		super(khaDirectory, directory);
		this.removeSourceDirectory(path.join(khaDirectory.toString(), 'Backends/HTML5'));
		this.addSourceDirectory(path.join(khaDirectory.toString(), 'Backends/Node'));
	}

	sysdir() {
		return 'node';
	}
}

module.exports = NodeExporter;
