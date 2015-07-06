var path = require('path');
var KhaExporter = require('./KhaExporter.js');
var korepath = require('./korepath.js');
var Converter = require('./Converter.js');
var Files = require(path.join(korepath.get(), 'Files.js'));
var Haxe = require('./Haxe.js');
var Paths = require(path.join(korepath.get(), 'Paths.js'));
var Platform = require('./Platform.js');
var exportImage = require('./ImageTool.js');
var HaxeProject = require('./HaxeProject.js');

function KoreExporter(platform, khaDirectory, vr, directory) {
	KhaExporter.call(this, khaDirectory);
	this.platform = platform;
	this.directory = directory;
	this.addSourceDirectory(path.join(khaDirectory.toString(), 'Backends/Kore'));
	this.vr = vr;
}

KoreExporter.prototype = Object.create(KhaExporter.prototype);
KoreExporter.constructor = KoreExporter;

KoreExporter.prototype.sysdir = function () {
	return this.platform;
};

KoreExporter.prototype.exportSolution = function (name, platform, khaDirectory, haxeDirectory, from, callback) {
	var defines = [
		'no-compilation',
		'sys_' + platform,
		'sys_g1', 'sys_g2', 'sys_g3', 'sys_g4',
		'sys_a1', 'sys_a2'
	];
	if (this.vr === 'gearvr') {
		defines.push('vr_gearvr');
	}
	else if (this.vr === 'cardboard') {
		defines.push('vr_cardboard');
	}
	else if (this.vr === 'rift') {
		defines.push('vr_rift');
	}

	var options = {
		from: from.toString(),
		to: path.join(this.sysdir() + '-build', 'Sources'),
		sources: this.sources,
		defines: defines,
		haxeDirectory: haxeDirectory.toString(),
		system: this.sysdir(),
		language: 'cpp',
		width: this.width,
		height: this.height,
		name: name
	};
	HaxeProject(this.directory.toString(), options);

	//Files.removeDirectory(this.directory.resolve(Paths.get(this.sysdir() + "-build", "Sources")));

	Haxe.executeHaxe(this.directory, haxeDirectory, ["project-" + this.sysdir() + ".hxml"], callback);
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
	/*else if (platform === Platform.Android && asset.compressed) {
		var index = to.toString().lastIndexOf('.');
		to = to.toString().substr(0, index) + '.astc';
		asset.file = to.toString().replaceAll('\\', '/');
		exportImage(from, this.directory.resolve(this.sysdir()).resolve(to), asset, 'astc', true, callback);
	}*/
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
