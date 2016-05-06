"use strict";

import * as child_process from 'child_process';
import * as fs from 'fs-extra';
import * as os from 'os';
import * as path from 'path';
import * as log from './log';
import {sys} from './exec';
import {Asset} from './Asset';

function getWidthAndHeight(from: string, to: string, asset: Asset, format: string, prealpha: boolean): Promise<{w: number, h: number}> {
	return new Promise((resolve, reject) => {
		const exe = 'kraffiti' + sys();
		
		let params = ['from=' + from, 'to=' + to, 'format=' + format, 'donothing'];
		if (asset.scale !== undefined && asset.scale !== 1) {
			params.push('scale=' + asset.scale);	
		}
		let process = child_process.spawn(path.join(__dirname, '..', '..', 'Kore', 'Tools', 'kraffiti', exe), params);
		
		let output = '';
		process.stdout.on('data', (data) => {
			output += data.toString();
		});

		process.stderr.on('data', (data) => {
			
		});

		process.on('close', (code) => {
			if (code !== 0) {
				log.error('kraffiti process exited with code ' + code + ' when trying to get size of ' + asset.name);
				resolve({w: 0, h: 0});
				return;	
			}
			var lines = output.split('\n');
			for (var l in lines) {
				var line = lines[l];
				if (line.startsWith('#')) {
					var numbers = line.substring(1).split('x');
					resolve({w: parseInt(numbers[0]), h: parseInt(numbers[1])});
					return;
				}
			}
			resolve({w: 0, h: 0});
		});
	});
}

export async function exportImage(from: string, to: string, asset: Asset, format: string, prealpha: boolean, poweroftwo: boolean = false) {
	if (format === undefined) {
		if (from.toString().endsWith('.png')) format = 'png';
		else if (from.toString().endsWith('.hdr')) format = 'hdr'; 
		else format = 'jpg';
	}

	if (format === 'jpg' && (asset.scale === undefined || asset.scale === 1) && asset.background === undefined) {
		to = to + '.jpg';
	}
	else if (format === 'pvr') {
		to = to + '.pvr';
	}
	else if (format === 'hdr') {
		to = to + '.hdr';
	}
	else {
		format = 'png';
		if (prealpha) to = to + '.kng';
		else to = to + '.png';
	}
	
	let outputformat = format;
	if (format === 'png' && prealpha) {
		outputformat = 'kng';
	}

	if (fs.existsSync(to) && fs.statSync(to).mtime.getTime() > fs.statSync(from.toString()).mtime.getTime()) {
		let wh = await getWidthAndHeight(from, to, asset, format, prealpha);
		asset.original_width = wh.w;
		asset.original_height = wh.h;
		return outputformat;
	}

	fs.ensureDirSync(path.dirname(to));

	if (format === 'jpg' || format === 'hdr') {
		fs.copySync(from, to, { clobber: true });
		let wh = await getWidthAndHeight(from, to, asset, format, prealpha);
		asset.original_width = wh.w;
		asset.original_height = wh.h;
		return outputformat;
	}

	const exe = 'kraffiti' + sys();
	
	let params = ['from=' + from, 'to=' + to, 'format=' + format];
	if (!poweroftwo) {
		params.push('filter=nearest');
	}
	if (prealpha) params.push('prealpha');
	if (asset.scale !== undefined && asset.scale !== 1) {
		params.push('scale=' + asset.scale);	
	}
	if (asset.background !== undefined) {
		params.push('transparent=' + ((asset.background.red << 24) | (asset.background.green << 16) | (asset.background.blue << 8) | 0xff).toString(16));
	}
	if (poweroftwo) {
		params.push('poweroftwo');
	}
	
	let process = child_process.spawn(path.join(__dirname, '..', '..', 'Kore', 'Tools', 'kraffiti', exe), params);
	
	let output = '';
	process.stdout.on('data', (data) => {
		output += data.toString();
	});

	process.stderr.on('data', (data) => {
		
	});

	process.on('close', (code) => {
		if (code !== 0) {
			log.error('kraffiti process exited with code ' + code + ' when trying to convert ' + asset.name);
			return outputformat;
		}
		
		const lines = output.split('\n');
		for (let line of lines) {
			if (line.startsWith('#')) {
				var numbers = line.substring(1).split('x');
				asset.original_width = parseInt(numbers[0]);
				asset.original_height = parseInt(numbers[1]);
				return outputformat;
			}
		}
		return outputformat;
	});
}
