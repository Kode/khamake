var os = require('os');
var korepath = require('./korepath.js');
var Files = require(korepath + 'Files.js');
var Path = require(korepath + 'Path.js');
var Paths = require(korepath + 'Paths.js');
var Platform = require('./Platform.js');

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

var haxeDirectory = '';
var oggEncoder = '';
var aacEncoder = '';
var mp3Encoder = '';
var h264Encoder = '';
var webmEncoder = '';
var wmvEncoder = '';
var kfx = '';
var khafolders = true;
var embedflashassets = false;

for (var i = 2; i < args.length; ++i) {
	var arg = args[i];
	
	if (arg === 'pch') Options.precompiledHeaders = true;
	else if (arg.startsWith('intermediate=')) Options.setIntermediateDrive(arg.substr(13));
	else if (arg.startsWith('gfx=')) Options.setGraphicsApi(arg.substr(4));
	else if (arg.startsWith("vs=")) Options.setVisualStudioVersion(arg.substr(3));
	else if (arg.startsWith("haxe=")) haxeDirectory = arg.substr(5);
	else if (arg.startsWith("ogg=")) oggEncoder = arg.substr(4);
	else if (arg.startsWith("aac=")) aacEncoder = arg.substr(4);
	else if (arg.startsWith("mp3=")) mp3Encoder = arg.substr(4);
	else if (arg.startsWith("h264=")) h264Encoder = arg.substr(5);
	else if (arg.startsWith("webm=")) webmEncoder = arg.substr(5);
	else if (arg.startsWith("wmv=")) wmvEncoder = arg.substr(4);
	else if (arg.startsWith("kfx=")) kfx = arg.substr(4);

	else if (arg.startsWith("from=")) from = arg.substr(5);
	else if (arg.startsWith("to=")) to = arg.substr(3);

	else if (arg === 'nokhafolders') khafolders = false;
	else if (arg === 'embedflashassets') embedflashassets = true;
	else if (arg === 'nocompile') Options.setCompilation(false);

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
		haxe: haxeDirectory,
		ogg: oggEncoder,
		aac: aacEncoder,
		mp3: mp3Encoder,
		h264: h264Encoder, 
		webm: webmEncoder,
		wmv: wmvEncoder,
		kfx: kfx,
		khafolders: khafolders,
		embedflashassets: embedflashassets
	},
	{
		info: console.log,
		error: console.log
	},
	function (name) { }
);
