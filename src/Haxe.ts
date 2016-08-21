"use strict";

import * as child_process from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as log from './log';
import {sys} from './exec';

export function executeHaxe(from: string, haxeDirectory: string, options): Promise<{}> {
	return new Promise((resolve, reject) => {
		let exe = 'haxe';
		let env = process.env;
		if (fs.existsSync(haxeDirectory) && fs.statSync(haxeDirectory).isDirectory()) {
			let localexe = path.resolve(haxeDirectory, 'haxe' + sys());
			if (!fs.existsSync(localexe)) localexe = path.resolve(haxeDirectory, 'haxe');
			if (fs.existsSync(localexe)) exe = localexe;
			const stddir = path.resolve(haxeDirectory, 'std');
			if (fs.existsSync(stddir) && fs.statSync(stddir).isDirectory()) {
				env.HAXE_STD_PATH = stddir;
			}
		}
		let haxe = child_process.spawn(exe, options, {env: env, cwd: path.normalize(from)});
		
		haxe.stdout.on('data', (data) => {
			log.info(data.toString());
		});

		haxe.stderr.on('data', (data) => {
			log.error(data.toString());
		});
		
		haxe.on('close', (code) => {
			if (code === 0) resolve();
			else reject('Haxe compiler error.')
		});
	});
}
