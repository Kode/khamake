var child_process = require('child_process');
var fs = require('fs');
var os = require('os');
var korepath = require('./korepath.js');
var log = require('./log.js');
var Files = require(korepath + 'Files.js');
var GraphicsApi = require('./GraphicsApi.js');
var Options = require('./Options.js');
var Path = require(korepath + 'Path.js');
var Paths = require(korepath + 'Paths.js');
var Platform = require('./Platform.js');
var VisualStudioVersion = require('./VisualStudioVersion.js');

var DalvikExporter = require('./DalvikExporter.js');
var FlashExporter = require('./FlashExporter.js');
var Html5Exporter = require('./Html5Exporter.js');
var JavaExporter = require('./JavaExporter.js');
var KoreExporter = require('./KoreExporter.js');
var PlayStationMobileExporter = require('./PlayStationMobileExporter.js');
var WpfExporter = require('./WpfExporter.js');
var XnaExporter = require('./XnaExporter.js');

if (!String.prototype.startsWith) {
	Object.defineProperty(String.prototype, 'startsWith', {
		enumerable: false,
		configurable: false,
		writable: false,
		value: function (searchString, position) {
			position = position || 0;
			return this.indexOf(searchString, position) === position;
		}
	});
}

if (!String.prototype.endsWith) {
	Object.defineProperty(String.prototype, 'endsWith', {
		enumerable: false,
		configurable: false,
		writable: false,
		value: function (searchString, position) {
			position = position || this.length;
			position = position - searchString.length;
			var lastIndex = this.lastIndexOf(searchString);
			return lastIndex !== -1 && lastIndex === position;
		}
	});
}

function escapeRegExp(string) {
	return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

String.prototype.replaceAll = function (find, replace) {
	return this.replace(new RegExp(escapeRegExp(find), 'g'), replace);
};

function compileShader(kfx, type, from, to, temp) {
	if (kfx !== '') {
		var kfx_process = child_process.spawn(kfx, [type, from.toString(), to.toString(), temp.toString()]);

		kfx_process.stdout.on('data', function (data) {
			if (data.toString().trim() !== '') log.info('kfx stdout: ' + data);
		});

		kfx_process.stderr.on('data', function (data) {
			if (data.toString().trim() !== '') log.info('kfx stderr: ' + data);
		});
		
		kfx_process.on('error', function (err) {
			log.error('kfx error: ' + err);
		});

		kfx_process.on('close', function (code) {
			if (code !== 0) log.info('kfx process exited with code ' + code);
		});
	}
}

function addShader(project, name, extension) {
	project.shaders.push({file: name + extension, name: name});
}

function addShaders(exporter, platform, project, to, temp, shaderPath, kfx) {
	if (!Files.isDirectory(shaderPath)) return;
	var shaders = Files.newDirectoryStream(shaderPath);
	for (var s in shaders) {
		var shader = shaders[s];
		var name = shader;
		if (!name.endsWith('.glsl')) continue;
		name = name.substr(0, name.lastIndexOf('.'));
		switch (platform) {
			case Platform.Flash: {
				if (Files.exists(shaderPath.resolve(name + '.agal'))) Files.copy(shaderPath.resolve(name + '.agal'), to.resolve(name + '.agal'), true);
				else compileShader(kfx, 'agal', shaderPath.resolve(name + '.glsl'), to.resolve(name + '.agal'), temp);
				addShader(project, name, '.agal');
				exporter.addShader(name + '.agal');
				break;
			}
			case Platform.HTML5:
			case Platform.Android:
			case Platform.Tizen:
			case Platform.iOS: {
				if (Files.exists(shaderPath.resolve(name + ".essl"))) Files.copy(shaderPath.resolve(name + ".essl"), to.resolve(name + ".essl"), true);
				else compileShader(kfx, "essl", shaderPath.resolve(name + '.glsl'), to.resolve(name + ".essl"), temp);
				addShader(project, name, ".essl");
				break;
			}
			case Platform.Windows: {
				if (Options.graphicsApi == GraphicsApi.OpenGL || Options.graphicsApi == GraphicsApi.OpenGL2) {
					if (kfx == "") Files.copy(shaderPath.resolve(name + ".glsl"), to.resolve(name + ".glsl"), true);
					else compileShader(kfx, "glsl", shaderPath.resolve(name + '.glsl'), to.resolve(name + ".glsl"), temp);
					addShader(project, name, ".glsl");
				}
				else if (Options.graphicsApi == GraphicsApi.Direct3D11) {
					if (Files.exists(shaderPath.resolve(name + ".d3d11"))) Files.copy(shaderPath.resolve(name + ".d3d11"), to.resolve(name + ".d3d11"), true);
					else compileShader(kfx, "d3d11", shaderPath.resolve(name + '.glsl'), to.resolve(name + ".d3d11"), temp);
					addShader(project, name, ".d3d11");
				}
				else {
					if (Files.exists(shaderPath.resolve(name + ".d3d9"))) Files.copy(shaderPath.resolve(name + ".d3d9"), to.resolve(name + ".d3d9"), true);
					else compileShader(kfx, "d3d9", shaderPath.resolve(name + '.glsl'), to.resolve(name + ".d3d9"), temp);
					addShader(project, name, ".d3d9");
				}
				break;
			}
			case Platform.Xbox360:
			case Platform.PlayStation3: {
				if (Files.exists(shaderPath.resolve(name + ".d3d9"))) Files.copy(shaderPath.resolve(name + ".d3d9"), to.resolve(name + ".d3d9"), true);
				else compileShader(kfx, "d3d9", shaderPath.resolve(name + '.glsl'), to.resolve(name + ".d3d9"), temp);
				addShader(project, name, ".d3d9");
				break;
			}
			case Platform.OSX:
			case Platform.Linux: {
				if (kfx == "") Files.copy(shaderPath.resolve(name + ".glsl"), to.resolve(name + ".glsl"), true);
				else compileShader(kfx, "glsl", shaderPath.resolve(name + '.glsl'), to.resolve(name + ".glsl"), temp);
				addShader(project, name, ".glsl");
				break;
			}
			default:
				break;
		}
	}
}

function exportKhaProject(from, to, platform, haxeDirectory, oggEncoder, aacEncoder, mp3Encoder, h264Encoder, webmEncoder, wmvEncoder, kfx, khafolders, embedflashassets, callback) {
	log.info('Generating Kha project.');
	
	Files.createDirectories(to);
	var temp = to.resolve('temp');
	Files.createDirectories(temp);
	
	var exporter = null;
	var kore = false;
	switch (platform) {
		case Platform.Flash:
			exporter = new FlashExporter(to, embedflashassets);
			break;
		case Platform.HTML5:
			exporter = new Html5Exporter(to);
			break;
		case Platform.WPF:
			exporter = new WpfExporter(to);
			break;
		case Platform.XNA:
			exporter = new XnaExporter(to);
			break;
		case Platform.Java:
			exporter = new JavaExporter(to);
			break;
		case Platform.PlayStationMobile:
			exporter = new PlayStationMobileExporter(to);
			break;
		case Platform.Dalvik:
			exporter = new DalvikExporter(to);
			break;
		default:
			kore = true;
			exporter = new KoreExporter(platform, to);
			break;
	}

	Files.createDirectories(to.resolve(exporter.sysdir()));
	
	var name = '';
	var sources = [];
	if (Files.exists(from.resolve('project.kha'))) {
		var project = JSON.parse(fs.readFileSync(from.resolve('project.kha').toString(), { encoding: 'utf8' }));

		name = project.game.name;
		exporter.setWidthAndHeight(project.game.width, project.game.height);

		if (project.sources !== undefined) {
			for (var i = 0; i < project.sources.length; ++i) {
				sources.push(project.sources[i]);
			}
		}

		for (var i = 0; i < project.assets.length; ++i) {
			var asset = project.assets[i];
			if (asset.type === 'image') {
				var file;
				if (khafolders) file = from.resolve(Paths.get('Assets', 'Graphics', asset.file));
				else file = from.resolve(asset.file);
				exporter.copyImage(platform, file, Paths.get(asset.file), asset);
			}
			else if (asset.type === 'music') {
				var file;
				if (khafolders) file = from.resolve(Paths.get('Assets', 'Sound', asset.file + '.wav'));
				else file = from.resolve(asset.file + '.wav');
				exporter.copyMusic(platform, file, Paths.get(asset.file), oggEncoder, aacEncoder, mp3Encoder);
			}
			else if (asset.type === 'sound') {
				var file;
				if (khafolders) file = from.resolve(Paths.get('Assets', 'Sound', asset.file + '.wav'));
				else file = from.resolve(asset.file + '.wav');
				exporter.copySound(platform, file, Paths.get(asset.file), oggEncoder, aacEncoder, mp3Encoder);
			}
			else if (asset.type === 'blob') {
				var file;
				if (khafolders) file = from.resolve(Paths.get('Assets', asset.file));
				else file = from.resolve(asset.file);
				exporter.copyBlob(platform, file, Paths.get(asset.file));
			}
			else if (asset.type === 'video') {
				var file;
				if (khafolders) file = from.resolve(Paths.get('Assets', 'Video', asset.file));
				else file = from.resolve(asset.file);
				exporter.copyVideo(platform, file, Paths.get(asset.file), h264Encoder, webmEncoder, wmvEncoder);
			}
		}
		
		project.shaders = [];
		addShaders(exporter, platform, project, to.resolve(exporter.sysdir()), temp, from.resolve(Paths.get('Sources', 'Shaders')), kfx);
		addShaders(exporter, platform, project, to.resolve(exporter.sysdir()), temp, from.resolve(Paths.get('Kha', 'Sources', 'Shaders')), kfx);
		for (var i = 0; i < sources.length; ++i) {
			addShaders(exporter, platform, project, to.resolve(exporter.sysdir()), temp, from.resolve(sources[i]), kfx);
			exporter.addSourceDirectory(sources[i]);
		}
		
		fs.writeFileSync(temp.resolve('project.kha').toString(), JSON.stringify(project, null, '\t'), { encoding: 'utf8' });
		exporter.copyBlob(platform, temp.resolve('project.kha'), Paths.get('project.kha'));
	}

	if (name === '') name = from.toAbsolutePath().getFileName();

	if (haxeDirectory.path !== '') exporter.exportSolution(name, platform, haxeDirectory, from, function () {
		if (haxeDirectory.path !== '' && kore) {
			{
				var out = '';
				out += "var solution = new Solution('" + name + "');\n";
				out += "var project = new Project('" + name + "');\n";
				var files = [];
				files.push("Kha/Backends/kxcpp/src/**.h");
				files.push("Kha/Backends/kxcpp/src/**.cpp");
				files.push("Kha/Backends/kxcpp/include/**.h");
				//"Kha/Backends/kxcpp/project/libs/nekoapi/**.cpp"
				files.push("Kha/Backends/kxcpp/project/libs/common/**.h");
				files.push("Kha/Backends/kxcpp/project/libs/common/**.cpp");
				if (platform == Platform.Windows) files.push("Kha/Backends/kxcpp/project/libs/msvccompat/**.cpp");
				if (platform == Platform.Linux) files.push("Kha/Backends/kxcpp/project/libs/linuxcompat/**.cpp");
				files.push("Kha/Backends/kxcpp/project/libs/regexp/**.h");
				files.push("Kha/Backends/kxcpp/project/libs/regexp/**.cpp");
				files.push("Kha/Backends/kxcpp/project/libs/std/**.h");
				files.push("Kha/Backends/kxcpp/project/libs/std/**.cpp");
				//"Kha/Backends/kxcpp/project/libs/zlib/**.cpp"
				files.push("Kha/Backends/kxcpp/project/thirdparty/pcre-7.8/**.h");
				files.push("Kha/Backends/kxcpp/project/thirdparty/pcre-7.8/**.c");
				//"Kha/Backends/kxcpp/project/thirdparty/pcre-7.8/**.cc"
				files.push("Kha/Backends/Kore/*.cpp");
				files.push("Kha/Backends/Kore/*.h");
				files.push((from.relativize(to.resolve(exporter.sysdir() + "-build")).toString() + "/Sources/**.h").replaceAll('\\', '/'));
				files.push((from.relativize(to.resolve(exporter.sysdir() + "-build")).toString() + "/Sources/**.cpp").replaceAll('\\', '/'));
				out += "project.addFiles(";
				out += "'" + files[0] + "'";
				for (var i = 1; i < files.length; ++i) {
					out += ", '" + files[i] + "'";
				}
				out += ");\n";
				out += "project.addExcludes('Kha/Backends/kxcpp/project/thirdparty/pcre-7.8/dftables.c', " 
				+ "'Kha/Backends/kxcpp/project/thirdparty/pcre-7.8/pcredemo.c', " 
				+ "'Kha/Backends/kxcpp/project/thirdparty/pcre-7.8/pcregrep.c', " 
				+ "'Kha/Backends/kxcpp/project/thirdparty/pcre-7.8/pcretest.c', " 
				+ "'Kha/Backends/kxcpp/src/ExampleMain.cpp', " 
				+ "'Kha/Backends/kxcpp/src/hx/Scriptable.cpp', " 
				+ "'Kha/Backends/kxcpp/src/hx/Cppia.cpp', " 
				+ "'Kha/Backends/kxcpp/src/hx/CppiaBuiltin.cpp', " 
				+ "'**/src/__main__.cpp', " 
				+ "'Kha/Backends/kxcpp/src/hx/NekoAPI.cpp');\n";
				out += "project.addIncludeDirs('Kha/Backends/kxcpp/include', '" + from.relativize(to.resolve(exporter.sysdir() + "-build")).toString().replaceAll('\\', '/') + "/Sources/include', " 
				+ "'Kha/Backends/kxcpp/project/thirdparty/pcre-7.8', 'Kha/Backends/kxcpp/project/libs/nekoapi');\n";
				out += "project.setDebugDir('" + from.relativize(to.resolve(exporter.sysdir())).toString().replaceAll('\\', '/') + "');\n";
				if (platform == Platform.Windows) out += "project.addDefine('HX_WINDOWS');\n";
				if (platform == Platform.WindowsRT) out += "project.addDefine('HX_WINRT');\n";
				if (platform == Platform.OSX) {
					out += "project.addDefine('HXCPP_M64');\n";
					out += "project.addDefine('HX_MACOS');\n";
				}
				if (platform == Platform.Linux) out += "project.addDefine('HX_LINUX');\n";
				if (platform == Platform.iOS) out += "project.addDefine('IPHONE');\n";
				if (platform == Platform.Android) out += "project.addDefine('ANDROID');\n";
				if (platform == Platform.OSX) out += "project.addDefine('KORE_DEBUGDIR=\"osx\"');\n";
				if (platform == Platform.iOS) out += "project.addDefine('KORE_DEBUGDIR=\"ios\"');\n";
				//out << "project:addDefine(\"HXCPP_SCRIPTABLE\")\n";
				out += "project.addDefine('STATIC_LINK');\n";
				out += "project.addDefine('PCRE_STATIC');\n";
				out += "project.addDefine('HXCPP_SET_PROP');\n";
				out += "project.addDefine('HXCPP_VISIT_ALLOCS');\n";
				out += "project.addDefine('KORE');\n";
				out += "project.addDefine('ROTATE90');\n";
				if (platform === Platform.Windows) {
					out += "project.addDefine('_WINSOCK_DEPRECATED_NO_WARNINGS');\n";
					out += "project.addLib('ws2_32');\n";
				}
				out += "project.addSubProject(Solution.createProject('Kha/Kore'));\n";
				if (Files.exists(from.resolve("KoreVideo"))) out += "project.addSubProject(Solution.createProject('KoreVideo'));\n";
				out += "solution.addProject(project);\n";
				out += 'return solution;\n';
				fs.writeFileSync(from.resolve("korefile.js").toString(), out);
			}
			
			//exportKoreProject(directory);
			
			if (os.platform() === "linux") {
				var kake = from.resolve(Paths.get("Kha", "Kore", "Tools", "kake", "kake-linux"));
			}
			else if (os.platform() === "win32") {
				var kake = from.resolve(Paths.get("Kha", "Kore", "Tools", "kake", "kake.exe"));
			}
			else {
				var kake = from.resolve(Paths.get("Kha", "Kore", "Tools", "kake", "kake-osx"));
			}
			
			var gfx = "unknown";
			switch (Options.graphicsApi) {
				case GraphicsApi.OpenGL:
					gfx = "opengl";
					break;
				case GraphicsApi.OpenGL2:
					gfx = "opengl2";
					break;
				case GraphicsApi.Direct3D9:
					gfx = "direct3d9";
					break;
				case GraphicsApi.Direct3D11:
					gfx = "direct3d11";
					break;
			}
			
			var vs = "unknown";
			switch (Options.visualStudioVersion) {
				case VisualStudioVersion.VS2010:
					vs = "vs2010";
					break;
				case VisualStudioVersion.VS2012:
					vs = "vs2012";
					break;
				case VisualStudioVersion.VS2013:
					vs = "vs2013";
					break;
			}
			
			{
				var exe = kake.toString();
				var options = [];
				options.push(platform);
				//+ " pch=" + Options::getPrecompiledHeaders()
				if (Options.intermediateDrive !== "") options.push("intermediate=" + Options.intermediateDrive);
				options.push("gfx=" + gfx);
				options.push("vs=" + vs);
				if (from.toString() != ".") options.push("from=" + from.toString());
				options.push("to=" + to.resolve(Paths.get(exporter.sysdir() + "-build")).toString());
				require(korepath + 'main.js').run(
				{
					from: from,
					to: to.resolve(Paths.get(exporter.sysdir() + "-build")).toString(),
					platform: platform,
					graphicsApi: Options.graphicsApi,
					visualStudioVersion: Options.visualStudioVersion
				},
				{
					info: log.info,
					error: log.error
				},
				function () {
					log.info('Done.');
					callback(name);
				});
			}
		}
		else {
			log.info('Done.');
			callback(name);
		}
	});
}

function isKhaProject(directory) {
	return Files.exists(directory.resolve('Kha')) || Files.exists(directory.resolve('project.kha'));
}

function exportProject(from, to, platform, haxeDirectory, oggEncoder, aacEncoder, mp3Encoder, h264Encoder, webmEncoder, wmvEncoder, kfx, khafolders, embedflashassets, callback) {
	if (isKhaProject(from)) {
		exportKhaProject(from, to, platform, haxeDirectory, oggEncoder, aacEncoder, mp3Encoder, h264Encoder, webmEncoder, wmvEncoder, kfx, khafolders, embedflashassets, callback);
	}
	else {
		log.error('Kha directory not found.');
		callback('Unknown');
	}
}

exports.api = 1;

exports.run = function (options, loglog, callback) {
	log.set(loglog);

	if (options.haxe === '') {
		var path = Paths.get(options.from).resolve(Paths.get('Kha', 'Tools', 'haxe'));
		if (Files.isDirectory(path)) options.haxe = path.toString();
	}
	
	if (options.kfx === '') {
		if (os.platform() === "linux") {
			var path = Paths.get(options.from).resolve(Paths.get("Kha", "Kore", "Tools", "kfx", "kfx-linux"));
		}
		else if (os.platform() === "win32") {
			var path = Paths.get(options.from).resolve(Paths.get('Kha', 'Kore', 'Tools', 'kfx', 'kfx.exe'));
		}
		else {
			var path = Paths.get(options.from).resolve(Paths.get("Kha", "Kore", "Tools", "kfx", "kfx-osx"));
		}
		if (Files.exists(path)) options.kfx = path.toString();
	}
	
	if (options.ogg === '') {
		if (os.platform() === "linux") {
			var path = Paths.get(options.from).resolve(Paths.get("Kha", "Tools", "oggenc-linux"));
		}
		else if (os.platform() === "win32") {
			var path = Paths.get(options.from).resolve(Paths.get('Kha', 'Tools', 'oggenc2.exe'));
		}
		else {
			var path = Paths.get(options.from).resolve(Paths.get("Kha", "Tools", "oggenc-osx"));
		}
		if (Files.exists(path)) options.ogg = path.toString() + ' {in} -o {out}';
	}
	
	if (options.graphicsApi !== undefined) {
		Options.graphicsApi = options.graphicsApi;
	}
	
	if (options.visualStudioVersion !== undefined) {
		Options.visualStudioVersion = options.visualStudioVersion;	
	}

	exportProject(Paths.get(options.from), Paths.get(options.to), options.platform, Paths.get(options.haxe), options.ogg, options.aac, options.mp3, options.h264, options.webm, options.wmv, options.kfx, options.khafolders, options.embedflashassets, callback);
};
