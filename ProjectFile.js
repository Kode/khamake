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
		for (var r in project.rooms) {
			var room = project.rooms[r];
			delete room.id;
			for (var a in room.assets) {
				room.assets[a] = assets[room.assets[a]].name;
			}
		}
		project.format = 2;
	}
	fs.writeFileSync(from.resolve('project.kha').toString(), JSON.stringify(project, null, '\t'), { encoding: 'utf8' });
	return project;
};
