"use strict";

import * as path from 'path';
import {convert} from './Converter';
import {Exporter} from './Exporter';

export class KhaExporter extends Exporter {
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

	getCurrentDirectoryName(directory) {
		return directory.getFileName();
	}

	setWidthAndHeight(width: number, height: number) {
		this.width = width;
		this.height = height;
	}

	setName(name: string) {
		this.name = name;
		this.safename = name.replace(/ /g, '-');
	}

	addShader(shader: string) {

	}

	addSourceDirectory(path: string) {
		this.sources.push(path);
	}

	addLibrary(library: string) {
		this.libraries.push(library);
	}

	removeSourceDirectory(path: string) {
		for (let i = 0; i < this.sources.length; ++i) {
			if (this.sources[i] === path) {
				this.sources.splice(i, 1);
				return;
			}
		}
	}

	async copyImage(platform, from: string, to: string, asset): Promise<Array<string>> {
		return [];
	}

	/*copyMusic(platform, from, to, encoders) {
		return [];
	}*/

	async copySound(platform, from, to, encoders): Promise<Array<string>> {
		return [];
	}

	async copyVideo(platform, from, to, encoders): Promise<Array<string>> {
		return [];
	}

	async copyBlob(platform, from, to): Promise<Array<string>> {
		return [];
	}

	async copyFont(platform, from, to): Promise<Array<string>> {
		return await this.copyBlob(platform, from, to + '.ttf');
	}
}
