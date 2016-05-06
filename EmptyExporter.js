"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const child_process = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const KhaExporter_1 = require('./KhaExporter');
const Haxe_1 = require('./Haxe');
const Options_1 = require('./Options');
const HaxeProject_1 = require('./HaxeProject');
const log = require('./log');
class EmptyExporter extends KhaExporter_1.KhaExporter {
    constructor(khaDirectory, directory) {
        super(khaDirectory, directory);
        this.addSourceDirectory(path.join(khaDirectory.toString(), 'Backends/Empty'));
    }
    sysdir() {
        return 'empty';
    }
    exportSolution(name, platform, khaDirectory, haxeDirectory, from, _targetOptions, defines) {
        return __awaiter(this, void 0, void 0, function* () {
            fs.ensureDirSync(path.join(this.directory, this.sysdir()));
            defines.push('sys_g1');
            defines.push('sys_g2');
            defines.push('sys_g3');
            defines.push('sys_g4');
            defines.push('sys_a1');
            defines.push('sys_a2');
            const options = {
                from: from.toString(),
                to: path.join(this.sysdir(), 'docs.xml'),
                sources: this.sources,
                defines: defines,
                parameters: this.parameters,
                haxeDirectory: haxeDirectory.toString(),
                system: this.sysdir(),
                language: 'xml',
                width: this.width,
                height: this.height,
                name: name
            };
            yield HaxeProject_1.writeHaxeProject(this.directory.toString(), options);
            if (Options_1.Options.compilation) {
                let result = yield Haxe_1.executeHaxe(this.directory, haxeDirectory, ['project-' + this.sysdir() + '.hxml']);
                if (result === 0) {
                    let doxresult = child_process.spawnSync('haxelib', ['run', 'dox', '-in', 'kha.*', '-i', path.join('build', options.to)], { env: process.env, cwd: path.normalize(from.toString()) });
                    if (doxresult.stdout.toString() !== '') {
                        log.info(doxresult.stdout.toString());
                    }
                    if (doxresult.stderr.toString() !== '') {
                        log.error(doxresult.stderr.toString());
                    }
                }
                return result;
            }
            else {
                return 0;
            }
        });
    }
    copySound(platform, from, to, encoders) {
        return __awaiter(this, void 0, void 0, function* () {
            return [];
        });
    }
    copyImage(platform, from, to, asset) {
        return __awaiter(this, void 0, void 0, function* () {
            return [];
        });
    }
    copyBlob(platform, from, to) {
        return __awaiter(this, void 0, void 0, function* () {
            return [];
        });
    }
    copyVideo(platform, from, to, encoders) {
        return __awaiter(this, void 0, void 0, function* () {
            return [];
        });
    }
}
exports.EmptyExporter = EmptyExporter;
//# sourceMappingURL=EmptyExporter.js.map