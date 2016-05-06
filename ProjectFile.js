"use strict";
const fs = require('fs');
const path = require('path');
const Project_1 = require('./Project');
function loadProject(from, projectfile) {
    let file = fs.readFileSync(path.join(from, projectfile), { encoding: 'utf8' });
    Project_1.Project.scriptdir = from.toString();
    let project = new Function('Project', file)(Project_1.Project);
    return project;
}
exports.loadProject = loadProject;
//# sourceMappingURL=ProjectFile.js.map