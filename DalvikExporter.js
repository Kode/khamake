var fs = require('fs-extra');
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

function findIcon(from) {
	if (fs.existsSync(path.join(from.toString(), 'icon.png'))) return path.join(from.toString(), 'icon.png');
	else return path.join(__dirname, '..', '..', 'Kore', 'Tools', 'kraffiti', 'ball.png');
}

function DalvikExporter(khaDirectory, directory) {
	KhaExporter.call(this, khaDirectory);
	this.directory = directory;
	this.addSourceDirectory(path.join(khaDirectory.toString(), 'Backends/Android'));
}

DalvikExporter.prototype = Object.create(KhaExporter.prototype);
DalvikExporter.constructor = DalvikExporter;

DalvikExporter.prototype.sysdir = function () {
	return 'dalvik';
};

DalvikExporter.prototype.backend = function () {
	return "Android";
};

DalvikExporter.prototype.exportSolution = function (name, platform, khaDirectory, haxeDirectory, from, callback) {
	var safename = name.replaceAll(' ', '-');

	var defines = [
		'no-compilation',
		'sys_' + platform,
		'sys_g1', 'sys_g2', 'sys_g3', 'sys_g4',
		'sys_a1'
	];

	var options = {
		from: from.toString(),
		to: path.join(this.sysdir(), safename),
		sources: this.sources,
		defines: defines,
		haxeDirectory: haxeDirectory.toString(),
		system: this.sysdir(),
		language: 'java',
		width: this.width,
		height: this.height,
		name: name
	};
	HaxeProject(this.directory.toString(), options);

	this.exportAndroidStudioProject(name);

	Haxe.executeHaxe(this.directory, haxeDirectory, ['project-' + this.sysdir() + '.hxml'], callback);
};

DalvikExporter.prototype.exportAndroidStudioProject = function (name) {
	var safename = name.replaceAll(' ', '-');
	this.safename = safename;

	var indir = path.join(__dirname, 'Data', 'android');
	var outdir = path.join(this.directory.path, this.sysdir(), safename);

	fs.copySync(path.join(indir, 'build.gradle'), path.join(outdir, 'build.gradle'));
	fs.copySync(path.join(indir, 'gradle.properties'), path.join(outdir, 'gradle.properties'));
	fs.copySync(path.join(indir, 'gradlew'), path.join(outdir, 'gradlew'));
	fs.copySync(path.join(indir, 'gradlew.bat'), path.join(outdir, 'gradlew.bat'));
	fs.copySync(path.join(indir, 'settings.gradle'), path.join(outdir, 'settings.gradle'));

	var nameiml = fs.readFileSync(path.join(indir, 'name.iml'), { encoding: 'utf8' });
	nameiml = nameiml.replaceAll('{name}', safename);
	fs.writeFileSync(path.join(outdir, safename + '.iml'), nameiml, { encoding: 'utf8' });

	fs.copySync(path.join(indir, 'app', 'proguard-rules.pro'), path.join(outdir, 'app', 'proguard-rules.pro'));

	var gradle = fs.readFileSync(path.join(indir, 'app', 'build.gradle'), { encoding: 'utf8' });
	gradle = gradle.replaceAll('{name}', safename);
	fs.writeFileSync(path.join(outdir, 'app', 'build.gradle'), gradle, { encoding: 'utf8' });

	var appiml = fs.readFileSync(path.join(indir, 'app', 'app.iml'), { encoding: 'utf8' });
	appiml = appiml.replaceAll('{name}', safename);
	fs.writeFileSync(path.join(outdir, 'app', 'app.iml'), appiml, { encoding: 'utf8' });

	fs.ensureDirSync(path.join(outdir, 'app', 'src'));
	//fs.emptyDirSync(path.join(outdir, 'app', 'src'));

	fs.copySync(path.join(indir, 'main', 'AndroidManifest.xml'), path.join(outdir, 'app', 'src', 'main', 'AndroidManifest.xml'));
	fs.copySync(path.join(indir, 'main', 'res', 'values', 'styles.xml'), path.join(outdir, 'app', 'src', 'main', 'res', 'values', 'styles.xml'));

	var strings = fs.readFileSync(path.join(indir, 'main', 'res', 'values', 'strings.xml'), { encoding: 'utf8' });
	strings = strings.replaceAll('{name}', name);
	fs.writeFileSync(path.join(outdir, 'app', 'src', 'main', 'res', 'values', 'strings.xml'), strings, { encoding: 'utf8' });

	fs.ensureDirSync(path.join(outdir, 'app', 'src', 'main', 'res', 'mipmap-hdpi'));
	exportImage(findIcon(this.directory), this.directory.resolve(Paths.get(this.sysdir(), safename, 'app', 'src', 'main', 'res', 'mipmap-hdpi', "ic_launcher.png")), { width: 72, height: 72 });
	fs.ensureDirSync(path.join(outdir, 'app', 'src', 'main', 'res', 'mipmap-mdpi'));
	exportImage(findIcon(this.directory), this.directory.resolve(Paths.get(this.sysdir(), safename, 'app', 'src', 'main', 'res', 'mipmap-mdpi', "ic_launcher.png")), { width: 48, height: 48 });
	fs.ensureDirSync(path.join(outdir, 'app', 'src', 'main', 'res', 'mipmap-xhdpi'));
	exportImage(findIcon(this.directory), this.directory.resolve(Paths.get(this.sysdir(), safename, 'app', 'src', 'main', 'res', 'mipmap-xhdpi', "ic_launcher.png")), { width: 96, height: 96 });
	fs.ensureDirSync(path.join(outdir, 'app', 'src', 'main', 'res', 'mipmap-xxhdpi'));
	exportImage(findIcon(this.directory), this.directory.resolve(Paths.get(this.sysdir(), safename, 'app', 'src', 'main', 'res', 'mipmap-xxhdpi', "ic_launcher.png")), { width: 144, height: 144 });

	fs.copySync(path.join(indir, 'gradle', 'wrapper', 'gradle-wrapper.jar'), path.join(outdir, 'gradle', 'wrapper', 'gradle-wrapper.jar'));
	fs.copySync(path.join(indir, 'gradle', 'wrapper', 'gradle-wrapper.properties'), path.join(outdir, 'gradle', 'wrapper', 'gradle-wrapper.properties'));

	fs.copySync(path.join(indir, 'idea', 'compiler.xml'), path.join(outdir, '.idea', 'compiler.xml'));
	fs.copySync(path.join(indir, 'idea', 'encodings.xml'), path.join(outdir, '.idea', 'encodings.xml'));
	fs.copySync(path.join(indir, 'idea', 'gradle.xml'), path.join(outdir, '.idea', 'gradle.xml'));
	fs.copySync(path.join(indir, 'idea', 'misc.xml'), path.join(outdir, '.idea', 'misc.xml'));
	fs.copySync(path.join(indir, 'idea', 'runConfigurations.xml'), path.join(outdir, '.idea', 'runConfigurations.xml'));
	fs.copySync(path.join(indir, 'idea', 'vcs.xml'), path.join(outdir, '.idea', 'vcs.xml'));
	fs.copySync(path.join(indir, 'idea', 'copyright', 'profiles_settings.xml'), path.join(outdir, '.idea', 'copyright', 'profiles_settings.xml'));

	var namename = fs.readFileSync(path.join(indir, 'idea', 'name'), { encoding: 'utf8' });
	namename = namename.replaceAll('{name}', name);
	fs.writeFileSync(path.join(outdir, '.idea', '.name'), namename, { encoding: 'utf8' });

	var modules = fs.readFileSync(path.join(indir, 'idea', 'modules.xml'), { encoding: 'utf8' });
	modules = modules.replaceAll('{name}', safename);
	fs.writeFileSync(path.join(outdir, '.idea', 'modules.xml'), modules, { encoding: 'utf8' });
};

DalvikExporter.prototype.copyMusic = function (platform, from, to, encoders, callback) {
	Files.createDirectories(this.directory.resolve(this.sysdir()).resolve(to.toString()).parent());
	Converter.convert(from, this.directory.resolve(Paths.get(this.sysdir(), this.safename, 'app', 'src', 'main', 'assets', to.toString() + '.ogg')), encoders.oggEncoder, callback);
};

DalvikExporter.prototype.copySound = function (platform, from, to, encoders, callback) {
	this.copyFile(from, this.directory.resolve(Paths.get(this.sysdir(), this.safename, 'app', 'src', 'main', 'assets', to.toString() + '.wav')));
	callback();
};

DalvikExporter.prototype.copyImage = function (platform, from, to, asset, callback) {
	exportImage(from, this.directory.resolve(Paths.get(this.sysdir(), this.safename, 'app', 'src', 'main', 'assets')).resolve(to), asset, undefined, false, callback);
};

DalvikExporter.prototype.copyBlob = function (platform, from, to, callback) {
	this.copyFile(from, this.directory.resolve(Paths.get(this.sysdir(), this.safename, 'app', 'src', 'main', 'assets')).resolve(to));
	callback();
};

DalvikExporter.prototype.copyVideo = function (platform, from, to, encoders, callback) {
	callback();
};

module.exports = DalvikExporter;
