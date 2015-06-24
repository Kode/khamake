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
var HaxeProject = require('./HaxeProject.js');

function JavaExporter(khaDirectory, directory) {
	KhaExporter.call(this, khaDirectory);
	this.directory = directory;
};

JavaExporter.prototype = Object.create(KhaExporter.prototype);
JavaExporter.constructor = JavaExporter;

JavaExporter.prototype.sysdir = function () {
	return 'java';
};

JavaExporter.prototype.exportSolution = function (name, platform, khaDirectory, haxeDirectory, from, callback) {
	this.addSourceDirectory("Kha/Backends/" + this.backend());

	this.createDirectory(this.directory.resolve(this.sysdir()));

	var defines = ['no-compilation'];

	var options = {
		from: from.toString(),
		to: path.join(this.sysdir(), 'Sources'),
		sources: this.sources,
		defines: defines,
		haxeDirectory: haxeDirectory.toString(),
		system: this.sysdir(),
		language: 'java',
		width: this.width,
		height: this.height
	};
	HaxeProject.FlashDevelopment(this.directory.toString(), options);
	HaxeProject.hxml(this.directory.toString(), options);

	Files.removeDirectory(this.directory.resolve(Paths.get(this.sysdir(), "Sources")));

	var self = this;
	Haxe.executeHaxe(from, haxeDirectory, ['project-' + this.sysdir() + '.hxml'], function () {
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
