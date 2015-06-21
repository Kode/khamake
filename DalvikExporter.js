var KhaExporter = require('./KhaExporter.js');
var korepath = require('./korepath.js');
var Converter = require('./Converter.js');
var Files = require(korepath + 'Files.js');
var Haxe = require('./Haxe.js');
var Options = require('./Options.js');
var Paths = require(korepath + 'Paths.js');
var exportImage = require('./ImageTool.js');
var fs = require('fs-extra');
var path = require('path');

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
	this.createDirectory(this.directory.resolve(this.sysdir()));

	this.writeFile(this.directory.resolve("project-" + this.sysdir() + ".hxproj"));
	this.p("<?xml version=\"1.0\" encoding=\"utf-8\"?>");
	this.p("<project version=\"2\">");
	this.p("<!-- Output SWF options -->", 1);
	this.p("<output>", 1);
	this.p("<movie outputType=\"Application\" />", 2);
	this.p("<movie input=\"\" />", 2);
	this.p('<movie path="' + this.sysdir() + '\\app\\src\\main\\java" />', 2);
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

	this.exportAndroidStudioProject(name);

	this.writeFile(this.directory.resolve("project-" + this.sysdir() + ".hxml"));
	for (var i = 0; i < this.sources.length; ++i) {
		if (path.isAbsolute(this.sources[i])) {
			this.p("-cp " + this.sources[i]);
		}
		else {
			this.p("-cp " + from.resolve('build').relativize(from.resolve(this.sources[i])).toString());
		}
	}
	this.p("-java " + path.join(this.sysdir(), 'app', 'src', 'main', 'java'));
	this.p("-main Main");
	this.p("-D no-compilation");
	this.p("-java-lib " + from.resolve('build').relativize(haxeDirectory).resolve(Paths.get("hxjava", "hxjava-std.jar")).toString());
	this.closeFile();

	var options = [];
	options.push("project-" + this.sysdir() + ".hxml");
	Haxe.executeHaxe(from, haxeDirectory, options, callback);
};

DalvikExporter.prototype.exportAndroidStudioProject = function (name) {
	var safename = name.replaceAll(' ', '-');

	var indir = path.join(__dirname, 'Data', 'android');
	var outdir = path.join(this.directory.path, this.sysdir());

	fs.copySync(path.join(indir, 'build.gradle'), path.join(outdir, 'build.gradle'));
	fs.copySync(path.join(indir, 'gradle.properties'), path.join(outdir, 'gradle.properties'));
	fs.copySync(path.join(indir, 'gradlew'), path.join(outdir, 'gradlew'));
	fs.copySync(path.join(indir, 'gradlew.bat'), path.join(outdir, 'gradlew.bat'));
	fs.copySync(path.join(indir, 'settings.gradle'), path.join(outdir, 'settings.gradle'));

	var nameiml = fs.readFileSync(path.join(indir, 'name.iml'), { encoding: 'utf8' });
	nameiml = nameiml.replaceAll('{name}', safename);
	fs.writeFileSync(path.join(outdir, safename + '.iml'), nameiml, { encoding: 'utf8' });

	fs.copySync(path.join(indir, 'app', 'build.gradle'), path.join(outdir, 'app', 'build.gradle'));
	fs.copySync(path.join(indir, 'app', 'proguard-rules.pro'), path.join(outdir, 'app', 'proguard-rules.pro'));

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
	exportImage(findIcon(this.directory), this.directory.resolve(Paths.get(this.sysdir(), 'app', 'src', 'main', 'res', 'mipmap-hdpi', "ic_launcher.png")), { width: 72, height: 72 });
	fs.ensureDirSync(path.join(outdir, 'app', 'src', 'main', 'res', 'mipmap-mdpi'));
	exportImage(findIcon(this.directory), this.directory.resolve(Paths.get(this.sysdir(), 'app', 'src', 'main', 'res', 'mipmap-mdpi', "ic_launcher.png")), { width: 48, height: 48 });
	fs.ensureDirSync(path.join(outdir, 'app', 'src', 'main', 'res', 'mipmap-xhdpi'));
	exportImage(findIcon(this.directory), this.directory.resolve(Paths.get(this.sysdir(), 'app', 'src', 'main', 'res', 'mipmap-xhdpi', "ic_launcher.png")), { width: 96, height: 96 });
	fs.ensureDirSync(path.join(outdir, 'app', 'src', 'main', 'res', 'mipmap-xxhdpi'));
	exportImage(findIcon(this.directory), this.directory.resolve(Paths.get(this.sysdir(), 'app', 'src', 'main', 'res', 'mipmap-xxhdpi', "ic_launcher.png")), { width: 144, height: 144 });

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
	Converter.convert(from, this.directory.resolve(Paths.get(this.sysdir(), 'app', 'src', 'main', 'assets', to.toString() + '.ogg')), encoders.oggEncoder, callback);
};

DalvikExporter.prototype.copySound = function (platform, from, to, encoders, callback) {
	this.copyFile(from, this.directory.resolve(Paths.get(this.sysdir(), 'app', 'src', 'main', 'assets', to.toString() + '.wav')));
	callback();
};

DalvikExporter.prototype.copyImage = function (platform, from, to, asset, callback) {
	exportImage(from, this.directory.resolve(Paths.get(this.sysdir(), 'app', 'src', 'main', 'assets')).resolve(to), asset, undefined, false, callback);
};

DalvikExporter.prototype.copyBlob = function (platform, from, to, callback) {
	this.copyFile(from, this.directory.resolve(Paths.get(this.sysdir(), 'app', 'src', 'main', 'assets')).resolve(to));
	callback();
};

DalvikExporter.prototype.copyVideo = function (platform, from, to, encoders, callback) {
	callback();
};

module.exports = DalvikExporter;
