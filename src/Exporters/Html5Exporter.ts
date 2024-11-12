import * as fs from 'fs-extra';
import * as path from 'path';
import {KhaExporter} from './KhaExporter';
import {convert} from '../Converter';
import {executeHaxe} from '../Haxe';
import {Options} from '../Options';
import {exportImage} from '../ImageTool';
import {AssetMatcherOptions, Library} from '../Project';
import {VrApi} from '../VrApi';

export class Html5Exporter extends KhaExporter {
	width: number;
	height: number;
	isDebug: boolean;

	constructor(options: Options) {
		super(options);
	}

	backend(): string {
		return 'HTML5';
	}

	isADebugTarget() {
		return this.isDebug;
	}

	isDebugHtml5() {
		return this.sysdir() === 'debug-html5';
	}

	isNode() {
		return false;
	}

	isHtml5Worker() {
		return this.sysdir() === 'html5worker';
	}

	haxeOptions(name: string, targetOptions: any, defines: Array<string>) {
		defines.push('sys_g1');
		defines.push('sys_g2');
		defines.push('sys_g3');
		defines.push('sys_a1');
		defines.push('sys_a2');

		defines.push('kha_js');
		defines.push('kha_g1');
		defines.push('kha_g2');
		defines.push('kha_g3');
		defines.push('kha_a1');
		defines.push('kha_a2');

		if (targetOptions.html5.noKeyboard) {
			defines.push('kha_no_keyboard');
		}

		if (targetOptions.html5.disableContextMenu) {
			defines.push('kha_disable_context_menu');
		}

		if (this.options.vr === VrApi.WebVR) {
			defines.push('kha_webvr');
		}

		let canvasId = targetOptions.html5.canvasId == null ? 'khanvas' : targetOptions.html5.canvasId;

		defines.push('canvas_id=' + canvasId);

		let scriptName = this.isHtml5Worker() ? 'khaworker' : 'kha';
		if (targetOptions.html5.scriptName != null && !(this.isNode() || this.isDebugHtml5())) {
			scriptName = targetOptions.html5.scriptName;
		}

		defines.push('script_name=' + scriptName);

		let webgl = targetOptions.html5.webgl == null ? true : targetOptions.html5.webgl;

		if (webgl) {
			defines.push('sys_g4');
			defines.push('kha_g4');
			defines.push('kha_webgl');
		} else {
			defines.push('kha_html5_canvas');
		}

		if (this.isNode()) {
			defines.push('nodejs');

			defines.push('sys_node');
			defines.push('sys_server');

			defines.push('kha_node');
			defines.push('kha_server');
		}
		else {
			defines.push('sys_' + this.options.target);

			defines.push('kha_' + this.options.target);
			defines.push('kha_' + this.options.target + '_js');

			defines.push('sys_html5');
			defines.push('kha_html5');
			defines.push('kha_html5_js');
		}

		if (this.isADebugTarget()) {
			this.parameters.push('-debug');

			defines.push('sys_debug_html5');

			defines.push('kha_debug_html5');
			defines.push('kha_html5');
		}

		if (this.isHtml5Worker()) {
			defines.push('js-classic');
		}

		return {
			from: this.options.from.toString(),
			to: path.join(this.sysdir(), scriptName + '.js'),
			sources: this.sources,
			libraries: this.libraries,
			defines: defines,
			parameters: this.parameters,
			haxeDirectory: this.options.haxe,
			system: this.sysdir(),
			language: 'js',
			width: this.width,
			height: this.height,
			name: name,
			main: this.options.main,
		};
	}

	async export(name: string, _targetOptions: any, haxeOptions: any): Promise<void> {
		let targetOptions = {
			canvasId: 'khanvas',
			scriptName: this.isHtml5Worker() ? 'khaworker' : 'kha',
			unsafeEval: false,
			expose: ''
		};

		if (_targetOptions != null && _targetOptions.html5 != null) {
			let userOptions = _targetOptions.html5;
			if (userOptions.canvasId != null) targetOptions.canvasId = userOptions.canvasId;
			if (userOptions.scriptName != null) targetOptions.scriptName = userOptions.scriptName;
			if (userOptions.unsafeEval != null) targetOptions.unsafeEval = userOptions.unsafeEval;
			if (userOptions.expose != null) targetOptions.expose = userOptions.expose;
		}

		fs.ensureDirSync(path.join(this.options.to, this.sysdir()));

		if (this.isADebugTarget()) { // support custom debug-html5 based targets
			let electron = path.join(this.options.to, this.sysdir(), 'electron.js');
			let protoelectron = fs.readFileSync(path.join(__dirname, '..', '..', 'Data', 'debug-html5', 'electron.js'), {encoding: 'utf8'});
			protoelectron = protoelectron.replace(/{Width}/g, '' + this.width);
			protoelectron = protoelectron.replace(/{Height}/g, '' + this.height);
			protoelectron = protoelectron.replace(/{ext}/g, process.platform === 'win32' ? '\'.ico\'' : '\'.png\'');
			fs.writeFileSync(electron.toString(), protoelectron);

			let pack = path.join(this.options.to, this.sysdir(), 'package.json');
			let protopackage = fs.readFileSync(path.join(__dirname, '..', '..', 'Data', 'debug-html5', 'package.json'), {encoding: 'utf8'});
			protopackage = protopackage.replace(/{Name}/g, name);
			fs.writeFileSync(pack.toString(), protopackage);

			let index = path.join(this.options.to, this.sysdir(), 'index.html');
			let protoindex = fs.readFileSync(path.join(__dirname, '..', '..', 'Data', 'debug-html5', 'index.html'), {encoding: 'utf8'});
			protoindex = protoindex.replace(/{Name}/g, name);
			protoindex = protoindex.replace(/{Width}/g, '' + this.width);
			protoindex = protoindex.replace(/{Height}/g, '' + this.height);
			protoindex = protoindex.replace(/{CanvasId}/g, '' + targetOptions.canvasId);
			protoindex = protoindex.replace(/{ScriptName}/g, '' + targetOptions.scriptName);
			protoindex = protoindex.replace(/{UnsafeEval}/g, targetOptions.unsafeEval ? '\'unsafe-eval\'' : '');
			fs.writeFileSync(index.toString(), protoindex);

			let preload = path.join(this.options.to, this.sysdir(), 'preload.js');
			let protopreload = fs.readFileSync(path.join(__dirname, '..', '..', 'Data', 'debug-html5', 'preload.js'), {encoding: 'utf8'});
			protopreload = protopreload.replace(/{Expose}/g, targetOptions.expose);
			fs.writeFileSync(preload.toString(), protopreload);
		}
		else if (this.isNode()) {
			let pack = path.join(this.options.to, this.sysdir(), 'package.json');
			let protopackage = fs.readFileSync(path.join(__dirname, '..', '..', 'Data', 'node', 'package.json'), 'utf8');
			protopackage = protopackage.replace(/{Name}/g, name);
			fs.writeFileSync(pack, protopackage);

			let protoserver = fs.readFileSync(path.join(__dirname, '..', '..', 'Data', 'node', 'server.js'), 'utf8');
			fs.writeFileSync(path.join(this.options.to, this.sysdir(), 'server.js'), protoserver);
		}
		else if (!this.isHtml5Worker()) {
			let index = path.join(this.options.to, this.sysdir(), 'index.html');
			if (!fs.existsSync(index)) {
				let protoindex = fs.readFileSync(path.join(__dirname, '..', '..', 'Data', 'html5', 'index.html'), {encoding: 'utf8'});
				protoindex = protoindex.replace(/{Name}/g, name);
				protoindex = protoindex.replace(/{Width}/g, '' + this.width);
				protoindex = protoindex.replace(/{Height}/g, '' + this.height);
				protoindex = protoindex.replace(/{CanvasId}/g, '' + targetOptions.canvasId);
				protoindex = protoindex.replace(/{ScriptName}/g, '' + targetOptions.scriptName);
				fs.writeFileSync(index.toString(), protoindex);
			}
		}
	}

	/*copyMusic(platform, from, to, encoders, callback) {
		Files.createDirectories(this.directory.resolve(this.sysdir()).resolve(to).parent());
		Converter.convert(from, this.directory.resolve(this.sysdir()).resolve(to + '.ogg'), encoders.oggEncoder, (ogg) => {
			Converter.convert(from, this.directory.resolve(this.sysdir()).resolve(to + '.mp4'), encoders.aacEncoder, (mp4) => {
				var files = [];
				if (ogg) files.push(to + '.ogg');
				if (mp4) files.push(to + '.mp4');
				callback(files);
			});
		});
	}*/

	async copySound(platform: string, from: string, to: string, options: AssetMatcherOptions) {
		fs.ensureDirSync(path.join(this.options.to, this.sysdir(), path.dirname(to)));
		let ogg = await convert(from, path.join(this.options.to, this.sysdir(), to + '.ogg'), this.options.ogg);
		let ogg_size = (await fs.stat(path.join(this.options.to, this.sysdir(), to + '.ogg'))).size;
		let mp4 = false;
		let mp4_size = 0;
		let mp3 = false;
		let mp3_size = 0;
		if (!this.isDebugHtml5()) {
			mp4 = await convert(from, path.join(this.options.to, this.sysdir(), to + '.mp4'), this.options.aac);
			if (mp4) {
				mp4_size = (await fs.stat(path.join(this.options.to, this.sysdir(), to + '.mp4'))).size;
			}
			if (!mp4) {
				mp3 = await convert(from, path.join(this.options.to, this.sysdir(), to + '.mp3'), this.options.mp3);
				mp3_size = (await fs.stat(path.join(this.options.to, this.sysdir(), to + '.mp3'))).size;
			}
		}
		let files: string[] = [];
		let sizes: number[] = [];
		if (ogg) { files.push(to + '.ogg'); sizes.push(ogg_size); }
		if (mp4) { files.push(to + '.mp4'); sizes.push(mp4_size); }
		if (mp3) { files.push(to + '.mp3'); sizes.push(mp3_size); }
		return { files: files, sizes: sizes };
	}

	async copyImage(platform: string, from: string, to: string, options: any, cache: any) {
		let format = await exportImage(this.options.kha, this.options.kraffiti, from, path.join(this.options.to, this.sysdir(), to), options, undefined, false, false, cache);
		let stat = await fs.stat(path.join(this.options.to, this.sysdir(), to + '.' + format));
		let size = stat.size;
		return { files: [to + '.' + format], sizes: [size]};
	}

	async copyBlob(platform: string, from: string, to: string, options: any) {
		fs.copySync(from.toString(), path.join(this.options.to, this.sysdir(), to), { overwrite: true, dereference: true });
		let stat = await fs.stat(path.join(this.options.to, this.sysdir(), to));
		let size = stat.size;
		return { files: [to], sizes: [size]};
	}

	async copyVideo(platform: string, from: string, to: string, options: any) {
		fs.ensureDirSync(path.join(this.options.to, this.sysdir(), path.dirname(to)));
		let mp4 = false;
		let mp4_size = 0;
		if (!this.isDebugHtml5()) {
			mp4 = await convert(from, path.join(this.options.to, this.sysdir(), to + '.mp4'), this.options.h264);
			mp4_size = (await fs.stat(path.join(this.options.to, this.sysdir(), to + '.mp4'))).size;
		}
		let webm = await convert(from, path.join(this.options.to, this.sysdir(), to + '.webm'), this.options.webm);
		let webm_size = (await fs.stat(path.join(this.options.to, this.sysdir(), to + '.webm'))).size;
		let files: string[] = [];
		let sizes: number[] = [];
		if (mp4) { files.push(to + '.mp4'); sizes.push(mp4_size); }
		if (webm) { files.push(to + '.webm'); sizes.push(webm_size); }
		return { files: files, sizes: sizes };
	}
}
