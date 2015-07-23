var project = new Project('HaxeCrossCode');
project.addFiles('Sources/**.h', 'Sources/**.cpp', 'Sources/**.metal');
project.addExcludes('Sources/src/__main__.cpp');
project.addIncludeDirs('Sources/include');
return project;
