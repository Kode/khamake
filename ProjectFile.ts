"use strict";

import * as fs from 'fs';
import * as path from 'path';
import {Project} from './Project';

export async function loadProject(from: string, projectfile: string): Promise<Project> {
	return new Promise<Project>((resolve, reject) => {
		fs.readFile(path.join(from, projectfile), { encoding: 'utf8' }, (err, data) => {
			Project.scriptdir = from;
			new Function('Project', 'require', 'resolve', 'reject', data)(Project, require, resolve, reject);
		});
	});
}
