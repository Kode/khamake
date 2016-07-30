"use strict";

import * as fs from 'fs';
import * as path from 'path';
import {Project} from './Project';

export async function loadProject(from: string, projectfile: string): Promise<Project> {
	return new Promise<Project>((resolve, reject) => {
		fs.readFile(path.join(from, projectfile), { encoding: 'utf8' }, (err, data) => {
			let resolved = false;
			let resolver = (project: Project) => {
				resolved = true;
				resolve(project);
			};

			process.on('exit', (code) => {
				if (!resolved) {
					console.error('Error: khafile.js did not call resolve, no project created.');
				}
			});
	
			Project.scriptdir = from;
			new Function('Project', 'require', 'resolve', 'reject', data)(Project, require, resolver, reject);
		});
	});
}
