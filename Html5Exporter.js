var path = require('path');
var KhaExporter = require('./KhaExporter.js');
var korepath = require('./korepath.js');
var Converter = require('./Converter.js');
var Files = require(path.join(korepath.get(), 'Files.js'));
var Haxe = require('./Haxe.js');
var Options = require('./Options.js');
var Paths = require(path.join(korepath.get(), 'Paths.js'));
var exportImage = require('./ImageTool.js');
var fs = require('fs');
var HaxeProject = require('./HaxeProject.js');

function Html5Exporter(khaDirectory, directory) {
	KhaExporter.call(this, khaDirectory);
	this.directory = directory;
	this.addSourceDirectory(path.join(khaDirectory.toString(), 'Backends/HTML5'));
};

Html5Exporter.prototype = Object.create(KhaExporter.prototype);
Html5Exporter.constructor = Html5Exporter;

Html5Exporter.prototype.sysdir = function () {
	return 'html5';
};

Html5Exporter.prototype.exportSolution = function (name, platform, khaDirectory, haxeDirectory, from, callback) {
	this.createDirectory(this.directory.resolve(this.sysdir()));

	var defines = [
		'sys_' + platform,
		'sys_g1', 'sys_g2', 'sys_g3', 'sys_g4',
		'sys_a1', 'sys_a2'
	];
	if (this.sysdir() === 'node') {
		defines = [
			'sys_node',
			'sys_server'
		]
	}

	var options = {
		from: from.toString(),
		to: path.join(this.sysdir(), 'kha.js'),
		sources: this.sources,
		defines: defines,
		haxeDirectory: haxeDirectory.toString(),
		system: this.sysdir(),
		language: 'js',
		width: this.width,
		height: this.height,
		name: name
	};
	HaxeProject(this.directory.toString(), options);

	var index = this.directory.resolve(Paths.get(this.sysdir(), "index.html"));
	if (!Files.exists(index)) {
		var protoindex = fs.readFileSync(path.join(__dirname, 'Data', 'html5', 'index.html'), { encoding: 'utf8' });
		protoindex = protoindex.replaceAll("{Name}", name);
		protoindex = protoindex.replaceAll("{Width}", this.width);
		protoindex = protoindex.replaceAll("{Height}", this.height);
		fs.writeFileSync(index.toString(), protoindex);
	}

	if (Options.compilation) {
		Haxe.executeHaxe(this.directory, haxeDirectory, ['project-' + this.sysdir() + '.hxml'], callback);
	}
	else {
		callback();
	}
};

Html5Exporter.prototype.copyMusic = function (platform, from, to, encoders, callback) {
	var self = this;
	Files.createDirectories(this.directory.resolve(this.sysdir()).resolve(to.toString()).parent());
	Converter.convert(from, this.directory.resolve(this.sysdir()).resolve(to.toString() + ".ogg"), encoders.oggEncoder, function () {
		Converter.convert(from, self.directory.resolve(self.sysdir()).resolve(to.toString() + ".mp4"), encoders.aacEncoder, callback);
	});
};

Html5Exporter.prototype.copySound = function (platform, from, to, encoders, callback) {
	var self = this;
	Files.createDirectories(this.directory.resolve(this.sysdir()).resolve(to.toString()).parent());
	Converter.convert(from, this.directory.resolve(this.sysdir()).resolve(to.toString() + ".ogg"), encoders.oggEncoder, function () {
		Converter.convert(from, self.directory.resolve(self.sysdir()).resolve(to.toString() + ".mp4"), encoders.aacEncoder, callback);
	});
};

Html5Exporter.prototype.copyImage = function (platform, from, to, asset, callback) {
	exportImage(from, this.directory.resolve(this.sysdir()).resolve(to), asset, undefined, false, callback);
};

Html5Exporter.prototype.copyBlob = function (platform, from, to, callback) {
	this.copyFile(from, this.directory.resolve(this.sysdir()).resolve(to));
	callback();
};

Html5Exporter.prototype.copyVideo = function (platform, from, to, encoders, callback) {
	var self = this;
	Files.createDirectories(this.directory.resolve(this.sysdir()).resolve(to.toString()).parent());
	Converter.convert(from, this.directory.resolve(this.sysdir()).resolve(to.toString() + ".mp4"), encoders.h264Encoder, function () {
		Converter.convert(from, self.directory.resolve(self.sysdir()).resolve(to.toString() + ".webm"), encoders.webmEncoder, callback);
	});
};

module.exports = Html5Exporter;
