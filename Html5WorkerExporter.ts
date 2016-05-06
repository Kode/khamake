"use strict";

import * as path from 'path';
import {Html5Exporter} from './Html5Exporter';

export class Html5WorkerExporter extends Html5Exporter {
	constructor(khaDirectory, directory) {
		super(khaDirectory, directory);
		this.sources.pop();
		this.addSourceDirectory(path.join(khaDirectory, 'Backends', 'HTML5-Worker'));
	}

	sysdir() {
		return 'html5-worker';
	}
}
