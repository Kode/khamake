"use strict";

import * as path from 'path';
import {convert} from './Converter';
import {Encoders} from './Encoders';
import {Exporter} from './Exporter';

export abstract class KhaExporter extends Exporter {
	width: number;
	height: number;
	sources: Array<string>;
	libraries: Array<string>;
	name: string;
	safename: string;
	directory: string;
	
	constructor(khaDirectory: string, directory: string) {
		super();
		this.directory = directory;
		this.width = 640;
		this.height = 480;
		this.sources = [];
		this.libraries = [];
		this.addSourceDirectory(path.join(khaDirectory.toString(), 'Sources'));
	}
	
	abstract sysdir(): string;

	abstract async exportSolution(name: string, platform: string, khaDirectory: string, haxeDirectory: string, from: string, targetOptions: any, defines: Array<string>): Promise<{}>;

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

	async copyImage(platform: string, from: string, to: string, asset): Promise<Array<string>> {
		return [];
	}

	async copySound(platform: string, from: string, to: string, encoders: Encoders): Promise<Array<string>> {
		return [];
	}

	async copyVideo(platform: string, from: string, to: string, encoders: Encoders): Promise<Array<string>> {
		return [];
	}

	async copyBlob(platform: string, from: string, to: string): Promise<Array<string>> {
		return [];
	}

	async copyFont(platform: string, from: string, to: string): Promise<Array<string>> {
		return await this.copyBlob(platform, from, to + '.ttf');
	}
}
