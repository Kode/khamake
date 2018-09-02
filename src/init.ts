import * as fs from 'fs';
import * as path from 'path';

export function run(name: string, from: string, projectfile: string) {
	if (!fs.existsSync(path.join(from, projectfile))) {
		fs.writeFileSync(path.join(from, projectfile),
			'let project = new Project(\'New Project\');\n'
			+ 'project.addAssets(\'Assets/**\');\n'
			+ 'project.addShaders(\'Shaders/**\');\n'
			+ 'project.addSources(\'Sources\');\n'
			+ 'resolve(project);\n',
		{ encoding: 'utf8' });
	}

	if (!fs.existsSync(path.join(from, 'Assets'))) fs.mkdirSync(path.join(from, 'Assets'));
	if (!fs.existsSync(path.join(from, 'Shaders'))) fs.mkdirSync(path.join(from, 'Shaders'));
	if (!fs.existsSync(path.join(from, 'Sources'))) fs.mkdirSync(path.join(from, 'Sources'));

	let friendlyName = name;
	friendlyName = friendlyName.replace(/ /g, '_');
	friendlyName = friendlyName.replace(/-/g, '_');

	if (!fs.existsSync(path.join(from, 'Sources', 'Main.hx'))) {
		let mainsource =
			'package;\n\n'
			+ 'import kha.Assets;\n'
			+ 'import kha.Framebuffer;\n'
			+ 'import kha.Scheduler;\n'
			+ 'import kha.System;\n\n'
			+ 'class Main {\n'
			+ '\tstatic function update(): Void {\n\n'
			+ '\t}\n\n'
			+ '\tstatic function render(frames: Array<Framebuffer>): Void {\n\n'
			+ '\t}\n\n'
			+ '\tpublic static function main() {\n'
			+ '\t\tSystem.start({title: "' + name + '", width: 1024, height: 768}, function (_) {\n'
			+ '\t\t\t// Just loading everything is ok for small projects\n'
			+ '\t\t\tAssets.loadEverything(function () {\n'
			+ '\t\t\t\t// Avoid passing update/render directly,\n'
			+ '\t\t\t\t// so replacing them via code injection works\n'
			+ '\t\t\t\tScheduler.addTimeTask(function () { update(); }, 0, 1 / 60);\n'
			+ '\t\t\t\tSystem.notifyOnFrames(function (frames) { render(frames); });\n'
			+ '\t\t\t});\n'
			+ '\t\t});\n'
			+ '\t}\n'
			+ '}\n';
		fs.writeFileSync(path.join(from, 'Sources', 'Main.hx'), mainsource, { encoding: 'utf8' });
	}
}
