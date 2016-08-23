"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const fs = require('fs');
const path = require('path');
const Project_1 = require('./Project');
function loadProject(from, projectfile) {
    return __awaiter(this, void 0, Promise, function* () {
        return new Promise((resolve, reject) => {
            fs.readFile(path.join(from, projectfile), { encoding: 'utf8' }, (err, data) => {
                let resolved = false;
                let resolver = (project) => {
                    resolved = true;
                    resolve(project);
                };
                process.on('exit', (code) => {
                    if (!resolved) {
                        console.error('Error: khafile.js did not call resolve, no project created.');
                    }
                });
                Project_1.Project.scriptdir = from;
                try {
                    new Function('Project', 'require', 'resolve', 'reject', data)(Project_1.Project, require, resolver, reject);
                }
                catch (error) {
                    reject(error);
                }
            });
        });
    });
}
exports.loadProject = loadProject;
//# sourceMappingURL=ProjectFile.js.map