var fs = require('fs-extra');
var path = require('path');
var XmlWriter = require('./XmlWriter.js');

exports.FlashDevelopment = function (path) {
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
				path: /*this.sysdir() +*/ '-build\\Sources'
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

	/*if (fs.existsSync(haxeDirectory) && fs.statSync(haxeDirectory).dir) {
		output.e.push({
			n: 'movie',
			preferredSDK: from.resolve('build').relativize(haxeDirectory).toString()
		})
	}*/

	var classpaths = {
		n: 'classpaths',
		e: [

		]
	};

	/*for (var i = 0; i < this.sources.length; ++i) {
		if (path.isAbsolute(this.sources[i])) {
			classpaths.e.push({
				n: 'class',
				path: this.sources[i]
			});
		}
		else {
			classpaths.e.push({
				n: 'class',
				path: from.resolve('build').relativize(from.resolve(this.sources[i])).toString()
			});
		}
	}*/

	var def = '';
	/*for (var d in defines) {
		def += '-D ' + defines[d] + '\n';
	}*/

	var options = {
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
			},
			{
				n: 'option',
				additional: def
			}
		]
	};

	var project = {
		n: 'project',
		version: '2',
		e: [
			output,
			classpaths,
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
					}
				]
			},
			{
				n: 'haxelib'
			},
			{
				n: 'compileTargets',
				e: [
					{
						n: 'compile',
						path: '..\\Sources\\Main.hx'
					}
				]
			},
			{
				n: 'hiddenPaths'
			},
			{
				n: 'preBuildCommand'
			},
			{
				n: 'postBuildCommand',
				alwaysRun: 'False'
			},
			options,
			{
				n: 'storage'
			}
		]
	};

	XmlWriter(project, path + '.hxproj');
};
