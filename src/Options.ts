export class Options {
	from: string;
	to: string;
	projectfile: string;
	target: string;
	vr: string;
	raytrace: string;
	main: string;
	// intermediate: string;
	graphics: string;
	arch: string;
	audio: string;
	visualstudio: string;
	kha: string;
	haxe: string;
	nohaxe: boolean;
	ffmpeg: string;
	krafix: string;
	noshaders: boolean;

	parallelAssetConversion: number;
	noproject: boolean;
	onlydata: boolean;
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

	haxe3: boolean;
}
