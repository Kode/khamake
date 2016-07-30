"use strict";
const fs = require('fs');
const path = require('path');
function run(name, from, projectfile) {
    if (!fs.existsSync(path.join(from, projectfile))) {
        fs.writeFileSync(path.join(from, projectfile), "var project = new Project('New Project');\n"
            + "project.addAssets('Assets/**');\n"
            + "project.addSources('Sources');\n"
            + "return project;\n", { encoding: 'utf8' });
    }
    if (!fs.existsSync(path.join(from, 'Assets')))
        fs.mkdirSync(path.join(from, 'Assets'));
    if (!fs.existsSync(path.join(from, 'Sources')))
        fs.mkdirSync(path.join(from, 'Sources'));
    var friendlyName = name;
    friendlyName = friendlyName.replace(/ /g, '_');
    friendlyName = friendlyName.replace(/-/g, '_');
    if (!fs.existsSync(path.join(from, 'Sources', 'Main.hx'))) {
        var mainsource = 'package;\n\nimport kha.System;\n\n'
            + 'class Main {\n'
            + '\tpublic static function main() {\n'
            + '\t\tSystem.init({title: "' + name + '", width: 1024, height: 768}, function () {\n'
            + '\t\t\tnew ' + friendlyName + '();\n'
            + '\t\t});\n'
            + '\t}\n'
            + '}\n';
        fs.writeFileSync(path.join(from, 'Sources', 'Main.hx'), mainsource, { encoding: 'utf8' });
    }
    if (!fs.existsSync(path.join(from, 'Sources', friendlyName + '.hx'))) {
        var projectsource = 'package;\n\nimport kha.Framebuffer;\nimport kha.Scheduler;\nimport kha.System;\n\n'
            + 'class ' + friendlyName + ' {\n'
            + '\tpublic function new() {\n'
            + '\t\tSystem.notifyOnRender(render);\n'
            + '\t\tScheduler.addTimeTask(update, 0, 1 / 60);\n'
            + '\t}\n'
            + '\n'
            + '\tfunction update(): Void {\n'
            + '\t\t\n'
            + '\t}\n'
            + '\n'
            + '\tfunction render(framebuffer: Framebuffer): Void {'
            + '\t\t\n'
            + '\t}\n'
            + '}\n';
        fs.writeFileSync(path.join(from, 'Sources', friendlyName + '.hx'), projectsource, { encoding: 'utf8' });
    }
}
exports.run = run;
//# sourceMappingURL=init.js.map