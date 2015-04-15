var os = require('os');
var korepath = require('./korepath.js');
var Files = require(korepath + 'Files.js');
var GraphicsApi = require('./GraphicsApi.js');
var Options = require('./Options.js');
var Path = require(korepath + 'Path.js');
var Paths = require(korepath + 'Paths.js');
var Platform = require('./Platform.js');
var VisualStudioVersion = require('./VisualStudioVersion.js');

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

var args = process.argv;

var from = ".";
var to = "build";

if (os.platform() === "linux") {
	var platform = Platform.Linux;
}
else if (os.platform() === "win32") {
	var platform = Platform.Windows;
}
else {
	var platform = Platform.OSX;
}

var khaDirectory = '';
var haxeDirectory = '';
var oggEncoder = '';
var aacEncoder = '';
var mp3Encoder = '';
var h264Encoder = '';
var theoraEncoder = '';
var webmEncoder = '';
var wmvEncoder = '';
var kfx = '';
var khafolders = true;
var embedflashassets = false;
var gfx = GraphicsApi.Direct3D9;
var vs = VisualStudioVersion.VS2013;
var compile = false;
var run = false;

for (var i = 2; i < args.length; ++i) {
	var arg = args[i];
	
	if (arg === 'pch') Options.precompiledHeaders = true;
	else if (arg.startsWith('intermediate=')) Options.intermediateDrive = arg.substr(13);
	else if (arg.startsWith('gfx=')) gfx = arg.substr(4);
	else if (arg.startsWith("vs=")) vs = arg.substr(3);
	else if (arg.startsWith("kha=")) khaDirectory = arg.substr(4);
	else if (arg.startsWith("haxe=")) haxeDirectory = arg.substr(5);
	else if (arg.startsWith("ogg=")) oggEncoder = arg.substr(4);
	else if (arg.startsWith("aac=")) aacEncoder = arg.substr(4);
	else if (arg.startsWith("mp3=")) mp3Encoder = arg.substr(4);
	else if (arg.startsWith("h264=")) h264Encoder = arg.substr(5);
	else if (arg.startsWith("webm=")) webmEncoder = arg.substr(5);
	else if (arg.startsWith("wmv=")) wmvEncoder = arg.substr(4);
	else if (arg.startsWith("theora=")) theoraEncoder = arg.substr(7);
	else if (arg.startsWith("kfx=")) kfx = arg.substr(4);

	else if (arg.startsWith("from=")) from = arg.substr(5);
	else if (arg.startsWith("to=")) to = arg.substr(3);

	else if (arg === 'nokhafolders') khafolders = false;
	else if (arg === 'embedflashassets') embedflashassets = true;
	else if (arg === 'nocompile') Options.compile = false;

	else if (arg === 'compile') compile = true;
	else if (arg === 'run') {
		compile = true;
		run = true;
	}

	else {
		for (p in Platform) {
			if (arg === Platform[p]) {
				platform = Platform[p];
			}
		}
	}
}

require('./main.js').run(
	{
		from: from,
		to: to,
		platform: platform,
		kha: khaDirectory,
		haxe: haxeDirectory,
		ogg: oggEncoder,
		aac: aacEncoder,
		mp3: mp3Encoder,
		h264: h264Encoder, 
		webm: webmEncoder,
		wmv: wmvEncoder,
		theora: theoraEncoder,
		kfx: kfx,
		khafolders: khafolders,
		embedflashassets: embedflashassets,
		graphicsApi: gfx,
		visualStudioVersion: vs,
		compile: compile,
		run: run
	},
	{
		info: console.log,
		error: console.log
	},
	function (name) { }
);
