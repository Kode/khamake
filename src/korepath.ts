import * as path from 'path';

let korepath = path.join(__dirname, '..', '..', '..', 'Kinc', 'Tools', 'kincmake');

export function init(options: any) {
	korepath = path.join(options.kha, 'Kinc', 'Tools', 'kincmake');
}

export function get() {
	return korepath;
}
