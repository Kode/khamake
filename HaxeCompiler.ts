import * as child_process from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as chokidar from 'chokidar';
import * as log from './log';
import {sys} from './exec';

export class HaxeCompiler {
	from: string;
	haxeDirectory: string;
	hxml: string;
	sourceMatchers: Array<string>;
	watcher: fs.FSWatcher;
	ready: boolean = true;
	todo: boolean = false;
	port: string = '7000';
	temp: string;
	to: string;
		
	constructor(from: string, temp: string, to: string, haxeDirectory: string, hxml: string, sourceDirectories: Array<string>) {
		this.from = from;
		this.temp = temp;
		this.to = to;
		this.haxeDirectory = haxeDirectory;
		this.hxml = hxml;
		
		this.sourceMatchers = [];
		for (let dir of sourceDirectories) {
			this.sourceMatchers.push(path.join(dir, '**'));
		}
	}
	
	async run(watch: boolean) {
		if (watch) {
			this.watcher = chokidar.watch(this.sourceMatchers, { ignored: /[\/\\]\./, persistent: true, ignoreInitial: true });
			this.watcher.on('add', (file: string) => {
				this.scheduleCompile();
			});
			this.watcher.on('change', (file: string) => {
				this.scheduleCompile();
			});
			this.watcher.on('unlink', (file: string) => {
				this.scheduleCompile();
			});
			this.startCompilationServer();
			setTimeout(() => {
				this.scheduleCompile();
			}, 500);
		}
		else await this.compile();
	}
	
	scheduleCompile() {
		if (this.ready) {
			this.triggerCompilationServer();
		}
		else {
			this.todo = true;
		}
	}
	
	startCompilationServer() {
		let exe = 'haxe';
		let env = process.env;
		if (fs.existsSync(this.haxeDirectory) && fs.statSync(this.haxeDirectory).isDirectory()) {
			let localexe = path.resolve(this.haxeDirectory, 'haxe' + sys());
			if (!fs.existsSync(localexe)) localexe = path.resolve(this.haxeDirectory, 'haxe');
			if (fs.existsSync(localexe)) exe = localexe;
			const stddir = path.resolve(this.haxeDirectory, 'std');
			if (fs.existsSync(stddir) && fs.statSync(stddir).isDirectory()) {
				env.HAXE_STD_PATH = stddir;
			}
		}
		
		let haxe = child_process.spawn(exe, ['--wait', this.port], {env: env, cwd: path.normalize(this.from)});
		
		haxe.stdout.on('data', (data) => {
			log.info(data.toString());
		});

		haxe.stderr.on('data', (data) => {
			log.error(data.toString());
		});
		
		haxe.on('close', (code) => {
			log.error('Haxe compilation server stopped.');
		});
	}
	
	triggerCompilationServer() {
		return new Promise((resolve, reject) => {
			let exe = 'haxe';
			let env = process.env;
			if (fs.existsSync(this.haxeDirectory) && fs.statSync(this.haxeDirectory).isDirectory()) {
				let localexe = path.resolve(this.haxeDirectory, 'haxe' + sys());
				if (!fs.existsSync(localexe)) localexe = path.resolve(this.haxeDirectory, 'haxe');
				if (fs.existsSync(localexe)) exe = localexe;
				const stddir = path.resolve(this.haxeDirectory, 'std');
				if (fs.existsSync(stddir) && fs.statSync(stddir).isDirectory()) {
					env.HAXE_STD_PATH = stddir;
				}
			}
			console.log('Haxe compile start.');
			//haxe --connect 6000 --cwd myproject.hxml
			let haxe = child_process.spawn(exe, ['--connect', this.port, this.hxml], {env: env, cwd: path.normalize(this.from)});
			
			haxe.stdout.on('data', (data) => {
				log.info(data.toString());
			});

			haxe.stderr.on('data', (data) => {
				log.error(data.toString());
			});
			
			haxe.on('close', (code) => {
				if (this.to) {
					fs.renameSync(path.join('build', this.temp), path.join('build', this.to));
				}
				this.ready = true;
				if (this.todo) {
					this.scheduleCompile();
				}
				console.log('Haxe compile end.');
				if (code === 0) resolve();
				else reject('Haxe compiler error.')
			});
		});
	}
	
	compile(): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			let exe = 'haxe';
			let env = process.env;
			if (fs.existsSync(this.haxeDirectory) && fs.statSync(this.haxeDirectory).isDirectory()) {
				let localexe = path.resolve(this.haxeDirectory, 'haxe' + sys());
				if (!fs.existsSync(localexe)) localexe = path.resolve(this.haxeDirectory, 'haxe');
				if (fs.existsSync(localexe)) exe = localexe;
				const stddir = path.resolve(this.haxeDirectory, 'std');
				if (fs.existsSync(stddir) && fs.statSync(stddir).isDirectory()) {
					env.HAXE_STD_PATH = stddir;
				}
			}
			log.info('Compiling code.');
			let haxe = child_process.spawn(exe, [this.hxml], {env: env, cwd: path.normalize(this.from)});
			
			haxe.stdout.on('data', (data) => {
				log.info(data.toString());
			});

			haxe.stderr.on('data', (data) => {
				log.error(data.toString());
			});
			
			haxe.on('close', (code) => {
				if (code === 0) {
					if (this.to) {
						fs.renameSync(path.join('build', this.temp), path.join('build', this.to));
					}
					resolve();
				}
				else {
					process.exitCode = 1;
					reject('Haxe compiler error.');
				}
			});
		});
	}
	
	private static spinRename(from: string, to: string): void {
		for (;;) {
			if (fs.existsSync(from)) {
				fs.renameSync(from, to);
				return;
			}
		}
	}
}
