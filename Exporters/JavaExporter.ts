import * as fs from 'fs-extra';
import * as path from 'path';
import {KhaExporter} from './KhaExporter';
import {convert} from '../Converter';
import {executeHaxe} from '../Haxe';
import {Options} from '../Options';
import {exportImage} from '../ImageTool';
import {writeHaxeProject} from '../HaxeProject';

export class JavaExporter extends KhaExporter {
	parameters: Array<string>;
	
	constructor(options: Options) {
		super(options);
	}

	sysdir() {
		return 'java';
	}

	haxeOptions(name: string, targetOptions: any, defines: Array<string>) {
		defines.push('no-compilation');
		defines.push('sys_' + this.options.target);
		defines.push('sys_g1');
		defines.push('sys_g2');
		defines.push('sys_a1');

		return {
			from: this.options.from,
			to: path.join(this.sysdir(), 'Sources'),
			sources: this.sources,
			libraries: this.libraries,
			defines: defines,
			parameters: this.parameters,
			haxeDirectory: this.options.haxe,
			system: this.sysdir(),
			language: 'java',
			width: this.width,
			height: this.height,
			name: name
		};
	}

	async exportSolution(name: string, _targetOptions: any, defines: Array<string>): Promise<any> {
		this.addSourceDirectory(path.join(this.options.kha, 'Backends', this.backend()));

		fs.ensureDirSync(path.join(this.options.to, this.sysdir()));
		
		let haxeOptions = this.haxeOptions(name, _targetOptions, defines);
		writeHaxeProject(this.options.to, haxeOptions);

		fs.removeSync(path.join(this.options.to, this.sysdir(), 'Sources'));

		this.exportEclipseProject();

		return haxeOptions;
	}

	backend() {
		return 'Java';
	}

	exportEclipseProject() {
		this.writeFile(path.join(this.options.to, this.sysdir(), '.classpath'));
		this.p("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
		this.p("<classpath>");
		this.p("\t<classpathentry kind=\"src\" path=\"Sources/src\"/>");
		this.p("\t<classpathentry kind=\"con\" path=\"org.eclipse.jdt.launching.JRE_CONTAINER\"/>");
		this.p("\t<classpathentry kind=\"output\" path=\"bin\"/>");
		this.p("</classpath>");
		this.closeFile();

		this.writeFile(path.join(this.options.to, this.sysdir(), '.project'));
		this.p("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
		this.p("<projectDescription>");
		this.p("\t<name>" + path.parse(this.options.to).name + "</name>");
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

	async copySound(platform: string, from: string, to: string) {
		fs.copySync(from.toString(), path.join(this.options.to, this.sysdir(), to + '.wav'), { clobber: true });
		return [to + '.wav'];
	}

	async copyImage(platform: string, from: string, to: string, asset: any) {
		let format = await exportImage(this.options.kha, from, path.join(this.options.to, this.sysdir(), to), asset, undefined, false);
		return [to + '.' + format];
	}

	async copyBlob(platform: string, from: string, to: string) {
		fs.copySync(from.toString(), path.join(this.options.to, this.sysdir(), to), { clobber: true });
		return [to];
	}

	async copyVideo(platform: string, from: string, to: string) {
		return [to];
	}
}
