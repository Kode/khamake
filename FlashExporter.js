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

function adjustFilename(filename) {
	filename = filename.replaceAll('.', '_');
	filename = filename.replaceAll('-', '_');
	filename = filename.replaceAll('/', '_');
	return filename;
}

class FlashExporter extends KhaExporter {
	constructor(khaDirectory, directory, embedflashassets) {
		super(khaDirectory);
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

	exportSolution(name, platform, khaDirectory, haxeDirectory, from, callback) {
		let defines = [
			'swf-script-timeout=60',
			'sys_' + platform,
			'sys_g1', 'sys_g2', 'sys_g3', 'sys_g4',
			'sys_a1', 'sys_a2'
		];
		if (this.embed) defines.push('KHA_EMBEDDED_ASSETS');

		const options = {
			from: from.toString(),
			to: path.join(this.sysdir(), 'kha.swf'),
			sources: this.sources,
			defines: defines,
			haxeDirectory: haxeDirectory.toString(),
			system: this.sysdir(),
			language: 'as',
			width: this.width,
			height: this.height,
			name: name
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
			Haxe.executeHaxe(this.directory, haxeDirectory, ['project-' + this.sysdir() + '.hxml'], callback);
		}
		else {
			callback();
		}
	}

	copyMusic(platform, from, to, encoders, callback) {
		Files.createDirectories(this.directory.resolve(this.sysdir()).resolve(to).parent());
		Converter.convert(from, this.directory.resolve(this.sysdir()).resolve(to + '.ogg'), encoders.oggEncoder, (ogg) => {
			Converter.convert(from, this.directory.resolve(this.sysdir()).resolve(to + '.mp3'), encoders.mp3Encoder, (mp3) => {
				var files = [];
				if (ogg) {
					files.push(to + '.ogg');
					if (this.embed) this.sounds.push(to + '.ogg');
				}
				if (mp3) {
					files.push(to + '.mp3');
					if (this.embed) this.sounds.push(to + '.mp3');
				}
				callback(files);
			});
		});
	}

	copySound(platform, from, to, encoders, callback) {
		Files.createDirectories(this.directory.resolve(this.sysdir()).resolve(to).parent());
		Converter.convert(from, this.directory.resolve(this.sysdir()).resolve(to + '.ogg'), encoders.oggEncoder, (ogg) => {
			if (this.embed) this.sounds.push(to + '.ogg');
			callback([to + '.ogg']);
		});
	}

	copyImage(platform, from, to, asset, callback) {
		exportImage(from, this.directory.resolve(this.sysdir()).resolve(to), asset, undefined, false, (format) => {
			if (this.embed) this.images.push(to + '.' + format);
			callback([to + '.' + format]);
		});
	}

	copyBlob(platform, from, to, callback) {
		this.copyFile(from, this.directory.resolve(this.sysdir()).resolve(to));
		if (this.embed) this.blobs.push(to);
		callback([to]);
	}

	copyFont(platform, from, to, asset, encoders, callback) {
		Files.createDirectories(this.directory.resolve(this.sysdir()).resolve(to).parent());
		Converter.convert(from, this.directory.resolve(this.sysdir()).resolve(to), encoders.kravur, (success) => {
			if (this.embed) this.blobs.push(to);
			callback([to]);
		}, {size: asset.size});
	}

	copyVideo(platform, from, to, encoders, callback) {
		Files.createDirectories(this.directory.resolve(this.sysdir()).resolve(to).parent());
		Converter.convert(from, this.directory.resolve(this.sysdir()).resolve(to + '.mp4'), encoders.h264Encoder, (mp4) => {
			callback([to + '.mp4']);
		});
	}

	addShader(shader) {
		if (this.embed) this.blobs.push(shader);
	}
}

module.exports = FlashExporter;
