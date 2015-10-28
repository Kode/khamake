"use strict";

const fs = require('fs');
const Paths = require('./Paths.js');
const Project = require('./Project.js');

module.exports = function (from) {
	let file = fs.readFileSync(from.resolve('khafile.js').toString(), { encoding: 'utf8' });
	let project = new Function(['Project'], file)(Project);
	project.basedir = Paths.get(from);
	project.searchAssets(Paths.get(from));
	return project;
};
