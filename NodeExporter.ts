"use strict";

import * as path from 'path';
import {Html5Exporter} from './Html5Exporter';

export class NodeExporter extends Html5Exporter {
	constructor(khaDirectory: string, directory: string) {
		super(khaDirectory, directory);
		this.removeSourceDirectory(path.join(khaDirectory, 'Backends', 'HTML5'));
		this.addSourceDirectory(path.join(khaDirectory, 'Backends', 'Node'));
	}

	sysdir(): string {
		return 'node';
	}
}
