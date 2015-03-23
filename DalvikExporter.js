var JavaExporter = require('./JavaExporter.js');
var korepath = require('./korepath.js');
var Converter = require('./Converter.js');
var Files = require(korepath + 'Files.js');
var Haxe = require('./Haxe.js');
var Options = require('./Options.js');
var Paths = require(korepath + 'Paths.js');
var exportImage = require('./ImageTool.js');
var fs = require('fs');
var path = require('path');

function findIcon(from) {
	if (fs.existsSync(path.join(from.toString(), 'icon.png'))) return path.join(from.toString(), 'icon.png');
	else return path.join(__dirname, '..', '..', 'Kore', 'Tools', 'kraffiti', 'ball.png');
}

function DalvikExporter(directory) {
	JavaExporter.call(this);
	this.directory = directory;
};

DalvikExporter.prototype = Object.create(JavaExporter.prototype);
DalvikExporter.constructor = DalvikExporter;

DalvikExporter.prototype.sysdir = function () {
	return 'dalvik';
};

DalvikExporter.prototype.backend = function () {
	return "Android";
};

DalvikExporter.prototype.exportEclipseProject = function () {
	this.writeFile(this.directory.resolve(Paths.get(this.sysdir(), ".classpath")));
	this.p("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
	this.p("<classpath>");
		this.p("<classpathentry kind=\"src\" path=\"gen\"/>", 1);
		this.p("<classpathentry kind=\"src\" path=\"Sources/src\"/>", 1);
		this.p("<classpathentry kind=\"con\" path=\"com.android.ide.eclipse.adt.ANDROID_FRAMEWORK\"/>", 1);
		this.p("<classpathentry kind=\"output\" path=\"bin/classes\"/>", 1);
	this.p("</classpath>");
	this.closeFile();
		
	this.writeFile(this.directory.resolve(Paths.get(this.sysdir(), ".project")));
	this.p("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
	this.p("<projectDescription>");
		this.p("<name>" + this.getCurrentDirectoryName(this.directory) + "</name>", 1);
		this.p("<comment></comment>", 1);
		this.p("<projects>", 1);
		this.p("</projects>", 1);
		this.p("<buildSpec>", 1);
			this.p("<buildCommand>", 2);
				this.p("<name>com.android.ide.eclipse.adt.ResourceManagerBuilder</name>", 3);
				this.p("<arguments>", 3);
				this.p("</arguments>", 3);
			this.p("</buildCommand>", 2);
			this.p("<buildCommand>", 2);
				this.p("<name>com.android.ide.eclipse.adt.PreCompilerBuilder</name>", 3);
				this.p("<arguments>", 3);
				this.p("</arguments>", 3);
			this.p("</buildCommand>", 2);
			this.p("<buildCommand>", 2);
				this.p("<name>org.eclipse.jdt.core.javabuilder</name>", 3);
				this.p("<arguments>", 3);
				this.p("</arguments>", 3);
			this.p("</buildCommand>", 2);
			this.p("<buildCommand>", 2);
				this.p("<name>com.android.ide.eclipse.adt.ApkBuilder</name>", 3);
				this.p("<arguments>", 3);
				this.p("</arguments>", 3);
			this.p("</buildCommand>", 2);
		this.p("</buildSpec>", 1);
		this.p("<natures>", 1);
			this.p("<nature>com.android.ide.eclipse.adt.AndroidNature</nature>", 2);
			this.p("<nature>org.eclipse.jdt.core.javanature</nature>", 2);
		this.p("</natures>", 1);
	this.p("</projectDescription>");
	this.closeFile();
		
	this.writeFile(this.directory.resolve(Paths.get(this.sysdir(), "AndroidManifest.xml")));
	this.p("<?xml version=\"1.0\" encoding=\"utf-8\"?>");
	this.p("<manifest xmlns:android=\"http://schemas.android.com/apk/res/android\" package=\"kha.android\" android:versionCode=\"1\" android:versionName=\"1.0\">");
		this.p("<application android:icon=\"@drawable/icon\" android:label=\"@string/app_name\">", 1);
			this.p("<activity android:label=\"@string/app_name\" android:screenOrientation=\"landscape\" android:name=\"kha.android.Game\" android:theme=\"@android:style/Theme.NoTitleBar.Fullscreen\">", 2);
				this.p("<intent-filter>", 3);
					this.p("<action android:name=\"android.intent.action.MAIN\" />", 4);
					this.p("<category android:name=\"android.intent.category.LAUNCHER\" />", 4);
				this.p("</intent-filter>", 3);
			this.p("</activity>", 2);
		this.p("</application>", 1);
	this.p("</manifest>");
	this.closeFile();
		
	this.writeFile(this.directory.resolve(Paths.get(this.sysdir(), "proguard.cfg")));
	this.p("-optimizationpasses 5");
	this.p("-dontusemixedcaseclassnames");
	this.p("-dontskipnonpubliclibraryclasses");
	this.p("-dontpreverify");
	this.p("-verbose");
	this.p("-optimizations !code/simplification/arithmetic,!field/*,!class/merging/*");
	this.p();
	this.p("-keep public class * extends android.app.Activity");
	this.p("-keep public class * extends android.app.Application");
	this.p("-keep public class * extends android.app.Service");
	this.p("-keep public class * extends android.content.BroadcastReceiver");
	this.p("-keep public class * extends android.content.ContentProvider");
	this.p("-keep public class * extends android.app.backup.BackupAgentHelper");
	this.p("-keep public class * extends android.preference.Preference");
	this.p("-keep public class com.android.vending.licensing.ILicensingService");
	this.p();
	this.p("-keepclasseswithmembernames class * {");
		this.p("native <methods>;", 1);
	this.p("}");
	this.p();
	this.p("-keepclasseswithmembernames class * {");
		this.p("public <init>(android.content.Context, android.util.AttributeSet);", 1);
	this.p("}");
	this.p();
	this.p("-keepclasseswithmembernames class * {");
		this.p("public <init>(android.content.Context, android.util.AttributeSet, int);", 1);
	this.p("}");
	this.p();
	this.p("-keepclassmembers enum * {");
	this.p("public static **[] values();");
	this.p("public static ** valueOf(java.lang.String);");
	this.p("}");
	this.p();
	this.p("-keep class * implements android.os.Parcelable {");
		this.p("public static final android.os.Parcelable$Creator *;", 1);
	this.p("}");
	this.closeFile();
		
	this.writeFile(this.directory.resolve(Paths.get(this.sysdir(), "project.properties")));
	this.p("target=android-7");
	this.closeFile();
		
	this.createDirectory(this.directory.resolve(Paths.get(this.sysdir(), ".settings")));
		
	this.writeFile(this.directory.resolve(Paths.get(this.sysdir(), ".settings", "org.eclipse.jdt.core.prefs")));
	this.p("#Thu Oct 20 20:02:57 CEST 2011");
	this.p("eclipse.preferences.version=1");
	this.p("org.eclipse.jdt.core.compiler.codegen.inlineJsrBytecode=enabled");
	this.p("org.eclipse.jdt.core.compiler.codegen.targetPlatform=1.6");
	this.p("org.eclipse.jdt.core.compiler.codegen.unusedLocal=preserve");
	this.p("org.eclipse.jdt.core.compiler.compliance=1.6");
	this.p("org.eclipse.jdt.core.compiler.debug.lineNumber=generate");
	this.p("org.eclipse.jdt.core.compiler.debug.localVariable=generate");
	this.p("org.eclipse.jdt.core.compiler.debug.sourceFile=generate");
	this.p("org.eclipse.jdt.core.compiler.problem.assertIdentifier=error");
	this.p("org.eclipse.jdt.core.compiler.problem.enumIdentifier=error");
	this.p("org.eclipse.jdt.core.compiler.source=1.6");
	this.closeFile();

	this.createDirectory(this.directory.resolve(Paths.get(this.sysdir(), "res")));
	this.createDirectory(this.directory.resolve(Paths.get(this.sysdir(), "res", "drawable-hdpi")));
	this.createDirectory(this.directory.resolve(Paths.get(this.sysdir(), "res", "drawable-mdpi")));
	this.createDirectory(this.directory.resolve(Paths.get(this.sysdir(), "res", "drawable-ldpi")));
	
	exportImage(findIcon(this.directory), this.directory.resolve(Paths.get(this.sysdir(), "res", "drawable-hdpi", "icon.png")), { width: 72, height: 72 });
	exportImage(findIcon(this.directory), this.directory.resolve(Paths.get(this.sysdir(), "res", "drawable-mdpi", "icon.png")), { width: 48, height: 48 });
	exportImage(findIcon(this.directory), this.directory.resolve(Paths.get(this.sysdir(), "res", "drawable-ldpi", "icon.png")), { width: 36, height: 36 });
	
	this.createDirectory(this.directory.resolve(Paths.get(this.sysdir(), "res", "layout")));
	
	this.writeFile(this.directory.resolve(Paths.get(this.sysdir(), "res", "layout", "main.xml")));
	this.p("<?xml version=\"1.0\" encoding=\"utf-8\"?>");
	this.p("<LinearLayout xmlns:android=\"http://schemas.android.com/apk/res/android\" android:orientation=\"vertical\" android:layout_width=\"fill_parent\" android:layout_height=\"fill_parent\">");
		this.p("<TextView android:layout_width=\"fill_parent\" android:layout_height=\"wrap_content\" android:text=\"@string/hello\" />", 1);
	this.p("</LinearLayout>");
	this.closeFile();
	
	this.createDirectory(this.directory.resolve(Paths.get(this.sysdir(), "res", "values")));
	
	this.writeFile(this.directory.resolve(Paths.get(this.sysdir(), "res", "values", "strings.xml")));
	this.p("<?xml version=\"1.0\" encoding=\"utf-8\"?>");
	this.p("<resources>");
		this.p("<string name=\"hello\">Hello World!</string>", 1);
		this.p("<string name=\"app_name\">" + this.getCurrentDirectoryName(this.directory) + "</string>", 1);
	this.p("</resources>");
	this.closeFile();
	
	this.createDirectory(this.directory.resolve(Paths.get(this.sysdir(), "gen")));
};

DalvikExporter.prototype.copyMusic = function (platform, from, to, encoders, callback) {
	Files.createDirectories(this.directory.resolve(this.sysdir()).resolve(to.toString()).parent());
	Converter.convert(from, this.directory.resolve(Paths.get(this.sysdir(), "assets", to.toString() + ".ogg")), encoders.oggEncoder, callback);
};

DalvikExporter.prototype.copySound = function (platform, from, to, encoders, callback) {
	this.copyFile(from, this.directory.resolve(Paths.get(this.sysdir(), "assets", to.toString() + ".wav")));
	callback();
};

DalvikExporter.prototype.copyImage = function (platform, from, to, asset, callback) {
	exportImage(from, this.directory.resolve(Paths.get(this.sysdir(), "assets")).resolve(to), asset, undefined, false, callback());
};

DalvikExporter.prototype.copyBlob = function (platform, from, to, callback) {
	this.copyFile(from, this.directory.resolve(Paths.get(this.sysdir(), "assets")).resolve(to));
	callback();
};

DalvikExporter.prototype.copyVideo = function (platform, from, to, encoders, callback) {
	callback();
};

module.exports = DalvikExporter;
