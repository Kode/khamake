var path = require('path');
var KhaExporter = require('./KhaExporter.js');
var korepath = require('./korepath.js');
var Converter = require('./Converter.js');
var Files = require(path.join(korepath.get(), 'Files.js'));
var Haxe = require('./Haxe.js');
var Options = require('./Options.js');
var Paths = require(path.join(korepath.get(), 'Paths.js'));
var exportImage = require('./ImageTool.js');
var HaxeProject = require('./HaxeProject.js');

function FlashExporter(khaDirectory, directory, embedflashassets) {
	KhaExporter.call(this, khaDirectory);
	this.directory = directory;
	this.embed = embedflashassets;
	this.images = [];
	this.sounds = [];
	this.blobs = [];
	this.addSourceDirectory(path.join(khaDirectory.toString(), 'Backends/Flash'));
}

FlashExporter.prototype = Object.create(KhaExporter.prototype);
FlashExporter.constructor = FlashExporter;

function adjustFilename(filename) {
	filename = filename.replaceAll('.', '_');
	filename = filename.replaceAll('-', '_');
	filename = filename.replaceAll('/', '_');
	return filename;
}

FlashExporter.prototype.sysdir = function () {
	return 'flash';
};

FlashExporter.prototype.exportSolution = function (name, platform, khaDirectory, haxeDirectory, from, callback) {
	var defines = [
		'swf-script-timeout=60',
		'sys_' + platform,
		'sys_g1', 'sys_g2', 'sys_g3', 'sys_g4',
		'sys_a1', 'sys_a2'
	];
	if (this.embed) defines.push('KHA_EMBEDDED_ASSETS');

	var options = {
		from: from.toString(),
		to: path.join(this.sysdir(), 'kha.swf'),
		sources: this.sources,
		defines: defines,
		haxeDirectory: haxeDirectory.toString(),
		system: this.sysdir(),
		language: 'as',
		width: this.width,
		height: this.height,
		name: name
	};
	HaxeProject(this.directory.toString(), options);

	if (this.embed) {
		this.writeFile(this.directory.resolve(Paths.get("..", "Sources", "Assets.hx")));

		this.p("package;");
		this.p();
		this.p("import flash.display.BitmapData;");
		this.p("import flash.media.Sound;");
		this.p("import flash.utils.ByteArray;");
		this.p();

		for (var image in this.images) {
			this.p("@:bitmap(\"flash/" + this.images[image] + "\") class Assets_" + adjustFilename(this.images[image]) + " extends BitmapData { }");
		}

		this.p();

		for (var sound in this.sounds) {
			this.p("@:sound(\"flash/" + this.sounds[sound] + "\") class Assets_" + adjustFilename(this.sounds[sound]) + " extends Sound { }");
		}

		this.p();

		for (var blob in this.blobs) {
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
		Haxe.executeHaxe(this.directory, haxeDirectory, ['project-' + this.sysdir() + '.hxml'], callback);
	}
	else {
		callback();
	}
};

FlashExporter.prototype.copyMusic = function (platform, from, to, encoders, callback) {
	if (this.embed) this.sounds.push(to.toString() + '.ogg');
	Files.createDirectories(this.directory.resolve(this.sysdir()).resolve(to.toString()).parent());
	Converter.convert(from, this.directory.resolve(this.sysdir()).resolve(to.toString() + '.ogg'), encoders.oggEncoder, callback);
};

FlashExporter.prototype.copySound = function (platform, from, to, encoders, callback) {
	if (this.embed) this.sounds.push(to.toString() + '.ogg');
	Files.createDirectories(this.directory.resolve(this.sysdir()).resolve(to.toString()).parent());
	Converter.convert(from, this.directory.resolve(this.sysdir()).resolve(to.toString() + '.ogg'), encoders.oggEncoder, callback);
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
