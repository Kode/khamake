import * as fs from 'fs';
import * as path from 'path';
import * as log from './log';
import {Platform} from './Platform';
import {Project} from './Project';

export async function loadProject(from: string, projectfile: string, platform: string): Promise<Project> {
	return new Promise<Project>((resolve, reject) => {
		fs.readFile(path.join(from, projectfile), { encoding: 'utf8' }, (err, data) => {
			let resolved = false;
			let resolver = (project: Project) => {
				resolved = true;
				resolve(project);
			};

			process.on('exit', (code: number) => {
				if (!resolved) {
					console.error('Error: khafile.js did not call resolve, no project created.');
				}
			});
	
			Project.scriptdir = from;
			try {
				new Function('Project', 'Platform', 'platform', 'require', 'resolve', 'reject', data)(Project, Platform, platform, require, resolver, reject);
			}
			catch (error) {
				reject(error);
			}
		});
	});
}
