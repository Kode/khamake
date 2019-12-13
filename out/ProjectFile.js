"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const Platform_1 = require("./Platform");
const Project_1 = require("./Project");
exports.Callbacks = {
    preAssetConversion: [() => { }],
    preShaderCompilation: [() => { }],
    preHaxeCompilation: [() => { }],
    postHaxeCompilation: [() => { }],
    postHaxeRecompilation: [() => { }],
    postCppCompilation: [() => { }],
    postAssetReexporting: [(filePath) => { }]
};
async function loadProject(from, projectfile, platform) {
    return new Promise((resolve, reject) => {
        fs.readFile(path.join(from, projectfile), 'utf8', (err, data) => {
            if (err) {
                throw new Error('Error reading ' + projectfile + ' from ' + from + '.');
            }
            let resolved = false;
            let callbacks = {
                preAssetConversion: () => { },
                preShaderCompilation: () => { },
                preHaxeCompilation: () => { },
                postHaxeCompilation: () => { },
                postHaxeRecompilation: () => { },
                postCppCompilation: () => { },
                postAssetReexporting: (filePath) => { },
            };
            let resolver = (project) => {
                resolved = true;
                exports.Callbacks.preAssetConversion.push(callbacks.preAssetConversion);
                exports.Callbacks.preShaderCompilation.push(callbacks.preShaderCompilation);
                exports.Callbacks.preHaxeCompilation.push(callbacks.preHaxeCompilation);
                exports.Callbacks.postHaxeCompilation.push(callbacks.postHaxeCompilation);
                exports.Callbacks.postHaxeRecompilation.push(callbacks.postHaxeRecompilation);
                exports.Callbacks.postCppCompilation.push(callbacks.postCppCompilation);
                exports.Callbacks.postAssetReexporting.push(callbacks.postAssetReexporting);
                resolve(project);
            };
            process.on('exit', (code) => {
                if (!resolved) {
                    console.error('Error: khafile.js did not call resolve, no project created.');
                }
            });
            Project_1.Project.platform = platform;
            Project_1.Project.scriptdir = from;
            try {
                let AsyncFunction = Object.getPrototypeOf(async () => { }).constructor;
                new AsyncFunction('Project', 'Platform', 'platform', 'require', '__dirname', 'process', 'resolve', 'reject', 'callbacks', data)(Project_1.Project, Platform_1.Platform, platform, require, path.resolve(from), process, resolver, reject, callbacks);
            }
            catch (error) {
                reject(error);
            }
        });
    });
}
exports.loadProject = loadProject;
//# sourceMappingURL=ProjectFile.js.map