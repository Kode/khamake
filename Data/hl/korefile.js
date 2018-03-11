let project = new Project('HaxeCrossCode', __dirname);
project.addFiles('kore_sources.c');
project.addIncludeDirs('.');
resolve(project);
