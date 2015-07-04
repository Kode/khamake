var fs = require('fs');
var path = require('path');
var KhaExporter = require('./KhaExporter.js');
var korepath = require('./korepath.js');
var Converter = require('./Converter.js');
var Files = require(path.join(korepath.get(), 'Files.js'));
var Haxe = require('./Haxe.js');
var Options = require('./Options.js');
var Paths = require(path.join(korepath.get(), 'Paths.js'));
var exportImage = require('./ImageTool.js');
var uuid = require('./uuid.js');
var HaxeProject = require('./HaxeProject.js');

function CSharpExporter(khaDirectory, directory) {
	KhaExporter.call(this, khaDirectory);
	this.directory = directory;
}

CSharpExporter.prototype = Object.create(KhaExporter.prototype);
CSharpExporter.constructor = CSharpExporter;

CSharpExporter.prototype.includeFiles = function (dir, baseDir) {
	if (dir.path.length == 0 || !Files.exists(dir)) return;
	var files = Files.newDirectoryStream(dir);
	for (var f in files) {
		var file = dir.resolve(files[f]);
		if (Files.isDirectory(file)) this.includeFiles(file, baseDir);
		else if (file.getFileName().endsWith(".cs")) {
			this.p("<Compile Include=\"" + baseDir.relativize(file).toString().replaceAll('/', '\\') + "\" />", 2);
		}
	}
};

CSharpExporter.prototype.exportSolution = function (name, platform, khaDirectory, haxeDirectory, from, callback) {
	this.addSourceDirectory("Kha/Backends/" + this.backend());

	var defines = [
		'no-root',
		'no-compilation',
		'sys_' + platform,
		'sys_g1', 'sys_g2',
		'sys_a1'
	];

	var options = {
		from: from.toString(),
		to: path.join(this.sysdir() + '-build', 'Sources'),
		sources: this.sources,
		defines: defines,
		haxeDirectory: haxeDirectory.toString(),
		system: this.sysdir(),
		language: 'cs',
		width: this.width,
		height: this.height,
		name: name
	};
	HaxeProject(this.directory.toString(), options);

	Files.removeDirectory(this.directory.resolve(Paths.get(this.sysdir() + "-build", "Sources")));

	var self = this;
	Haxe.executeHaxe(this.directory, haxeDirectory, ['project-' + this.sysdir() + '.hxml'], function () {
		var projectUuid = uuid.v4();
		self.exportSLN(projectUuid);
		self.exportCsProj(projectUuid);
		self.exportResources();
		callback();
	});
};

CSharpExporter.prototype.exportSLN = function (projectUuid) {
	this.writeFile(this.directory.resolve(Paths.get(this.sysdir() + "-build", "Project.sln")));
	var solutionUuid = uuid.v4();

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
};

CSharpExporter.prototype.copyMusic = function (platform, from, to, encoders, callback) {
	callback();
};

CSharpExporter.prototype.copySound = function (platform, from, to, encoders, callback) {
	callback();
};

CSharpExporter.prototype.copyImage = function (platform, from, to, asset, callback) {
	exportImage(from, this.directory.resolve(this.sysdir()).resolve(to), asset, undefined, false, callback);
};

CSharpExporter.prototype.copyBlob = function (platform, from, to, callback) {
	this.copyFile(from, this.directory.resolve(this.sysdir()).resolve(to));
	callback();
};

CSharpExporter.prototype.copyVideo = function (platform, from, to, encoders, callback) {
	callback();
};

module.exports = CSharpExporter;
