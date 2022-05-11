import * as os from 'os';

export function sys() {
	if (os.platform() === 'win32') {
		return '.exe';
	}
	else {
		return '';
	}
}

export function sysdir() {
	if (os.platform() === 'linux') {
		if (os.arch() === 'arm') return 'linux_arm';
		if (os.arch() === 'arm64') return 'linux_arm64';
		else if (os.arch() === 'x64') return 'linux_x64';
		else throw 'Unsupported CPU';
	}
	else if (os.platform() === 'win32') {
		return 'windows_x64';
	}
	else if (os.platform() === 'freebsd') {
		return 'freebsd_x64';
	}
	else {
		return 'macos';
	}
}
