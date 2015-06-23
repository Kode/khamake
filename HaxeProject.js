var fs = require('fs-extra');
var path = require('path');
var XmlWriter = require('./XmlWriter.js');

exports.hxml = function (projectdir, options) {
	var data = '';
	for (var i = 0; i < options.sources.length; ++i) {
		if (path.isAbsolute(options.sources[i])) {
			data += '-cp ' + options.sources[i] + '\n';
		}
		else {
			data += '-cp ' + path.relative(projectdir, path.join(options.from, options.sources[i])) + '\n'; // from.resolve('build').relativize(from.resolve(this.sources[i])).toString());
		}
	}
	data += '-cpp ' + path.normalize(options.to) + '\n';
	for (var d in options.defines) {
		var define = options.defines[d];
		data += '-D ' + define + '\n';
	}
	data += '-main Main' + '\n';
	fs.outputFileSync(path.join(projectdir, 'project-' + options.system + '.hxml'), data);
};

exports.FlashDevelopment = function (projectdir, options) {
	var output = {
		n: 'output',
		e: [
			{
				n: 'movie',
				outputType: 'Application'
			},
			{
				n: 'movie',
				input: ''
			},
			{
				n: 'movie',
				path: path.normalize(options.to) // this.sysdir() + '-build\\Sources'
			},
			{
				n: 'movie',
				fps: 0
			},
			{
				n: 'movie',
				width: 0
			},
			{
				n: 'movie',
				height: 0
			},
			{
				n: 'movie',
				version: 1
			},
			{
				n: 'movie',
				minorVersion: 0
			},
			{
				n: 'movie',
				platform: 'C++'
			},
			{
				n: 'movie',
				background: '#FFFFFF'
			}
		]
	};

	if (fs.existsSync(options.haxeDirectory) && fs.statSync(options.haxeDirectory).isDirectory()) {
		output.e.push({
			n: 'movie',
			preferredSDK: path.relative(projectdir, options.haxeDirectory) // from.resolve('build').relativize(haxeDirectory).toString()
		})
	}

	var classpaths = {
		n: 'classpaths',
		e: [

		]
	};

	for (var i = 0; i < options.sources.length; ++i) {
		if (path.isAbsolute(options.sources[i])) {
			classpaths.e.push({
				n: 'class',
				path: options.sources[i]
			});
		}
		else {
			classpaths.e.push({
				n: 'class',
				path: path.relative(projectdir, path.join(options.from, options.sources[i])) // from.resolve('build').relativize(from.resolve(this.sources[i])).toString()
			});
		}
	}

	var def = '';
	for (var d in options.defines) {
		def += '-D ' + options.defines[d] + '\n';
	}

	var project = {
		n: 'project',
		version: '2',
		e: [
			'Output SWF options',
			output,
			'Other classes to be compiled into your SWF',
			classpaths,
			'Build options',
			{
				n: 'build',
				e: [
					{
						n: 'option',
						directives: ''
					},
					{
						n: 'option',
						flashStrict: 'False'
					},
					{
						n: 'option',
						mainClass: 'Main'
					},
					{
						n: 'option',
						enableDebug: 'False'
					},
					{
						n: 'option',
						additional: def
					}
				]
			},
			'haxelib libraries',
			{
				n: 'haxelib',
				e: [
					'example: <library name="..." />'
				]
			},
			'Class files to compile (other referenced classes will automatically be included)',
			{
				n: 'compileTargets',
				e: [
					{
						n: 'compile',
						path: '..\\Sources\\Main.hx'
					}
				]
			},
			'Paths to exclude from the Project Explorer tree',
			{
				n: 'hiddenPaths',
				e: [
					'example: <hidden path="..." />'
				]
			},
			'Executed before build',
			{
				n: 'preBuildCommand'
			},
			'Executed after build',
			{
				n: 'postBuildCommand',
				alwaysRun: 'False'
			},
			'Other project options',
			{
				n: 'options',
				e: [
					{
						n: 'option',
						showHiddenPaths: 'False'
					},
					{
						n: 'option',
						testMovie: 'Custom'
					},
					{
						n: 'option',
						testMovieCommand: 'run.bat'
					}
				]
			},
			'Plugin storage',
			{
				n: 'storage'
			}
		]
	};

	XmlWriter(project, path.join(projectdir, 'project-' + options.system + '.hxproj'));
};
