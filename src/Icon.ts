import * as cp from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as log from './log';
import * as exec from './exec';

function run(exe: string, from: string, to: string, width: number, height: number, format: string, background: number, transparent: boolean, callback: any) {
	let params = ['from=' + from, 'to=' + to, 'format=' + format, 'keepaspect'];
	if (width > 0) params.push('width=' + width);
	if (height > 0) params.push('height=' + height);
	if (background !== undefined && !transparent) params.push('background=' + background.toString(16));
	if (transparent) params.push('transparent=' + background.toString(16));
	let child = cp.spawn(exe, params);
	
	child.stdout.on('data', (data: any) => {
		// log.info('kraffiti stdout: ' + data);
	});
	
	child.stderr.on('data', (data: any) => {
		log.error('kraffiti stderr: ' + data);
	});
	
	child.on('error', (err: any) => {
		log.error('kraffiti error: ' + err);
	});
	
	child.on('close', (code: number) => {
		if (code !== 0) log.error('kraffiti exited with code ' + code);
		callback();
	});
}

function findIcon(icon: string, from: string, options: any) {
	if (icon && fs.existsSync(path.join(from, icon))) return path.join(from, icon);
	if (fs.existsSync(path.join(from, 'icon.png'))) return path.join(from, 'icon.png');
	else return path.join(options.kha, 'Kinc', 'Tools', 'kraffiti', 'icon.png');
}

export function exportIco(icon: string, to: string, from: string, options: any) {
	run(options.kraffiti, findIcon(icon, from.toString(), options), to.toString(), 0, 0, 'ico', undefined, false, function () { });
}

export function exportIcns(icon: string, to: string, from: string, options: any) {
	run(options.kraffiti, findIcon(icon, from.toString(), options), to.toString(), 0, 0, 'icns', undefined, false, function () { });
}

export function exportPng(icon: string, to: string, width: number, height: number, background: number, transparent: boolean, from: string, options: any) {
	run(options.kraffiti, findIcon(icon, from.toString(), options), to.toString(), width, height, 'png', background, transparent, function () { });
}

export function exportPng24(icon: string, to: string, width: number, height: number, background: number, transparent: boolean, from: string, options: any) {
	run(options.kraffiti, findIcon(icon, from.toString(), options), to.toString(), width, height, 'png24', background, transparent, function () { });
}

export function exportBmp(icon: string, to: string, width: number, height: number, background: number, from: string, options: any) {
	run(options.kraffiti, findIcon(icon, from.toString(), options), to.toString(), width, height, 'bmp', background, false, function () { });
}
