import {GraphicsApi} from './GraphicsApi';
import {VisualStudioVersion} from './VisualStudioVersion';
import {VrApi} from './VrApi';

/*
export var Options = {
	precompiledHeaders: false,
	intermediateDrive: '',
	graphicsApi: GraphicsApi.Direct3D9,
	vrApi: VrApi.None,
	visualStudioVersion: VisualStudioVersion.VS2013,
	compilation: true,
	compile: false,
	run: false
};
*/

export class Options {
	from: string;
	to: string;
	projectfile: string;
	target: string;
	vr: string;
	// intermediate: string;
	graphics: string;
	visualstudio: string;
	kha: string;
	haxe: string;
	nohaxe: boolean;
	ffmpeg: string;
	krafix: string;
	noshaders: boolean;
	
	noproject: boolean;
	embedflashassets: boolean;
	compile: boolean;
	run: boolean;
	init: boolean;
	name: string;
	server: boolean;
	port: string;
	debug: boolean;
	silent: boolean;
	watch: boolean;
	glsl2: boolean;
	shaderversion: string;
	
	ogg: string;
	aac: string;
	mp3: string;
	h264: string;
	webm: string;
	wmv: string;
	theora: string;
}
