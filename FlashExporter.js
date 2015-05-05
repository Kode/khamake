var KhaExporter = require('./KhaExporter.js');
var korepath = require('./korepath.js');
var Converter = require('./Converter.js');
var Files = require(korepath + 'Files.js');
var Haxe = require('./Haxe.js');
var Options = require('./Options.js');
var Paths = require(korepath + 'Paths.js');
var exportImage = require('./ImageTool.js');
var path = require('path');

function FlashExporter(khaDirectory, directory, embedflashassets) {
	KhaExporter.call(this, khaDirectory);
	this.directory = directory;
	this.embed = embedflashassets;
	this.images = [];
	this.sounds = [];
	this.blobs = [];
	this.addSourceDirectory(path.join(khaDirectory.toString(), 'Backends/Flash'));
};

FlashExporter.prototype = Object.create(KhaExporter.prototype);
FlashExporter.constructor = FlashExporter;

function adjustFilename(filename) {
	filename = replace(filename, '.', '_');
	filename = replace(filename, '-', '_');
	filename = replace(filename, '/', '_');
	return filename;
}

FlashExporter.prototype.sysdir = function () {
	return 'flash';
};

FlashExporter.prototype.exportSolution = function (name, platform, khaDirectory, haxeDirectory, from, callback) {
	this.createDirectory(this.directory.resolve(this.sysdir()));

	this.writeFile(this.directory.resolve('project-' + this.sysdir() + '.hxproj'));
	this.p('<?xml version="1.0" encoding="utf-8"?>');
	this.p("<project version=\"2\">");
	this.p("<!-- Output SWF options -->", 1);
	this.p("<output>", 1);
	this.p("<movie outputType=\"Application\" />", 2);
	this.p("<movie input=\"\" />", 2);
	this.p("<movie path=\"flash\\kha.swf\" />", 2);
	this.p("<movie fps=\"60\" />", 2);
	this.p("<movie width=\"" + this.width + "\" />", 2);
	this.p("<movie height=\"" + this.height + "\" />", 2);
	this.p("<movie version=\"11\" />", 2);
	this.p("<movie minorVersion=\"6\" />", 2);
	this.p("<movie platform=\"Flash Player\" />", 2);
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
	this.p("<option enabledebug=\"True\" />", 2);
	if (this.embed) this.p("<option additional=\"-D swf-script-timeout=60 -D KHA_EMBEDDED_ASSETS\" />", 2);
	else this.p("<option additional=\"-D swf-script-timeout=60\" />", 2);
	this.p("</build>", 1);
	this.p("<!-- haxelib libraries -->", 1);
	this.p("<haxelib>", 1);
	this.p("<!-- example: <library name=\"...\" /> -->", 2);
	this.p("</haxelib>", 1);
	this.p("<!-- Class files to compile (other referenced classes will automatically be included) -->", 1);
	this.p("<compileTargets>", 1);
	this.p("<compile path=\"..\\Sources\\Main.hx\" />", 2);
	this.p("</compileTargets>", 1);
	this.p("<!-- Assets to embed into the output SWF -->", 1);
	this.p("<library>", 1);
	this.p("<!-- example: <asset path=\"...\" id=\"...\" update=\"...\" glyphs=\"...\" mode=\"...\" place=\"...\" sharepoint=\"...\" /> -->", 2);
	this.p("</library>", 1);
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
	this.p("<option testMovie=\"Default\" />", 2);
	this.p("</options>", 1);
	this.p("<!-- Plugin storage -->", 1);
	this.p("<storage />", 1);
	this.p("</project>");
	this.closeFile();

	this.writeFile(this.directory.resolve("project-" + this.sysdir() + ".hxml"));
	for (var i = 0; i < this.sources.length; ++i) {
		if (path.isAbsolute(this.sources[i])) {
			this.p("-cp " + this.sources[i]);
		}
		else {
			this.p("-cp " + from.resolve('build').relativize(from.resolve(this.sources[i])).toString());
		}
	}
	if (this.embed) this.p("-D KHA_EMBEDDED_ASSETS");
	this.p("-D swf-script-timeout=60");
	this.p("-swf " + Paths.get(this.sysdir(), "kha.swf").toString());
	this.p("-swf-version 11.6");
	this.p("-main Main");
	this.closeFile();

	if (this.embed) {
		this.writeFile(this.directory.resolve(Paths.get("..", "Sources", "Assets.hx")));

		this.p("package;");
		this.p();
		this.p("import flash.display.BitmapData;");
		this.p("import flash.media.Sound;");
		this.p("import flash.utils.ByteArray;");
		this.p();

		for (image in this.images) {
			this.p("@:bitmap(\"flash/" + this.images[image] + "\") class Assets_" + adjustFilename(this.images[image]) + " extends BitmapData { }");
		}

		this.p();

		for (sound in this.sounds) {
			p("@:sound(\"flash/" + this.sounds[sound] + "\") class Assets_" + adjustFilename(this.sounds[sound]) + " extends Sound { }");
		}

		this.p();

		for (blob in this.blobs) {
			this.p("@:file(\"flash/" + this.blobs[blob] + "\") class Assets_" + adjustFilename(this.blobs[blob]) + " extends ByteArray { }");
		}

		this.p();
		this.p("class Assets {");
		this.p("public static function visit(): Void {", 1);
		this.p("", 2);
		this.p("}", 1);
		this.p("}");

		this.closeFile();
	}

	if (Options.compilation) {
		var options = [];
		options.push("project-" + this.sysdir() + ".hxml");
		Haxe.executeHaxe(from, haxeDirectory, options, callback);
	}
	else {
		callback();
	}
};

FlashExporter.prototype.copyMusic = function (platform, from, to, encoders, callback) {
	if (this.embed) this.sounds.push(to.toString() + '.mp3');
	Files.createDirectories(this.directory.resolve(this.sysdir()).resolve(to.toString()).parent());
	Converter.convert(from, this.directory.resolve(this.sysdir()).resolve(to.toString() + '.mp3'), encoders.mp3Encoder, callback);
};

FlashExporter.prototype.copySound = function (platform, from, to, encoders, callback) {
	if (this.embed) this.sounds.push(to.toString() + '.mp3');
	Files.createDirectories(this.directory.resolve(this.sysdir()).resolve(to.toString()).parent());
	Converter.convert(from, this.directory.resolve(this.sysdir()).resolve(to.toString() + '.mp3'), encoders.mp3Encoder, callback);
};

FlashExporter.prototype.copyImage = function (platform, from, to, asset, callback) {
	if (this.embed) this.images.push(to.toString());
	exportImage(from, this.directory.resolve(this.sysdir()).resolve(to), asset, undefined, false, callback);
};

FlashExporter.prototype.copyBlob = function (platform, from, to, callback) {
	this.copyFile(from, this.directory.resolve(this.sysdir()).resolve(to));
	if (this.embed) this.blobs.push(to.toString());
	callback();
};

FlashExporter.prototype.copyVideo = function (platform, from, to, encoders, callback) {
	Files.createDirectories(this.directory.resolve(this.sysdir()).resolve(to.toString()).parent());
	Converter.convert(from, this.directory.resolve(this.sysdir()).resolve(to.toString() + '.mp4'), encoders.h264Encoder, callback);
};

FlashExporter.prototype.addShader = function (shader) {
	if (this.embed) this.blobs.push(shader);
};

module.exports = FlashExporter;
