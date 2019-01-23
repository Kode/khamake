let project = new Project('HaxeC');
project.addFiles('kore_sources.c');
project.addIncludeDirs('.');
resolve(project);
