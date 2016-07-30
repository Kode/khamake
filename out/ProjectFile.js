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
                Project_1.Project.scriptdir = from;
                new Function('Project', 'require', 'resolve', 'reject', data)(Project_1.Project, require, resolve, reject);
            });
        });
    });
}
exports.loadProject = loadProject;
//# sourceMappingURL=ProjectFile.js.map