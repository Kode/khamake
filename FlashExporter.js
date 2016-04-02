"use strict";

const path = require('path');
const KhaExporter = require('./KhaExporter.js');
const Converter = require('./Converter.js');
const Files = require('./Files.js');
const Haxe = require('./Haxe.js');
const Options = require('./Options.js');
const Paths = require('./Paths.js');
const exportImage = require('./ImageTool.js');
const HaxeProject = require('./HaxeProject.js');
const fs = require('fs-extra');

function adjustFilename(filename) {
	filename = filename.replaceAll('.', '_');
	filename = filename.replaceAll('-', '_');
	filename = filename.replaceAll('/', '_');
	return filename;
}

class FlashExporter extends KhaExporter {
	constructor(khaDirectory, directory, embedflashassets) {
		super(khaDirectory, directory);
		this.directory = directory;
		this.embed = embedflashassets;
		this.images = [];
		this.sounds = [];
		this.blobs = [];
		this.addSourceDirectory(path.join(khaDirectory.toString(), 'Backends/Flash'));
	}

	sysdir() {
		return 'flash';
	}

	exportSolution(name, platform, khaDirectory, haxeDirectory, from, targetOptions, defines) {
		defines.push('swf-script-timeout=60');
		defines.push('sys_' + platform);
		defines.push('sys_g1');
		defines.push('sys_g2');
		defines.push('sys_g3');
		defines.push('sys_g4');
		defines.push('sys_a1');
		defines.push('sys_a2');

		if (this.embed) defines.push('KHA_EMBEDDED_ASSETS');

		let defaultFlashOptions = {
			framerate : 60,
			stageBackground : 'ffffff',
			swfVersion : '16.0'
		}
		
		let flashOptions = targetOptions ? targetOptions.flash ? targetOptions.flash : defaultFlashOptions : defaultFlashOptions;
		
		const options = {
			from: from.toString(),
			to: path.join(this.sysdir(), 'kha.swf'),
			sources: this.sources,
			libraries: this.libraries,
			defines: defines,
			parameters: this.parameters,
			haxeDirectory: haxeDirectory.toString(),
			system: this.sysdir(),
			language: 'as',
			width: this.width,
			height: this.height,
			name: name,
			framerate: 'framerate' in flashOptions ? flashOptions.framerate : defaultFlashOptions.framerate,
			stageBackground: 'stageBackground' in flashOptions ? flashOptions.stageBackground : defaultFlashOptions.stageBackground,
			swfVersion : 'swfVersion' in flashOptions ? flashOptions.swfVersion : defaultFlashOptions.swfVersion
		};
		HaxeProject(this.directory.toString(), options);

		if (this.embed) {
			this.writeFile(this.directory.resolve(Paths.get("..", "Sources", "Assets.hx")));

			this.p("package;");
			this.p();
			this.p("import flash.display.BitmapData;");
			this.p("import flash.media.Sound;");
			this.p("import flash.utils.ByteArray;");
			this.p();

			for (let image of this.images) {
				this.p("@:bitmap(\"flash/" + image + "\") class Assets_" + adjustFilename(image) + " extends BitmapData { }");
			}

			this.p();

			for (let sound of this.sounds) {
				this.p("@:file(\"flash/" + sound + "\") class Assets_" + adjustFilename(sound) + " extends ByteArray { }");
			}

			this.p();

			for (let blob of this.blobs) {
				this.p("@:file(\"flash/" + blob + "\") class Assets_" + adjustFilename(blob) + " extends ByteArray { }");
			}

			this.p();
			this.p("class Assets {");
			this.p("public static function visit(): Void {", 1);
			this.p("", 2);
			this.p("}", 1);
			this.p("}");

			this.closeFile();
		}

		if (Options.compilation) {
			return Haxe.executeHaxe(this.directory, haxeDirectory, ['project-' + this.sysdir() + '.hxml']);
		}
		else {
			return 0;
		}
	}

	copySound(platform, from, to, encoders) {
		Files.createDirectories(this.directory.resolve(this.sysdir()).resolve(to).parent());
		var ogg = Converter.convert(from, this.directory.resolve(this.sysdir()).resolve(to + '.ogg'), encoders.oggEncoder);
		var mp3 = Converter.convert(from, this.directory.resolve(this.sysdir()).resolve(to + '.mp3'), encoders.mp3Encoder);
		var files = [];
		if (ogg) {
			files.push(to + '.ogg');
			if (this.embed) this.sounds.push(to + '.ogg');
		}
		if (mp3) {
			files.push(to + '.mp3');
			if (this.embed) this.sounds.push(to + '.mp3');
		}
		return files;
	}

	copyImage(platform, from, to, asset) {
		let format = exportImage(from, this.directory.resolve(this.sysdir()).resolve(to), asset, undefined, false);
		if (this.embed) this.images.push(to + '.' + format);
		return [to + '.' + format];
	}

	copyBlob(platform, from, to) {
		fs.copySync(from.toString(), this.directory.resolve(this.sysdir()).resolve(to).toString(), { clobber: true });
		if (this.embed) this.blobs.push(to);
		return [to];
	}

	copyVideo(platform, from, to, encoders) {
		Files.createDirectories(this.directory.resolve(this.sysdir()).resolve(to).parent());
		Converter.convert(from, this.directory.resolve(this.sysdir()).resolve(to + '.mp4'), encoders.h264Encoder);
		return [to + '.mp4'];
	}

	addShader(shader) {
		if (this.embed) this.blobs.push(shader);
	}
}

module.exports = FlashExporter;
