let project = new Project('HaxeCrossCode', __dirname);
project.addFiles('_std/**');
project.addFiles('haxe/**');
project.addFiles('hl/**');
project.addFiles('kha/**');
project.addFiles('kore_sources.c');
project.addIncludeDirs('.');
resolve(project);
