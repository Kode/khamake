var version = Number(process.version.match(/^v(\d+\.\d+)/)[1]);

if (version < 0.12) {
	console.log('Sorry, this requires at least node version 0.12.');
	process.exit(1);
}

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

var fs = require('fs');
var os = require('os');
var path = require('path');
var exec = require('./exec.js');
var korepath = require('./korepath.js');
var Files = require(path.join(korepath.get(), 'Files.js'));
var GraphicsApi = require('./GraphicsApi.js');
var VrApi = require('./VrApi.js');
var Options = require('./Options.js');
var Path = require(path.join(korepath.get(), 'Path.js'));
var Paths = require(path.join(korepath.get(), 'Paths.js'));
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

var defaultTarget;
if (os.platform() === "linux") {
	defaultTarget = Platform.Linux;
}
else if (os.platform() === "win32") {
	defaultTarget = Platform.Windows;
}
else {
	defaultTarget = Platform.OSX;
}

var options = [
	{
		full: 'from',
		value: true,
		description: 'Location of your project',
		default: '.'
	},
	{
		full: 'to',
		value: true,
		description: 'Build location',
		default: 'build'
	},
	{
		full: 'target',
		short: 't',
		value: true,
		description: 'Target platform',
		default: defaultTarget
	},
	{
		full: 'vr',
		value: true,
		description: 'Target VR device',
		default: VrApi.None
	},
	{
		full: 'pch',
		description: 'Use precompiled headers for C++ targets',
		value: false,
		hidden: true
	},
	{
		full: 'intermediate',
		description: 'Intermediate location for object files.',
		value: true,
		default: '',
		hidden: true
	},
	{
		full: 'graphics',
		short: 'g',
		description: 'Graphics api to use',
		value: true,
		default: GraphicsApi.Direct3D9
	},
	{
		full: 'visualstudio',
		short: 'v',
		description: 'Version of Visual Studio to use',
		value: true,
		default: VisualStudioVersion.VS2013
	},
	{
		full: 'kha',
		short: 'k',
		description: 'Location of Kha directory',
		value: true,
		default: ''
	},
	{
		full: 'haxe',
		short: 'h',
		description: 'Location of Haxe directory',
		value: true,
		default: ''
	},
	{
		full: 'ogg',
		description: 'Argument line for ogg encoder',
		value: true,
		default: ''
	},
	{
		full: 'aac',
		description: 'Argument line for aac encoder',
		value: true,
		default: ''
	},
	{
		full: 'mp3',
		description: 'Argument line for mp3 encoder',
		value: true,
		default: ''
	},
	{
		full: 'h264',
		description: 'Argument line for h264 encoder',
		value: true,
		default: ''
	},
	{
		full: 'webm',
		description: 'Argument line for webm encoder',
		value: true,
		default: ''
	},
	{
		full: 'wmv',
		description: 'Argument line for wmv encoder',
		value: true,
		default: ''
	},
	{
		full: 'theora',
		description: 'Argument line for theora encoder',
		value: true,
		default: ''
	},
	{
		full: 'kfx',
		description: 'Location of kfx shader compiler',
		value: true,
		default: ''
	},
	{
		full: 'krafix',
		description: 'Location of krafix shader compiler',
		value: true,
		default: ''
	},
	{
		full: 'nokrafix',
		description: 'Switch off the new shader compiler',
		value: false
	},
	{
		full: 'embedflashassets',
		description: 'Embed assets in swf for flash target',
		value: false
	},
	{
		full: 'compile',
		description: 'Compile executable',
		value: false
	},
	{
		full: 'run',
		description: 'Run executable',
		value: false
	},
	{
		full: 'init',
		description: 'Init a Kha project inside the current directory',
		value: false
	},
	{
		full: 'name',
		description: 'Project name to use when initializing a project',
		value: true,
		default: 'Unknown'
	},
	{
		full: 'server',
		description: 'Run local http server for html5 target',
		value: false
	},
	{
		full: 'addfont',
		description: 'Add a bitmap font to the project',
		value: false
	},
	{
		full: 'fontname',
		description: 'Name of a truetype font',
		value: true,
		default: 'Arial'
	},
	{
		full: 'fontsize',
		description: 'Point size of the generated font',
		value: true,
		default: '12'
	},
	{
		full: 'port',
		description: 'Running port for the server',
		value: true,
		default: 8080
	},
	{
		full: 'addasset',
		description: 'Add an asset to project.kha.',
		value: true,
		default: ''
	},
	{
		full: 'addallassets',
		description: 'Searches the Assets directory and adds all unknown files to project.kha.',
		value: false
	}
];

var parsedOptions = {

};

function printHelp() {
	console.log('khamake options:\n');
	for (var o in options) {
		var option = options[o];
		if (option.hidden) continue;
		if (option.short) console.log('-' + option.short + ' ' + '--' + option.full);
		else console.log('--' + option.full);
		console.log(option.description);
		console.log();
	}
}

for (var o in options) {
	var option = options[o];
	if (option.value) {
		parsedOptions[option.full] = option.default;
	}
	else {
		parsedOptions[option.full] = false;
	}
}

var args = process.argv;
for (var i = 2; i < args.length; ++i) {
	var arg = args[i];

	if (arg[0] == '-') {
		if (arg[1] == '-') {
			if (arg.substr(2) === 'help') {
				printHelp();
				process.exit(0);
			}
			for (var o in options) {
				var option = options[o];
				if (arg.substr(2) === option.full) {
					if (option.value) {
						++i;
						parsedOptions[option.full] = args[i];
					}
					else {
						parsedOptions[option.full] = true;
					}
				}
			}
		}
		else {
			if (arg[1] === 'h') {
				printHelp();
				process.exit(0);
			}
			for (var o in options) {
				var option = options[o];
				if (option.short && arg[1] === option.short) {
					if (option.value) {
						++i;
						parsedOptions[option.full] = args[i];
					}
					else {
						parsedOptions[option.full] = true;
					}
				}
			}
		}
	}
	else {
		parsedOptions.target = arg;
	}
}

if (parsedOptions.graphics === GraphicsApi.OpenGL) {
	parsedOptions.graphics = GraphicsApi.OpenGL2;
}

if (parsedOptions.run) {
	parsedOptions.compile = true;
}

if (parsedOptions.init) {
	console.log('Initializing Kha project.\n');
	
	if (!fs.existsSync(path.join(parsedOptions.from, 'project.kha'))) {
		var project = {
			format: 2,
			game: {
				name: parsedOptions.name,
				width: 640,
				height: 480
			},
			assets: [],
			rooms: []
		};
		fs.writeFileSync(path.join(parsedOptions.from, 'project.kha'), JSON.stringify(project, null, '\t'), { encoding: 'utf8' });
	}
	
	if (!fs.existsSync(path.join(parsedOptions.from, 'Assets'))) fs.mkdirSync(path.join(parsedOptions.from, 'Assets'));
	if (!fs.existsSync(path.join(parsedOptions.from, 'Sources'))) fs.mkdirSync(path.join(parsedOptions.from, 'Sources'));
	
	var friendlyName = parsedOptions.name;
	friendlyName = friendlyName.replace(/ /g, '_');
	friendlyName = friendlyName.replace(/-/g, '_');

	if (!fs.existsSync(path.join(parsedOptions.from, 'Sources', 'Main.hx'))) {
		var mainsource = 'package;\n\nimport kha.Starter;\n\n'
			+ 'class Main {\n'
			+ '\tpublic static function main() {\n'
			+ '\t\tvar starter = new Starter();\n'
			+ '\t\tstarter.start(new ' + friendlyName + '());\n'
			+ '\t}\n'
			+ '}\n';
		fs.writeFileSync(path.join(parsedOptions.from, 'Sources', 'Main.hx'), mainsource, { encoding: 'utf8' });
	}
	
	if (!fs.existsSync(path.join(parsedOptions.from, 'Sources', friendlyName + '.hx'))) {
		var projectsource = 'package;\n\nimport kha.Game;\n\n'
			+ 'class ' + friendlyName + ' {\n'
			+ '\tpublic function new() {\n'
			+ '\t\tsuper("' + parsedOptions.name + '");\n'
			+ '\t}\n\n'
			+ '\toverride function init(): Void {\n'
			+ '\t\t\n'
			+ '\t}\n'
			+ '}\n';
		fs.writeFileSync(path.join(parsedOptions.from, 'Sources', friendlyName + '.hx'), projectsource, { encoding: 'utf8' });
	}
	
	console.log('If you want to use the git version of Kha, execute "git init" and "git add submodule https://github.com/ktxsoftware/Kha.git".');
}
else if (parsedOptions.server) {
	console.log('Running server on ' + parsedOptions.port);
	var static = require('node-static');
	var fileServer = new static.Server('./build/html5');
	require('http').createServer(function (request, response) {
		request.addListener('end', function () {
			fileServer.serve(request, response);
		}).resume();
	}).listen(parsedOptions.port);
}
else if (parsedOptions.addfont) {
	console.log('Adding font ' + parsedOptions.fontname + parsedOptions.fontsize + ', please put ' + parsedOptions.fontname + '.ttf in your Assets directory.');
	var ProjectFile = require('./ProjectFile.js');
	var project = ProjectFile(Paths.get(parsedOptions.from));
	project.assets.push({ file: parsedOptions.fontname + '.ttf', name: parsedOptions.fontname, type: 'font', size: parsedOptions.fontsize});
	fs.writeFileSync(path.join(parsedOptions.from, 'project.kha'), JSON.stringify(project, null, '\t'), { encoding: 'utf8' });
}
else if (parsedOptions.addasset !== '') {
	var ProjectFile = require('./ProjectFile.js');
	var project = ProjectFile(Paths.get(parsedOptions.from));
	var filename = parsedOptions.addasset;
	var name = filename;
	if (filename.indexOf('.') >= 0) name = filename.substr(0, filename.lastIndexOf('.'));
	if (filename.endsWith('.png') || filename.endsWith('.jpg')) {
		project.assets.push({ file: filename, name: name, type: 'image'});
		console.log('Added image ' + name + '. Please make sure ' + filename + ' is in your Assets directory.');
	}
	else if (filename.endsWith('.wav')) {
		project.assets.push({ file: name, name: name, type: 'sound'});
		console.log('Added sound ' + name + '. Please make sure ' + filename + ' is in your Assets directory. You can optionally change the type of ' + name + ' to music in your project.kha.');
	}
	else if (filename.endsWith('.ttf')) {
		console.log('Please use --addfont to add fonts.');
		process.exit(1);
	}
	else {
		project.assets.push({ file: name, name: name, type: 'blob'});
		console.log('Added blob ' + filename + '. Please make sure ' + filename + ' is in your Assets directory.');
	}
	fs.writeFileSync(path.join(parsedOptions.from, 'project.kha'), JSON.stringify(project, null, '\t'), { encoding: 'utf8' });
}
else if (parsedOptions.addallassets) {
	var hasAsset = function (project, name) {
		for (var a in project.assets) {
			if (project.assets[a].name === name) return true;
		}
		return false;
	};

	var readDirectory = function (dir) {
		var filenames = fs.readdirSync(path.join(parsedOptions.from, 'Assets', dir));
		for (var f in filenames) {
			var filename = filenames[f];
			if (fs.statSync(path.join(parsedOptions.from, 'Assets', dir, filename)).isDirectory()) {
				readDirectory(path.join(dir, filename));
				continue;
			}
			filename = path.join(dir, filename).replaceAll('\\', '/');
			var name = filename;
			if (filename.indexOf('.') >= 0) name = filename.substr(0, filename.lastIndexOf('.'));
			if (filename.endsWith('.png') || filename.endsWith('.jpg')) {
				if (!hasAsset(project, name)) project.assets.push({ file: filename, name: name, type: 'image'});
			}
			else if (filename.endsWith('.wav')) {
				if (!hasAsset(project, name)) project.assets.push({ file: name, name: name, type: 'sound'});
			}
			else if (filename.endsWith('.ttf')) {

			}
			else {
				if (!hasAsset(project, filename)) project.assets.push({ file: filename, name: filename, type: 'blob'});
			}
		}
	};

	var ProjectFile = require('./ProjectFile.js');
	var project = ProjectFile(Paths.get(parsedOptions.from));
	readDirectory('');
	fs.writeFileSync(path.join(parsedOptions.from, 'project.kha'), JSON.stringify(project, null, '\t'), { encoding: 'utf8' });
}
else {
	require('./main.js').run(parsedOptions, { info: console.log, error: console.log }, function (name) { });
}
