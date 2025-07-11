import * as path from 'path';
import {sysdir2} from './exec';

let korepath = path.join(__dirname, '..', '..', '..', 'Kore', 'Tools', sysdir2());

export function init(options: any) {
	korepath = path.join(options.kha, 'Kore', 'Tools', sysdir2());
}

export function get() {
	return korepath;
}
