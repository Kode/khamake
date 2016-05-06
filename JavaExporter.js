"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const fs = require('fs-extra');
const path = require('path');
const KhaExporter_1 = require('./KhaExporter');
const Haxe_1 = require('./Haxe');
const ImageTool_1 = require('./ImageTool');
const HaxeProject_1 = require('./HaxeProject');
class JavaExporter extends KhaExporter_1.KhaExporter {
    constructor(khaDirectory, directory) {
        super(khaDirectory, directory);
    }
    sysdir() {
        return 'java';
    }
    exportSolution(name, platform, khaDirectory, haxeDirectory, from, _targetOptions, defines) {
        return __awaiter(this, void 0, void 0, function* () {
            this.addSourceDirectory("Kha/Backends/" + this.backend());
            fs.ensureDirSync(path.join(this.directory, this.sysdir()));
            defines.push('no-compilation');
            defines.push('sys_' + platform);
            defines.push('sys_g1');
            defines.push('sys_g2');
            defines.push('sys_a1');
            const options = {
                from: from.toString(),
                to: path.join(this.sysdir(), 'Sources'),
                sources: this.sources,
                libraries: this.libraries,
                defines: defines,
                parameters: this.parameters,
                haxeDirectory: haxeDirectory.toString(),
                system: this.sysdir(),
                language: 'java',
                width: this.width,
                height: this.height,
                name: name
            };
            yield HaxeProject_1.writeHaxeProject(this.directory.toString(), options);
            fs.removeSync(path.join(this.directory, this.sysdir(), 'Sources'));
            let result = yield Haxe_1.executeHaxe(this.directory, haxeDirectory, ['project-' + this.sysdir() + '.hxml']);
            this.exportEclipseProject();
            return result;
        });
    }
    backend() {
        return 'Java';
    }
    exportEclipseProject() {
        this.writeFile(path.join(this.directory, this.sysdir(), '.classpath'));
        this.p("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
        this.p("<classpath>");
        this.p("\t<classpathentry kind=\"src\" path=\"Sources/src\"/>");
        this.p("\t<classpathentry kind=\"con\" path=\"org.eclipse.jdt.launching.JRE_CONTAINER\"/>");
        this.p("\t<classpathentry kind=\"output\" path=\"bin\"/>");
        this.p("</classpath>");
        this.closeFile();
        this.writeFile(path.join(this.directory, this.sysdir(), '.project'));
        this.p("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
        this.p("<projectDescription>");
        this.p("\t<name>" + this.getCurrentDirectoryName(this.directory) + "</name>");
        this.p("\t<comment></comment>");
        this.p("\t<projects>");
        this.p("\t</projects>");
        this.p("\t<buildSpec>");
        this.p("\t\t<buildCommand>");
        this.p("\t\t\t<name>org.eclipse.jdt.core.javabuilder</name>");
        this.p("\t\t\t<arguments>");
        this.p("\t\t\t</arguments>");
        this.p("\t\t</buildCommand>");
        this.p("\t</buildSpec>");
        this.p("\t<natures>");
        this.p("\t\t<nature>org.eclipse.jdt.core.javanature</nature>");
        this.p("\t</natures>");
        this.p("</projectDescription>");
        this.closeFile();
    }
    /*copyMusic(platform, from, to, encoders) {
        this.copyFile(from, this.directory.resolve(this.sysdir()).resolve(to + '.wav'));
        callback([to + '.wav']);
    }*/
    copySound(platform, from, to, encoders) {
        return __awaiter(this, void 0, void 0, function* () {
            fs.copySync(from.toString(), path.join(this.directory, this.sysdir(), to + '.wav'), { clobber: true });
            return [to + '.wav'];
        });
    }
    copyImage(platform, from, to, asset) {
        return __awaiter(this, void 0, void 0, function* () {
            let format = ImageTool_1.exportImage(from, path.join(this.directory, this.sysdir(), to), asset, undefined, false);
            return [to + '.' + format];
        });
    }
    copyBlob(platform, from, to) {
        return __awaiter(this, void 0, void 0, function* () {
            fs.copySync(from.toString(), path.join(this.directory, this.sysdir(), to), { clobber: true });
            return [to];
        });
    }
    copyVideo(platform, from, to, encoders) {
        return __awaiter(this, void 0, void 0, function* () {
            return [to];
        });
    }
}
exports.JavaExporter = JavaExporter;
//# sourceMappingURL=JavaExporter.js.map