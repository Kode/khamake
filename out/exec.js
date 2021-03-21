"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sys = void 0;
const os = require("os");
function sys() {
    if (os.platform() === 'linux') {
        if (os.arch() === 'arm')
            return '-linuxarm';
        else if (os.arch() === 'x64')
            return '-linux64';
        else
            return '-linux32';
    }
    else if (os.platform() === 'win32') {
        return '.exe';
    }
    else if (os.platform() === 'freebsd') {
        return '-freebsd';
    }
    else {
        return '-osx';
    }
}
exports.sys = sys;
//# sourceMappingURL=exec.js.map