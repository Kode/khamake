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

class DebugHtml5Exporter extends Html5Exporter {
	constructor(khaDirectory, directory) {
		super(khaDirectory, directory);
	}

	sysdir() {
		return 'debug-html5';
	}
}

module.exports = DebugHtml5Exporter;
