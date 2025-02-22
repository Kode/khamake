"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Project = exports.Target = exports.Library = void 0;
const child_process = require("child_process");
const fs = require("fs");
const path = require("path");
const log = require("./log");
const ProjectFile_1 = require("./ProjectFile");
class Library {
    constructor() {
        /**
         * If haxelib `classPath` is specified,
         * we don't add `libpath` as `-cp` to `hxml`.
        */
        this.classPathIsAdded = false;
    }
}
exports.Library = Library;
class Target {
    constructor(baseTarget, backends) {
        this.baseTarget = baseTarget;
        this.backends = backends;
    }
}
exports.Target = Target;
function contains(main, sub) {
    main = path.resolve(main);
    sub = path.resolve(sub);
    if (process.platform === 'win32') {
        main = main.toLowerCase();
        sub = sub.toLowerCase();
    }
    return sub.indexOf(main) === 0 && sub.slice(main.length)[0] === path.sep;
}
class Project {
    constructor(name) {
        this.icon = null;
        this.name = name;
        this.safeName = name.replace(/[^A-z0-9\-\_]/g, '-');
        this.version = '1.0';
        this.sources = [];
        this.defines = ['hxcpp_smart_strings'];
        this.cdefines = [];
        this.cflags = [];
        this.cppflags = [];
        this.parameters = [];
        this.scriptdir = Project.scriptdir;
        this.libraries = [];
        this.localLibraryPath = 'Libraries';
        this.assetMatchers = [];
        this.shaderMatchers = [];
        this.customTargets = new Map();
        this.stackSize = 0;
        this.windowOptions = {};
        this.targetOptions = {
            html5: {},
            flash: {},
            android: {},
            android_native: {},
            ios: {},
            xboxOne: {},
            playStation4: {},
            switch: {},
            xboxSeriesXS: {},
            playStation5: {},
            stadia: {}
        };
    }
    getSafeName() {
        return this.safeName;
    }
    async addProject(projectDir) {
        if (!path.isAbsolute(projectDir)) {
            projectDir = path.join(this.scriptdir, projectDir);
        }
        if (!fs.existsSync(path.join(projectDir, 'khafile.js')) && (fs.existsSync(path.join(projectDir, 'kfile.js')) || fs.existsSync(path.join(projectDir, 'korefile.js')) || fs.existsSync(path.join(projectDir, 'kincfile.js')))) {
            this.libraries.push({
                libpath: projectDir,
                libroot: projectDir
            });
        }
        else {
            let project = await (0, ProjectFile_1.loadProject)(projectDir, 'khafile.js', Project.platform);
            this.assetMatchers = this.assetMatchers.concat(project.assetMatchers);
            this.sources = this.sources.concat(project.sources);
            this.shaderMatchers = this.shaderMatchers.concat(project.shaderMatchers);
            this.defines = this.defines.concat(project.defines);
            this.cdefines = this.cdefines.concat(project.cdefines);
            this.cflags = this.cflags.concat(project.cflags);
            this.cppflags = this.cppflags.concat(project.cppflags);
            this.parameters = this.parameters.concat(project.parameters);
            this.libraries = this.libraries.concat(project.libraries);
            if (this.icon === null && project.icon !== null)
                this.icon = path.join(projectDir, project.icon);
            for (let customTarget of project.customTargets.keys()) {
                this.customTargets.set(customTarget, project.customTargets.get(customTarget));
            }
            // windowOptions and targetOptions are ignored
        }
    }
    unglob(str) {
        const globChars = ['\\@', '\\!', '\\+', '\\*', '\\?', '\\(', '\\[', '\\{', '\\)', '\\]', '\\}'];
        str = str.replace(/\\/g, '/');
        for (const char of globChars) {
            str = str.replace(new RegExp(char, 'g'), char);
        }
        return str;
    }
    getBaseDir(str) {
        // replace \\ to / if next char is not glob
        str = str.replace(/\\([^@!+*?{}()[\]]|$)/g, '/$1');
        // find non-globby path part
        const globby = /[^\\][@!+*?{}()[\]]/;
        while (globby.test(str)) {
            str = path.posix.dirname(str);
        }
        str = this.removeGlobEscaping(str);
        if (!str.endsWith('/'))
            str += '/';
        return str;
    }
    removeGlobEscaping(str) {
        return str.replace(/\\([@!+*?{}()[\]]|$)/g, '$1');
    }
    /**
     * Add all assets matching the match glob relative to the directory containing the current khafile.
     * Asset types are infered from the file suffix.
     * Glob syntax is very simple, the most important patterns are * for anything and ** for anything across directories.
     */
    addAssets(match, options) {
        if (!options)
            options = {};
        if (!path.isAbsolute(match)) {
            let base = this.unglob(path.resolve(this.scriptdir));
            if (!base.endsWith('/'))
                base += '/';
            // if there is no nameBaseDir: extract relative assets path from match
            const baseName = options.nameBaseDir == null ? this.getBaseDir(match) : options.nameBaseDir;
            match = path.posix.join(base, match.replace(/\\/g, '/'));
            options.baseDir = path.posix.join(this.removeGlobEscaping(base), baseName);
        }
        else {
            options.baseDir = this.getBaseDir(match);
        }
        this.assetMatchers.push({ match: match, options: options });
    }
    addSources(source) {
        this.sources.push(path.resolve(path.join(this.scriptdir, source)));
    }
    /**
     * Add all shaders matching the match glob relative to the directory containing the current khafile.
     * Glob syntax is very simple, the most important patterns are * for anything and ** for anything across directories.
     */
    addShaders(match, options) {
        if (!options)
            options = {};
        if (!path.isAbsolute(match)) {
            let base = this.unglob(path.resolve(this.scriptdir));
            if (!base.endsWith('/')) {
                base += '/';
            }
            match = base + match.replace(/\\/g, '/');
        }
        this.shaderMatchers.push({ match: match, options: options });
    }
    addDefine(define) {
        this.defines.push(define);
    }
    addCDefine(define) {
        this.cdefines.push(define);
    }
    addCFlag(flag) {
        this.cflags.push(flag);
    }
    addCppFlag(flag) {
        this.cppflags.push(flag);
    }
    addParameter(parameter) {
        this.parameters.push(parameter);
    }
    addTarget(name, baseTarget, backends) {
        this.customTargets.set(name, new Target(baseTarget, backends));
    }
    addLibrary(library) {
        this.addDefine(library);
        const findLibraryDirectory = (name) => {
            if (path.isAbsolute(name)) {
                return { libpath: name, libroot: name };
            }
            // Tries to load the default library from inside the kha project.
            // e.g. 'Libraries/wyngine'
            let libpath = path.join(this.scriptdir, this.localLibraryPath, name);
            if (fs.existsSync(libpath) && fs.statSync(libpath).isDirectory()) {
                let dir = path.resolve(libpath);
                return { libpath: dir, libroot: dir };
            }
            // If the library couldn't be found in Libraries folder, try
            // looking in the haxelib folders.
            // e.g. addLibrary('hxcpp') => '/usr/lib/haxelib/hxcpp/3,2,193'
            try {
                libpath = path.join(child_process.execSync('haxelib config', { encoding: 'utf8' }).trim(), name.replace(/\./g, ','));
            }
            catch (error) {
                if (process.env.HAXEPATH) {
                    libpath = path.join(process.env.HAXEPATH, 'lib', name.toLowerCase());
                }
            }
            if (fs.existsSync(libpath) && fs.statSync(libpath).isDirectory()) {
                if (fs.existsSync(path.join(libpath, '.dev'))) {
                    libpath = fs.readFileSync(path.join(libpath, '.dev'), 'utf8');
                    if (!path.isAbsolute(libpath)) {
                        libpath = path.resolve(libpath);
                    }
                    return { libpath: libpath, libroot: libpath };
                }
                else if (fs.existsSync(path.join(libpath, '.current'))) {
                    // Get the latest version of the haxelib path,
                    // e.g. for 'hxcpp', latest version '3,2,193'
                    let current = fs.readFileSync(path.join(libpath, '.current'), 'utf8');
                    return { libpath: path.join(libpath, current.replace(/\./g, ',')), libroot: libpath };
                }
            }
            // check relative path
            if (fs.existsSync(path.resolve(name))) {
                let libpath = path.resolve(name);
                return { libpath: libpath, libroot: libpath };
            }
            // Show error if library isn't found in Libraries or haxelib folder
            log.error('Error: Library ' + name + ' not found.');
            log.error('Add it to the \'Libraries\' subdirectory of your project. You may also install it via haxelib but that\'s less cool.');
            throw 'Library ' + name + ' not found.';
        };
        let libInfo = findLibraryDirectory(library);
        let dir = libInfo.libpath;
        if (dir !== '') {
            for (let elem of this.libraries) {
                if (elem.libroot === libInfo.libroot)
                    return '';
            }
            const lib = {
                libpath: dir,
                libroot: libInfo.libroot
            };
            this.libraries.push(lib);
            // If this is a haxelib library, there must be a haxelib.json
            if (fs.existsSync(path.join(dir, 'haxelib.json'))) {
                let options = JSON.parse(fs.readFileSync(path.join(dir, 'haxelib.json'), 'utf8'));
                // If there is a classPath value, add that directory to be loaded.
                // Otherwise, just load the current path.
                if (options.classPath) {
                    lib.classPathIsAdded = true;
                    this.sources.push(path.join(dir, options.classPath));
                }
                else {
                    // e.g. '/usr/lib/haxelib/hxcpp/3,2,193'
                    this.sources.push(dir);
                }
                // If this haxelib has other library dependencies, add them too
                if (options.dependencies) {
                    for (let dependency in options.dependencies) {
                        if (dependency.toLowerCase() !== 'kha') {
                            this.addLibrary(dependency);
                        }
                    }
                }
            }
            else {
                // If there is no haxelib.json file, then just load the library
                // by the Sources folder.
                // e.g. Libraries/wyngine/Sources
                if (!fs.existsSync(path.join(dir, 'Sources'))) {
                    log.info('Warning: No haxelib.json and no Sources directory found in library ' + library + '.');
                }
                this.sources.push(path.join(dir, 'Sources'));
            }
            if (fs.existsSync(path.join(dir, 'extraParams.hxml'))) {
                let params = fs.readFileSync(path.join(dir, 'extraParams.hxml'), 'utf8');
                for (let parameter of params.split('\n')) {
                    let param = parameter.trim();
                    if (param !== '') {
                        if (param.startsWith('-lib')) {
                            // (DK)
                            //  - '-lib xxx' is for linking a library via haxe, it forces the use of the haxelib version
                            //  - this should be handled by khamake though, as it tracks the dependencies better (local folder or haxelib)
                            log.info('Ignoring ' + dir + '/extraParams.hxml "' + param + '"');
                        }
                        else {
                            this.addParameter(param);
                        }
                    }
                }
            }
            this.addShaders(dir + '/Sources/Shaders/**', {});
        }
        return dir;
    }
}
exports.Project = Project;
//# sourceMappingURL=Project.js.map