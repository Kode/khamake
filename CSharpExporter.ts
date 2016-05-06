"use strict";

import * as fs from 'fs-extra';
import * as path from 'path';
import {KhaExporter} from './KhaExporter';
import {convert} from './Converter';
import {executeHaxe} from './Haxe';
import {Options} from './Options';
import {exportImage} from './ImageTool';
import {writeHaxeProject} from './HaxeProject';
const uuid = require('./uuid.js');

export abstract class CSharpExporter extends KhaExporter {
	parameters: Array<string>;
	
	constructor(khaDirectory, directory) {
		super(khaDirectory, directory);
	}

	includeFiles(dir: string, baseDir: string) {
		if (!dir || !fs.existsSync(dir)) return;
		let files = fs.readdirSync(dir);
		for (var f in files) {
			let file = path.join(dir, files[f]);
			if (fs.existsSync(file) && fs.statSync(file).isDirectory()) this.includeFiles(file, baseDir);
			else if (file.endsWith(".cs")) {
				this.p("<Compile Include=\"" + path.relative(baseDir, file).replace(/\//g, '\\') + "\" />", 2);
			}
		}
	}

	async exportSolution(name, platform, khaDirectory, haxeDirectory, from, _targetOptions, defines) {
		this.addSourceDirectory("Kha/Backends/" + this.backend());

		defines.push('no-root');
		defines.push('no-compilation');
		defines.push('sys_' + platform);
		defines.push('sys_g1');
		defines.push('sys_g2');
		defines.push('sys_a1');

		const options = {
			from: from.toString(),
			to: path.join(this.sysdir() + '-build', 'Sources'),
			sources: this.sources,
			libraries: this.libraries,
			defines: defines,
			parameters: this.parameters,
			haxeDirectory: haxeDirectory.toString(),
			system: this.sysdir(),
			language: 'cs',
			width: this.width,
			height: this.height,
			name: name
		};
		await writeHaxeProject(this.directory.toString(), options);

		fs.removeSync(path.join(this.directory, this.sysdir() + '-build', 'Sources'));

		let result = await executeHaxe(this.directory, haxeDirectory, ['project-' + this.sysdir() + '.hxml']);
		const projectUuid = uuid.v4();
		this.exportSLN(projectUuid);
		this.exportCsProj(projectUuid);
		this.exportResources();
		return result;
	}

	exportSLN(projectUuid) {
		this.writeFile(path.join(this.directory, this.sysdir() + '-build', 'Project.sln'));
		const solutionUuid = uuid.v4();

		this.p("Microsoft Visual Studio Solution File, Format Version 11.00");
		this.p("# Visual Studio 2010");
		this.p("Project(\"{" + solutionUuid.toString().toUpperCase() + "}\") = \"HaxeProject\", \"Project.csproj\", \"{" + projectUuid.toString().toUpperCase() + "}\"");
		this.p("EndProject");
		this.p("Global");
		this.p("GlobalSection(SolutionConfigurationPlatforms) = preSolution", 1);
		this.p("Debug|x86 = Debug|x86", 2);
		this.p("Release|x86 = Release|x86", 2);
		this.p("EndGlobalSection", 1);
		this.p("GlobalSection(ProjectConfigurationPlatforms) = postSolution", 1);
		this.p("{" + projectUuid.toString().toUpperCase() + "}.Debug|x86.ActiveCfg = Debug|x86", 2);
		this.p("{" + projectUuid.toString().toUpperCase() + "}.Debug|x86.Build.0 = Debug|x86", 2);
		this.p("{" + projectUuid.toString().toUpperCase() + "}.Release|x86.ActiveCfg = Release|x86", 2);
		this.p("{" + projectUuid.toString().toUpperCase() + "}.Release|x86.Build.0 = Release|x86", 2);
		this.p("EndGlobalSection", 1);
		this.p("GlobalSection(SolutionProperties) = preSolution", 1);
		this.p("HideSolutionNode = FALSE", 2);
		this.p("EndGlobalSection", 1);
		this.p("EndGlobal");
		this.closeFile();
	}

	/*copyMusic(platform, from, to, encoders) {
		return [to];
	}*/
	
	abstract sysdir(): string;
	
	abstract backend(): string;
	
	abstract exportCsProj(projectUuid);
	
	abstract exportResources();

	async copySound(platform, from, to, encoders) {
		return [to];
	}

	async copyImage(platform: string, from: string, to: string, asset) {
		let format = exportImage(from, path.join(this.directory, this.sysdir(), to), asset, undefined, false);
		return [to + '.' + format];
	}

	async copyBlob(platform: string, from: string, to: string) {
		fs.copySync(from, path.join(this.directory, this.sysdir(), to), { clobber: true });
		return [to];
	}

	async copyVideo(platform, from, to, encoders) {
		return [to];
	}
}
