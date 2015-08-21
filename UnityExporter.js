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
var uuid = require('./uuid.js');
var HaxeProject = require('./HaxeProject.js');

function UnityExporter(khaDirectory, directory) {
	KhaExporter.call(this, khaDirectory);
	this.directory = directory;
};

UnityExporter.prototype = Object.create(KhaExporter.prototype);
UnityExporter.constructor = UnityExporter;

UnityExporter.prototype.sysdir = function () {
	return 'unity';
};

UnityExporter.prototype.exportSolution = function (name, platform, khaDirectory, haxeDirectory, from, callback) {
	this.addSourceDirectory("Kha/Backends/Unity");

	var defines = [
		'no-root',
		'no-compilation',
		'sys_' + platform,
		'sys_g1', 'sys_g2', 'sys_g3', 'sys_g4',
		'sys_a1'
	];

	var options = {
		from: from.toString(),
		to: path.join(this.sysdir(), 'Assets', 'Sources'),
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

	Files.removeDirectory(this.directory.resolve(Paths.get(this.sysdir(), "Assets", "Sources")));

	var self = this;
	Haxe.executeHaxe(this.directory, haxeDirectory, ['project-' + this.sysdir() + '.hxml'], function () {
		var copyDirectory = function (from, to) {
			var files = fs.readdirSync(path.join(__dirname, 'Data', 'unity', from));
			self.createDirectory(self.directory.resolve(Paths.get(self.sysdir(), to)));
			for (var f in files) {
				var file = files[f];
				var text = fs.readFileSync(path.join(__dirname, 'Data', 'unity', from, file), { encoding: 'utf8' });
				fs.writeFileSync(self.directory.resolve(Paths.get(self.sysdir(), to, file)).toString(), text);
			}
		};
		copyDirectory('Assets', 'Assets');
		copyDirectory('Editor', 'Assets/Editor');
		copyDirectory('ProjectSettings', 'ProjectSettings');
		callback();
	});
};

UnityExporter.prototype.copyMusic = function (platform, from, to, encoders, callback) {
	callback([to]);
};

UnityExporter.prototype.copySound = function (platform, from, to, encoders, callback) {
	callback([to]);
};

UnityExporter.prototype.copyImage = function (platform, from, to, asset, callback) {
	exportImage(from, this.directory.resolve(this.sysdir()).resolve(Paths.get('Assets', 'Resources', 'Images', to)), asset, undefined, false, function (format) {
		callback([to + '.' + format]);
	}, true);
};

UnityExporter.prototype.copyBlob = function (platform, from, to, callback) {
	this.copyFile(from, this.directory.resolve(this.sysdir()).resolve(Paths.get('Assets', 'Resources', 'Blobs', to.toString() + '.bytes')));
	callback([to]);
};

UnityExporter.prototype.copyVideo = function (platform, from, to, encoders, callback) {
	callback([to]);
};

UnityExporter.prototype.copyFont = function (platform, from, to, asset, encoders, callback) {
	Files.createDirectories(this.directory.resolve(this.sysdir()).resolve(Paths.get('Assets', 'Resources', 'Blobs', to)).parent());
	Converter.convert(from, this.directory.resolve(this.sysdir()).resolve(Paths.get('Assets', 'Resources', 'Blobs', to + '.bytes')), encoders.kravur, function (success) {
		callback([to]);
	}, { size: asset.size });
};

module.exports = UnityExporter;
