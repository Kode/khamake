var KhaExporter = require('./KhaExporter.js');
var korepath = require('./korepath.js');
var Converter = require('./Converter.js');
var Files = require(korepath + 'Files.js');
var Haxe = require('./Haxe.js');
var Options = require('./Options.js');
var Paths = require(korepath + 'Paths.js');
var exportImage = require('./ImageTool.js');
var fs = require('fs');
var path = require('path');

function JavaExporter(directory) {
	KhaExporter.call(this);
	this.directory = directory;
};

JavaExporter.prototype = Object.create(KhaExporter.prototype);
JavaExporter.constructor = JavaExporter;

JavaExporter.prototype.sysdir = function () {
	return 'java';
};

JavaExporter.prototype.exportSolution = function (name, platform, haxeDirectory, from, callback) {
	this.addSourceDirectory("Kha/Backends/" + this.backend());

	this.createDirectory(this.directory.resolve(this.sysdir()));

	this.writeFile(this.directory.resolve("project-" + this.sysdir() + ".hxproj"));
	this.p("<?xml version=\"1.0\" encoding=\"utf-8\"?>");
	this.p("<project version=\"2\">");
		this.p("<!-- Output SWF options -->", 1);
		this.p("<output>", 1);
		this.p("<movie outputType=\"Application\" />", 2);
		this.p("<movie input=\"\" />", 2);
		this.p("<movie path=\"" + this.sysdir() + "\\Sources\" />", 2);
		this.p("<movie fps=\"0\" />", 2);
		this.p("<movie width=\"0\" />", 2);
		this.p("<movie height=\"0\" />", 2);
		this.p("<movie version=\"1\" />", 2);
		this.p("<movie minorVersion=\"0\" />", 2);
		this.p("<movie platform=\"Java\" />", 2);
		this.p("<movie background=\"#FFFFFF\" />", 2);
		if (Files.isDirectory(haxeDirectory)) this.p('<movie preferredSDK="' + from.resolve('build').relativize(haxeDirectory).toString() + '" />', 2);
		this.p("</output>", 1);
		this.p("<!-- Other classes to be compiled into your SWF -->", 1);
		this.p("<classpaths>", 1);
		for (var i = 0; i < this.sources.length; ++i) {
			this.p('<class path="' + from.resolve('build').relativize(from.resolve(this.sources[i])).toString() + '" />', 2);
		}
		this.p("</classpaths>", 1);
		this.p("<!-- Build options -->", 1);
		this.p("<build>", 1);
		this.p("<option directives=\"\" />", 2);
		this.p("<option flashStrict=\"False\" />", 2);
		this.p("<option mainClass=\"Main\" />", 2);
		this.p("<option enabledebug=\"False\" />", 2);
		this.p("<option additional=\"-D no-compilation&#xA;-java-lib " + from.resolve('build').relativize(haxeDirectory).resolve(Paths.get("hxjava", "hxjava-std.jar")).toString() + "\" />", 2);
		this.p("</build>", 1);
		this.p("<!-- haxelib libraries -->", 1);
		this.p("<haxelib>", 1);
		this.p("<!-- example: <library name=\"...\" /> -->", 2);
		this.p("</haxelib>", 1);
		this.p("<!-- Class files to compile (other referenced classes will automatically be included) -->", 1);
		this.p("<compileTargets>", 1);
		this.p("<compile path=\"..\\Sources\\Main.hx\" />", 2);
		this.p("</compileTargets>", 1);
		this.p("<!-- Paths to exclude from the Project Explorer tree -->", 1);
		this.p("<hiddenPaths>", 1);
		this.p("<!-- example: <hidden path=\"...\" /> -->", 2);
		this.p("</hiddenPaths>", 1);
		this.p("<!-- Executed before build -->", 1);
		this.p("<preBuildCommand />", 1);
		this.p("<!-- Executed after build -->", 1);
		this.p("<postBuildCommand alwaysRun=\"False\" />", 1);
		this.p("<!-- Other project options -->", 1);
		this.p("<options>", 1);
		this.p("<option showHiddenPaths=\"False\" />", 2);
		this.p("<option testMovie=\"OpenDocument\" />", 2);
		this.p("<option testMovieCommand=\"\" />", 2);
		this.p("</options>", 1);
		this.p("<!-- Plugin storage -->", 1);
		this.p("<storage />", 1);
	this.p("</project>");
	this.closeFile();

	Files.removeDirectory(this.directory.resolve(Paths.get(this.sysdir(), "Sources")));
	
	this.writeFile(this.directory.resolve("project-" + this.sysdir() + ".hxml"));
	for (var i = 0; i < this.sources.length; ++i) {
		this.p("-cp " + from.resolve('build').relativize(from.resolve(this.sources[i])).toString());
	}
	this.p("-java " + Paths.get(this.sysdir(), "Sources").toString());
	this.p("-main Main");
	this.p("-D no-compilation");
	this.p("-java-lib " + from.resolve('build').relativize(haxeDirectory).resolve(Paths.get("hxjava", "hxjava-std.jar")).toString());
	this.closeFile();

	var options = [];
	options.push("project-" + this.sysdir() + ".hxml");
	var self = this;
	Haxe.executeHaxe(from, haxeDirectory, options, function () {
		self.exportEclipseProject();
		callback();
	});
};

JavaExporter.prototype.backend = function () {
	return "Java";
};

JavaExporter.prototype.exportEclipseProject = function () {
	this.writeFile(this.directory.resolve(Paths.get(this.sysdir(), ".classpath")));
	this.p("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
	this.p("<classpath>");
	this.p("\t<classpathentry kind=\"src\" path=\"Sources/src\"/>");
	this.p("\t<classpathentry kind=\"con\" path=\"org.eclipse.jdt.launching.JRE_CONTAINER\"/>");
	this.p("\t<classpathentry kind=\"output\" path=\"bin\"/>");
	this.p("</classpath>");
	this.closeFile();
		
	this.writeFile(this.directory.resolve(Paths.get(this.sysdir(), ".project")));
	this.p("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
	this.p("<projectDescription>");
	this.p("\t<name>" + this.getCurrentDirectoryName(this.directory) + "</name>");
	this.p("\t<comment></comment>");
	this.p("\t<projects>");
	this.p("\t</projects>");
	this.p("\t<buildSpec>");
	this.p("\t\t<buildCommand>");
	this.p("\t\t\t<name>org.eclipse.jdt.core.javabuilder</name>");
	this.p("\t\t\t<arguments>");
	this.p("\t\t\t</arguments>");
	this.p("\t\t</buildCommand>");
	this.p("\t</buildSpec>");
	this.p("\t<natures>");
	this.p("\t\t<nature>org.eclipse.jdt.core.javanature</nature>");
	this.p("\t</natures>");
	this.p("</projectDescription>");
	this.closeFile();
};

JavaExporter.prototype.copyMusic = function (platform, from, to, encoders, callback) {
	this.copyFile(from, this.directory.resolve(this.sysdir()).resolve(to.toString() + ".wav"));
	callback();
};

JavaExporter.prototype.copySound = function (platform, from, to, encoders, callback) {
	this.copyFile(from, this.directory.resolve(this.sysdir()).resolve(to.toString() + ".wav"));
	callback();
};

JavaExporter.prototype.copyImage = function (platform, from, to, asset, callback) {
	exportImage(from, this.directory.resolve(this.sysdir()).resolve(to), asset, undefined, false, callback);
};

JavaExporter.prototype.copyBlob = function (platform, from, to, callback) {
	this.copyFile(from, this.directory.resolve(this.sysdir()).resolve(to));
	callback();
};

JavaExporter.prototype.copyVideo = function (platform, from, to, encoders, callback) {
	callback();
};

module.exports = JavaExporter;
