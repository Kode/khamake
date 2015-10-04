"use strict";

const fs = require('fs');

module.exports = function (from) {
	let project = JSON.parse(fs.readFileSync(from.resolve('project.kha').toString(), { encoding: 'utf8' }));

	if (project.assets === undefined) {
		project.assets = [];
	}

	if (project.rooms === undefined) {
		project.rooms = [];
	}
	
	if (project.format < 2) {
		let assets = {};
		for (let asset of project.assets) {
			assets[asset.id] = asset;
			delete asset.id;
		}
		var rooms = {};
		for (let room of project.rooms) {
			rooms[room.id] = room;
			delete room.id;
			for (var a in room.assets) {
				room.assets[a] = assets[room.assets[a]].name;
			}
		}
		for (let room of project.rooms) {
			if (room.parent) {
				room.parent = rooms[room.parent].name;
			}
			else {
				room.parent = null;
			}
			for (var n in room.neighbours) {
				room.neighbours[n] = rooms[room.neighbours[n]].name;
			}
		}
		project.format = 2;
		fs.writeFileSync(from.resolve('project.kha').toString(), JSON.stringify(project, null, '\t'), { encoding: 'utf8' });
	}

	if (project.format < 3) {
		for (let asset of project.assets) {
			if (asset.type === 'music' || asset.type === 'sound') {
				asset.file += '.wav';
			}
		}
		project.format = 3;
		fs.writeFileSync(from.resolve('project.kha').toString(), JSON.stringify(project, null, '\t'), { encoding: 'utf8' });
	}

	for (let asset1 of project.assets) {
		for (let asset2 of project.assets) {
			if (asset1 !== asset2) {
				if (asset1.name === asset2.name && asset1.type === asset2.type) {
					console.log('Warning: More than one asset of type ' + asset1.type + ' is called ' + asset1.name + '.');
				}
			}
		}
	}

	return project;
};
