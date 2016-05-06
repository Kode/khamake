"use strict";

import {Html5Exporter} from './Html5Exporter';
 
export class DebugHtml5Exporter extends Html5Exporter {
	constructor(khaDirectory, directory) {
		super(khaDirectory, directory);
	}

	sysdir() {
		return 'debug-html5';
	}
}
