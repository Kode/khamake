var fs = require('fs');

module.exports = function (from) {
	var project = JSON.parse(fs.readFileSync(from.resolve('project.kha').toString(), { encoding: 'utf8' }));
	
	if (project.format < 2) {
		var assets = {};
		for (var a in project.assets) {
			var asset = project.assets[a];
			assets[asset.id] = asset;
			delete asset.id;
		}
		var rooms = {};
		for (var r in project.rooms) {
			var room = project.rooms[r];
			rooms[room.id] = room;
			delete room.id;
			for (var a in room.assets) {
				room.assets[a] = assets[room.assets[a]].name;
			}
		}
		for (var r in project.rooms) {
			var room = project.rooms[r];
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
		for (var a in project.assets) {
			var asset = project.assets[a];
			if (asset.type === 'music' || asset.type === 'sound') {
				asset.file += '.wav';
			}
		}
		project.format = 3;
		fs.writeFileSync(from.resolve('project.kha').toString(), JSON.stringify(project, null, '\t'), { encoding: 'utf8' });
	}

	return project;
};
