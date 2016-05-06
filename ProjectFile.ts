"use strict";

import * as fs from 'fs';
import * as path from 'path';
import {Project} from './Project';

export function loadProject(from: string, projectfile: string) {
	let file = fs.readFileSync(path.join(from, projectfile), { encoding: 'utf8' });
	Project.scriptdir = from.toString();
	let project = new Function('Project', file)(Project);
	return project;
}
