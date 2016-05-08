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
	watcher: chokidar.FSWatcher;
	ready: boolean = true;
	todo: boolean = false;
	port: string = '7000';
		
	constructor(from: string, haxeDirectory: string, hxml: string, sourceDirectories: Array<string>) {
		this.from = from;
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
	
	compile(): Promise<{}> {
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
			let haxe = child_process.spawn(exe, [this.hxml], {env: env, cwd: path.normalize(this.from)});
			
			haxe.stdout.on('data', (data) => {
				log.info(data.toString());
			});

			haxe.stderr.on('data', (data) => {
				log.error(data.toString());
			});
			
			haxe.on('close', (code) => {
				console.log('Haxe compile end.');
				if (code === 0) resolve();
				else reject('Haxe compiler error.')
			});
		});
	}
}
