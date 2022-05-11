import * as path from 'path';
import {sysdir} from './exec';

let korepath = path.join(__dirname, '..', '..', '..', 'Kinc', 'Tools', sysdir());

export function init(options: any) {
	korepath = path.join(options.kha, 'Kinc', 'Tools', sysdir());
}

export function get() {
	return korepath;
}
