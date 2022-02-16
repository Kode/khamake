import * as path from 'path';

let korepath = path.join(__dirname, '..', '..', '..', 'Kinc', 'Tools', 'kmake');

export function init(options: any) {
	korepath = path.join(options.kha, 'Kinc', 'Tools', 'kmake');
}

export function get() {
	return korepath;
}
