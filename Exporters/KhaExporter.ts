import * as path from 'path';
import {convert} from '../Converter';
import {Exporter} from './Exporter';
import {Options} from '../Options';

export abstract class KhaExporter extends Exporter {
	width: number;
	height: number;
	sources: Array<string>;
	libraries: Array<string>;
	name: string;
	safename: string;
	options: Options;
	projectFiles: boolean;
	
	constructor(options: Options) {
		super();
		this.options = options;
		this.width = 640;
		this.height = 480;
		this.sources = [];
		this.libraries = [];
		this.addSourceDirectory(path.join(options.kha, 'Sources'));
		this.projectFiles = !options.noproject;
	}
	
	abstract sysdir(): string;

	abstract haxeOptions(name: string, targetOptions: any, defines: Array<string>): any;

	abstract async exportSolution(name: string, targetOptions: any, haxeOptions: any): Promise<void>;

	setWidthAndHeight(width: number, height: number): void {
		this.width = width;
		this.height = height;
	}

	setName(name: string): void {
		this.name = name;
		this.safename = name.replace(/ /g, '-');
	}

	addShader(shader: string): void {

	}

	addSourceDirectory(path: string): void {
		this.sources.push(path);
	}

	addLibrary(library: string): void {
		this.libraries.push(library);
	}

	removeSourceDirectory(path: string): void {
		for (let i = 0; i < this.sources.length; ++i) {
			if (this.sources[i] === path) {
				this.sources.splice(i, 1);
				return;
			}
		}
	}

	async copyImage(platform: string, from: string, to: string, asset: any): Promise<Array<string>> {
		return [];
	}

	async copySound(platform: string, from: string, to: string): Promise<Array<string>> {
		return [];
	}

	async copyVideo(platform: string, from: string, to: string): Promise<Array<string>> {
		return [];
	}

	async copyBlob(platform: string, from: string, to: string): Promise<Array<string>> {
		return [];
	}

	async copyFont(platform: string, from: string, to: string): Promise<Array<string>> {
		return await this.copyBlob(platform, from, to + '.ttf');
	}
}
