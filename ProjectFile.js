"use strict";

const fs = require('fs');
const Paths = require('./Paths.js');
const Project = require('./Project.js');

module.exports = function (from) {
	let file = fs.readFileSync(from.resolve('khafile.js').toString(), { encoding: 'utf8' });
	Project.scriptdir = from.toString();
	let project = new Function(['Project'], file)(Project);
	project.basedir = Paths.get(from);
	return project;
};
