"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convert = void 0;
const child_process = require("child_process");
const fs = require("fs");
const log = require("./log");
function convert(inFilename, outFilename, encoder, args = []) {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(outFilename.toString()) && fs.statSync(outFilename.toString()).mtime.getTime() > fs.statSync(inFilename.toString()).mtime.getTime()) {
            resolve(true);
            return;
        }
        if (!encoder) {
            resolve(false);
            return;
        }
        let dirend = Math.max(encoder.lastIndexOf('/'), encoder.lastIndexOf('\\'));
        let firstspace = encoder.indexOf(' ', dirend);
        let exe = encoder.substr(0, firstspace);
        let parts = encoder.substr(firstspace + 1).split(' ');
        let options = parts.map(part => {
            // finds {i} in encoder parts and replaces with args[i] if they are specified
            for (let i = 0; i < args.length; i++) {
                if (part === '{' + i + '}')
                    return args[i];
            }
            if (part == '{ffmpeg_ogg_options}') {
                return ['-c:a', 'libvorbis', '-vn'];
            }
            if (part === '{in}')
                return inFilename.toString();
            if (part === '{out}')
                return outFilename.toString();
            return part;
        }).flat().filter(option => option != undefined);
        if (fs.existsSync(outFilename.toString())) {
            fs.unlinkSync(outFilename.toString());
        }
        // About stdio ignore: https://stackoverflow.com/a/20792428
        let process = child_process.spawn(exe, options, {
            stdio: ['ignore', 'ignore', 'pipe'] // don't ignore stderr
        });
        let stderr = '';
        if (process.stderr) {
            process.stderr.on('data', (data) => {
                stderr += data.toString();
            });
        }
        process.on('close', (code) => {
            if (code !== 0) {
                let msg = `Converter exited with code ${code}`;
                if (stderr.length > 0)
                    msg += `: ${stderr}`;
                log.error(msg);
            }
            resolve(code === 0);
        });
    });
}
exports.convert = convert;
//# sourceMappingURL=Converter.js.map