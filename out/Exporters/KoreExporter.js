"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const path = require("path");
const defaults = require("../defaults");
const KhaExporter_1 = require("./KhaExporter");
const Converter_1 = require("../Converter");
const GraphicsApi_1 = require("../GraphicsApi");
const Platform_1 = require("../Platform");
const ImageTool_1 = require("../ImageTool");
class KoreExporter extends KhaExporter_1.KhaExporter {
    constructor(options) {
        super(options);
        this.slowgc = options.slowgc;
        // Files.removeDirectory(this.directory.resolve(Paths.get(this.sysdir() + "-build", "Sources")));
    }
    backend() {
        return 'Kore';
    }
    haxeOptions(name, targetOptions, defines) {
        defines.push('no-compilation');
        defines.push('include-prefix=hxinc');
        if (!this.slowgc) {
            defines.push('HXCPP_GC_GENERATIONAL');
        }
        defines.push('sys_' + this.options.target);
        defines.push('sys_kore');
        defines.push('sys_g1');
        defines.push('sys_g2');
        defines.push('sys_g3');
        defines.push('sys_g4');
        defines.push('sys_a1');
        defines.push('sys_a2');
        defines.push('kha_cpp');
        defines.push('kha_' + this.options.target);
        defines.push('kha_' + this.options.target + '_native');
        defines.push('kha_' + this.options.target + '_cpp');
        let graphics = this.options.graphics;
        if (graphics === GraphicsApi_1.GraphicsApi.Default) {
            graphics = defaults.graphicsApi(this.options.target);
        }
        defines.push('kha_' + graphics);
        defines.push('kha_kore');
        defines.push('kha_g1');
        defines.push('kha_g2');
        defines.push('kha_g3');
        defines.push('kha_g4');
        defines.push('kha_a1');
        defines.push('kha_a2');
        if (this.options.vr === 'gearvr') {
            defines.push('vr_gearvr');
        }
        else if (this.options.vr === 'cardboard') {
            defines.push('vr_cardboard');
        }
        else if (this.options.vr === 'rift') {
            defines.push('vr_rift');
        }
        if (this.options.raytrace === 'dxr') {
            defines.push('kha_dxr');
        }
        return {
            from: this.options.from,
            to: path.join(this.sysdir() + '-build', 'Sources'),
            sources: this.sources,
            libraries: this.libraries,
            defines: defines,
            parameters: this.parameters,
            haxeDirectory: this.options.haxe,
            system: this.sysdir(),
            language: 'cpp',
            width: this.width,
            height: this.height,
            name: name,
            main: this.options.main,
        };
    }
    async export(name, targetOptions, haxeOptions) {
    }
    async copySound(platform, from, to, options) {
        if (options.quality < 1) {
            fs.ensureDirSync(path.join(this.options.to, this.sysdir(), path.dirname(to)));
            await Converter_1.convert(from, path.join(this.options.to, this.sysdir(), to + '.ogg'), this.options.ogg);
            return { files: [to + '.ogg'], sizes: [1] };
        }
        else {
            if (from.endsWith('.wav')) {
                fs.copySync(from.toString(), path.join(this.options.to, this.sysdir(), to + '.wav'), { overwrite: true });
            }
            else {
                throw 'Can not convert ' + from + ' to wav format.';
            }
            return { files: [to + '.wav'], sizes: [1] };
        }
    }
    async copyImage(platform, from, to, options, cache) {
        if (platform === Platform_1.Platform.iOS && options.quality < 1) {
            let format = await ImageTool_1.exportImage(this.options.kha, from, path.join(this.options.to, this.sysdir(), to), options, 'pvr', true, false, cache);
            return { files: [to + '.' + format], sizes: [1] };
        }
        else if (platform === Platform_1.Platform.Windows && options.quality < 1 && (this.options.graphics === GraphicsApi_1.GraphicsApi.OpenGL || this.options.graphics === GraphicsApi_1.GraphicsApi.Vulkan)) {
            // let format = await exportImage(this.options.kha, from, path.join(this.options.to, this.sysdir(), to), options, 'ASTC', true, false, cache);
            let format = await ImageTool_1.exportImage(this.options.kha, from, path.join(this.options.to, this.sysdir(), to), options, 'DXT5', true, false, cache);
            return { files: [to + '.' + format], sizes: [1] };
        }
        else {
            let format = await ImageTool_1.exportImage(this.options.kha, from, path.join(this.options.to, this.sysdir(), to), options, 'lz4', true, false, cache);
            return { files: [to + '.' + format], sizes: [1] };
        }
    }
    async copyBlob(platform, from, to) {
        fs.copySync(from.toString(), path.join(this.options.to, this.sysdir(), to), { overwrite: true });
        return { files: [to], sizes: [1] };
    }
    async copyVideo(platform, from, to) {
        fs.ensureDirSync(path.join(this.options.to, this.sysdir(), path.dirname(to)));
        if (platform === Platform_1.Platform.Windows) {
            await Converter_1.convert(from, path.join(this.options.to, this.sysdir(), to + '.avi'), this.options.h264);
            return { files: [to + '.avi'], sizes: [1] };
        }
        else if (platform === Platform_1.Platform.iOS || platform === Platform_1.Platform.OSX) {
            await Converter_1.convert(from, path.join(this.options.to, this.sysdir(), to + '.mp4'), this.options.h264);
            return { files: [to + '.mp4'], sizes: [1] };
        }
        else if (platform === Platform_1.Platform.Android) {
            await Converter_1.convert(from, path.join(this.options.to, this.sysdir(), to + '.ts'), this.options.h264);
            return { files: [to + '.ts'], sizes: [1] };
        }
        else {
            await Converter_1.convert(from, path.join(this.options.to, this.sysdir(), to + '.ogv'), this.options.theora);
            return { files: [to + '.ogv'], sizes: [1] };
        }
    }
}
exports.KoreExporter = KoreExporter;
//# sourceMappingURL=KoreExporter.js.map