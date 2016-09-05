let project = new Project('HaxeCrossCode', __dirname);
project.addFiles('Sources/**.h', 'Sources/**.cpp', { pch: 'hxcpp.h' });
project.addFiles('Sources/src/__lib__.cpp', 'Sources/src/__boot__.cpp');
project.addFiles('Sources/**.metal');
project.addExcludes('Sources/src/__main__.cpp');
project.addIncludeDirs('Sources/include');
resolve(project);
