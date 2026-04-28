import * as child_process from 'child_process';
import * as fs from 'fs';
import * as log from './log';

export function convert(inFilename: string, outFilename: string, encoder: string, args: Array<string> = []): Promise<boolean> {
	return new Promise((resolve, reject) => {
		if (fs.existsSync(outFilename.toString()) && fs.statSync(outFilename.toString()).mtime.getTime() > fs.statSync(inFilename.toString()).mtime.getTime()) {
			resolve(true);
			return;
		}

		if (!encoder) {
			resolve(false);
			return;
		}

		let dirend = Math.max(encoder.lastIndexOf('/'), encoder.lastIndexOf('\\'));
		let firstspace = encoder.indexOf(' ', dirend);
		let exe = encoder.substr(0, firstspace);
		let parts = encoder.substr(firstspace + 1).split(' ');
		let options: string[] = parts.map(part => {
			// finds {i} in encoder parts and replaces with args[i] if they are specified
			for (let i = 0; i < args.length; i++) {
				if (part === '{' + i + '}') return args[i];
			}

			if (part === '{in}') return inFilename.toString();
			if (part === '{out}') return outFilename.toString();

			return part;
		}).filter(option => option != undefined);

		if (fs.existsSync(outFilename.toString())) {
			fs.unlinkSync(outFilename.toString());
		}

		// About stdio ignore: https://stackoverflow.com/a/20792428
		let process = child_process.spawn(exe, options, {
			stdio: ['ignore', 'ignore', 'pipe'] // don't ignore stderr
		});
		let stderr: string = '';
		if (process.stderr) {
			process.stderr.on('data', (data: Buffer | string) => {
				stderr += data.toString();
			});
		}
		process.on('close', (code: number) => {
			if (code !== 0) {
				let msg = `Converter exited with code ${code}`;
				if (stderr.length > 0) msg += `: ${stderr}`;
				log.error(msg);
			}
			resolve(code === 0);
		});
	});
}
