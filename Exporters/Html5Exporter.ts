import * as fs from 'fs-extra';
import * as path from 'path';
import {KhaExporter} from './KhaExporter';
import {convert} from '../Converter';
import {executeHaxe} from '../Haxe';
import {Options} from '../Options';
import {exportImage} from '../ImageTool';
import {writeHaxeProject} from '../HaxeProject';

export class Html5Exporter extends KhaExporter {
	parameters: Array<string>;
	width: number;
	height: number;
	
	constructor(options: Options) {
		super(options);
		this.addSourceDirectory(path.join(options.kha, 'Backends', 'HTML5'));
	}

	sysdir() {
		return 'html5';
	}

	isDebugHtml5() {
 		return this.sysdir() === 'debug-html5';
 	}
 
 	isNode() {
 		return this.sysdir() === 'node';
 	}
	
	haxeOptions(name: string, defines: Array<string>) {
		defines.push('sys_g1');
		defines.push('sys_g2');
		defines.push('sys_g3');
		defines.push('sys_g4');
		defines.push('sys_a1');
		defines.push('sys_a2');
		
		if (this.isNode()) {
			defines.push('sys_node');
			defines.push('sys_server');
			defines.push('nodejs');
		}
		else {
			defines.push('sys_' + this.options.target);
		}
		
		if (this.isDebugHtml5()) {
			defines.push('sys_debug_html5');
			this.parameters.push('-debug');
		}

		return {
			from: this.options.from.toString(),
			to: path.join(this.sysdir(), 'kha.js'),
			sources: this.sources,
			libraries: this.libraries,
			defines: defines,
			parameters: this.parameters,
			haxeDirectory: this.options.haxe,
			system: this.sysdir(),
			language: 'js',
			width: this.width,
			height: this.height,
			name: name
		};
	}

	async exportSolution(name: string, _targetOptions: any, defines: Array<string>): Promise<any> {
		fs.ensureDirSync(path.join(this.options.to, this.sysdir()));

		let haxeOptions = this.haxeOptions(name, defines);
		writeHaxeProject(this.options.to, haxeOptions);

		if (this.isDebugHtml5()) {
			let index = path.join(this.options.to, this.sysdir(), 'index.html');
			if (!fs.existsSync(index)) {
				let protoindex = fs.readFileSync(path.join(__dirname, '..', '..', 'Data', 'debug-html5', 'index.html'), {encoding: 'utf8'});
				protoindex = protoindex.replace(/{Name}/g, name);
				protoindex = protoindex.replace(/{Width}/g, '' + this.width);
				protoindex = protoindex.replace(/{Height}/g, '' + this.height);
				fs.writeFileSync(index.toString(), protoindex);
			}
			
			let pack = path.join(this.options.to, this.sysdir(), 'package.json');
			let protopackage = fs.readFileSync(path.join(__dirname, '..', '..', 'Data', 'debug-html5', 'package.json'), {encoding: 'utf8'});
			protopackage = protopackage.replace(/{Name}/g, name);
			fs.writeFileSync(pack.toString(), protopackage);

			let electron = path.join(this.options.to, this.sysdir(), 'electron.js');
			let protoelectron = fs.readFileSync(path.join(__dirname, '..', '..', 'Data', 'debug-html5', 'electron.js'), {encoding: 'utf8'});
			protoelectron = protoelectron.replace(/{Width}/g, '' + this.width);
			protoelectron = protoelectron.replace(/{Height}/g, '' + this.height);
			fs.writeFileSync(electron.toString(), protoelectron);
		}
		else if (this.isNode()) {
			let pack = path.join(this.options.to, this.sysdir(), 'package.json');
			let protopackage = fs.readFileSync(path.join(__dirname, '..', '..', 'Data', 'node', 'package.json'), {encoding: 'utf8'});
			protopackage = protopackage.replace(/{Name}/g, name);
			fs.writeFileSync(pack.toString(), protopackage);
		}
		else {
			let index = path.join(this.options.to, this.sysdir(), 'index.html');
			if (!fs.existsSync(index)) {
				let protoindex = fs.readFileSync(path.join(__dirname, '..', '..', 'Data', 'html5', 'index.html'), {encoding: 'utf8'});
				protoindex = protoindex.replace(/{Name}/g, name);
				protoindex = protoindex.replace(/{Width}/g, '' + this.width);
				protoindex = protoindex.replace(/{Height}/g, '' + this.height);
				fs.writeFileSync(index.toString(), protoindex);
			}
		}
		
		return haxeOptions;
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

	async copySound(platform: string, from: string, to: string) {
		fs.ensureDirSync(path.join(this.options.to, this.sysdir(), path.dirname(to)));
		let ogg = await convert(from, path.join(this.options.to, this.sysdir(), to + '.ogg'), this.options.ogg);
		let mp4 = null;
		if (!this.isDebugHtml5()) {
			mp4 = await convert(from, path.join(this.options.to, this.sysdir(), to + '.mp4'), this.options.aac);
		}
		var files = [];
		if (ogg) files.push(to + '.ogg');
		if (mp4) files.push(to + '.mp4');
		return files;
	}

	async copyImage(platform: string, from: string, to: string, options: any) {
		let format = await exportImage(this.options.kha, from, path.join(this.options.to, this.sysdir(), to), options, undefined, false);
		return [to + '.' + format];
	}

	async copyBlob(platform: string, from: string, to: string) {
		fs.copySync(from.toString(), path.join(this.options.to, this.sysdir(), to), { clobber: true });
		return [to];
	}

	async copyVideo(platform: string, from: string, to: string) {
		fs.ensureDirSync(path.join(this.options.to, this.sysdir(), path.dirname(to)));
		let mp4 = null;
		if (!this.isDebugHtml5()) {
			mp4 = await convert(from, path.join(this.options.to, this.sysdir(), to + '.mp4'), this.options.h264);
		}
		let webm = await convert(from, path.join(this.options.to, this.sysdir(), to + '.webm'), this.options.webm);
		let files = [];
		if (mp4) files.push(to + '.mp4');
		if (webm) files.push(to + '.webm');
		return files;
	}
}
