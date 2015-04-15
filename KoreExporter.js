var KhaExporter = require('./KhaExporter.js');
var korepath = require('./korepath.js');
var Converter = require('./Converter.js');
var Files = require(korepath + 'Files.js');
var Haxe = require('./Haxe.js');
var Paths = require(korepath + 'Paths.js');
var Platform = require('./Platform.js');
var exportImage = require('./ImageTool.js');
var path = require('path');

function KoreExporter(platform, khaDirectory, directory) {
	KhaExporter.call(this, khaDirectory);
	this.platform = platform;
	this.directory = directory;
	this.addSourceDirectory(path.join(khaDirectory.toString(), 'Backends/Kore'));
}

KoreExporter.prototype = Object.create(KhaExporter.prototype);
KoreExporter.constructor = KoreExporter;

KoreExporter.prototype.sysdir = function () {
	return this.platform;
};

KoreExporter.prototype.exportSolution = function (name, platform, khaDirectory, haxeDirectory, from, callback) {
	this.writeFile(this.directory.resolve("project-" + this.sysdir() + ".hxproj"));
	this.p("<?xml version=\"1.0\" encoding=\"utf-8\"?>");
	this.p("<project version=\"2\">");
	this.p("<!-- Output SWF options -->", 1);
	this.p("<output>", 1);
	this.p("<movie outputType=\"Application\" />", 2);
	this.p("<movie input=\"\" />", 2);
	this.p("<movie path=\"" + this.sysdir() + "-build\\Sources\" />", 2);
	this.p("<movie fps=\"0\" />", 2);
	this.p("<movie width=\"0\" />", 2);
	this.p("<movie height=\"0\" />", 2);
	this.p("<movie version=\"1\" />", 2);
	this.p("<movie minorVersion=\"0\" />", 2);
	this.p("<movie platform=\"C++\" />", 2);
	this.p("<movie background=\"#FFFFFF\" />", 2);
	if (Files.isDirectory(haxeDirectory)) this.p('<movie preferredSDK="' + from.resolve('build').relativize(haxeDirectory).toString() + '" />', 2);
	this.p("</output>", 1);
	this.p("<!-- Other classes to be compiled into your SWF -->", 1);
	this.p("<classpaths>", 1);
	for (var i = 0; i < this.sources.length; ++i) {
		if (path.isAbsolute(this.sources[i])) {
			this.p('<class path="' + this.sources[i] + '" />', 2);
		}
		else {
			this.p('<class path="' + from.resolve('build').relativize(from.resolve(this.sources[i])).toString() + '" />', 2);
		}
	}
	this.p("</classpaths>", 1);
	this.p("<!-- Build options -->", 1);
	this.p("<build>", 1);
	this.p("<option directives=\"\" />", 2);
	this.p("<option flashStrict=\"False\" />", 2);
	this.p("<option mainClass=\"Main\" />", 2);
	this.p("<option enabledebug=\"False\" />", 2);
	this.p("<option additional=\"-D no-compilation\" />", 2);
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
	this.p("<option testMovie=\"Custom\" />", 2);
	this.p("<option testMovieCommand=\"run.bat\" />", 2);
	this.p("</options>", 1);
	this.p("<!-- Plugin storage -->", 1);
	this.p("<storage />", 1);
	this.p("</project>");
	this.closeFile();

	//Files.removeDirectory(this.directory.resolve(Paths.get(this.sysdir() + "-build", "Sources")));

	this.writeFile(this.directory.resolve("project-" + this.sysdir() + ".hxml"));
	for (var i = 0; i < this.sources.length; ++i) {
		if (path.isAbsolute(this.sources[i])) {
			this.p("-cp " + this.sources[i]);
		}
		else {
			this.p("-cp " + from.resolve('build').relativize(from.resolve(this.sources[i])).toString());
		}
	}
	this.p("-cpp " + Paths.get(this.sysdir() + "-build", "Sources").toString());
	this.p("-D no-compilation");
	this.p("-main Main");
	this.closeFile();

	var options = [];
	options.push("project-" + this.sysdir() + ".hxml");
	Haxe.executeHaxe(from, haxeDirectory, options, callback);
};

KoreExporter.prototype.copyMusic = function (platform, from, to, encoders, callback) {
	Files.createDirectories(this.directory.resolve(this.sysdir()).resolve(to.toString()).parent());
	Converter.convert(from, this.directory.resolve(this.sysdir()).resolve(to.toString() + '.ogg'), encoders.oggEncoder, callback);
};

KoreExporter.prototype.copySound = function (platform, from, to, encoders, callback) {
	this.copyFile(from, this.directory.resolve(this.sysdir()).resolve(to.toString() + '.wav'));
	callback();
};

KoreExporter.prototype.copyImage = function (platform, from, to, asset, callback) {
	if (platform === Platform.iOS && asset.compressed) {
		var index = to.toString().lastIndexOf('.');
		to = to.toString().substr(0, index) + '.pvr';
		asset.file = to.toString().replaceAll('\\', '/');
		exportImage(from, this.directory.resolve(this.sysdir()).resolve(to), asset, 'pvrtc', true, callback);
	}
	else {
		exportImage(from, this.directory.resolve(this.sysdir()).resolve(to), asset, undefined, true, callback);
	}
};

KoreExporter.prototype.copyBlob = function (platform, from, to, callback) {
	this.copyFile(from, this.directory.resolve(this.sysdir()).resolve(to));
	callback();
};

KoreExporter.prototype.copyVideo = function (platform, from, to, encoders, callback) {
	Files.createDirectories(this.directory.resolve(this.sysdir()).resolve(to.toString()).parent());
	if (platform === Platform.iOS) {
		Converter.convert(from, this.directory.resolve(this.sysdir()).resolve(to.toString() + '.mp4'), encoders.h264Encoder, callback);
	}
	else if (platform === Platform.Android) {
		Converter.convert(from, this.directory.resolve(this.sysdir()).resolve(to.toString() + '.ts'), encoders.h264Encoder, callback);
	}
	else {
		Converter.convert(from, this.directory.resolve(this.sysdir()).resolve(to.toString() + '.ogv'), encoders.theoraEncoder, callback);
	}
};

module.exports = KoreExporter;
