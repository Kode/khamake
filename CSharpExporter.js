"use strict";

const fs = require('fs-extra');
const path = require('path');
const KhaExporter = require('./KhaExporter.js');
const Converter = require('./Converter.js');
const Files = require('./Files.js');
const Haxe = require('./Haxe.js');
const Options = require('./Options.js');
const Paths = require('./Paths.js');
const exportImage = require('./ImageTool.js');
const uuid = require('./uuid.js');
const HaxeProject = require('./HaxeProject.js');

class CSharpExporter extends KhaExporter {
	constructor(khaDirectory, directory) {
		super(khaDirectory, directory);
		this.directory = directory;
	}

	includeFiles(dir, baseDir) {
		if (dir.path.length == 0 || !Files.exists(dir)) return;
		let files = Files.newDirectoryStream(dir);
		for (var f in files) {
			let file = dir.resolve(files[f]);
			if (Files.isDirectory(file)) this.includeFiles(file, baseDir);
			else if (file.getFileName().endsWith(".cs")) {
				this.p("<Compile Include=\"" + baseDir.relativize(file).toString().replaceAll('/', '\\') + "\" />", 2);
			}
		}
	}

	exportSolution(name, platform, khaDirectory, haxeDirectory, from, _targetOptions, defines) {
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
		HaxeProject(this.directory.toString(), options);

		Files.removeDirectory(this.directory.resolve(Paths.get(this.sysdir() + "-build", "Sources")));

		let result = Haxe.executeHaxe(this.directory, haxeDirectory, ['project-' + this.sysdir() + '.hxml']);
		const projectUuid = uuid.v4();
		this.exportSLN(projectUuid);
		this.exportCsProj(projectUuid);
		this.exportResources();
		return result;
	}

	exportSLN(projectUuid) {
		this.writeFile(this.directory.resolve(Paths.get(this.sysdir() + "-build", "Project.sln")));
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

	copySound(platform, from, to, encoders) {
		return [to];
	}

	copyImage(platform, from, to, asset) {
		let format = exportImage(from, this.directory.resolve(this.sysdir()).resolve(to), asset, undefined, false);
		return [to + '.' + format];
	}

	copyBlob(platform, from, to) {
		fs.copySync(from.toString(), this.directory.resolve(this.sysdir()).resolve(to).toString(), { clobber: true });
		return [to];
	}

	copyVideo(platform, from, to, encoders) {
		return [to];
	}
}

module.exports = CSharpExporter;
