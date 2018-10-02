// Called from entry point, e.g. Kha/make.js
// This is where options are processed:
// e.g. '-t html5 --server'

import { CommandLineParser, CommandLineAction } from '@microsoft/ts-command-line';
import { InitAction } from './cli/InitAction';
import { ServerAction } from './cli/ServerAction';
import { Html5Action } from './cli/Html5Action';
import { KromAction } from './cli/KromAction';
import { iOSAction } from './cli/IOSAction';
import { OSXAction } from './cli/OSXAction';
import { PlayStation3Action } from './cli/PlayStation3Action';
import { WindowsAction } from './cli/WindowsAction';
import { WindowsAppAction } from './cli/WindowsAppAction';
import { AndroidAction } from './cli/AndroidAction';
import { XBox360Action } from './cli/XBox360Action';
import { LinuxAction } from './cli/LinuxAction';
import { HTML5WorkerAction } from './cli/Html5WorkerAction';
import { FlashAction } from './cli/FlashAction';
import { WPFAction } from './cli/WPFAction';
import { JavaAction } from './cli/JavaAction';
import { PlayStationMobileAction } from './cli/PlaystationMobileAction';
import { TizenAction } from './cli/TizenAction';
import { UnityAction } from './cli/UnityAction';
import { NodeAction } from './cli/NodeAction';
import { DebugHTML5Action } from './cli/DebugHtml5Action';
import { PiAction } from './cli/PiAction';
import { tvOSAction } from './cli/TVOSAction';
import { EmptyAction } from './cli/EmptyAction';

class KhamakeCommandLine extends CommandLineParser {
	constructor() {
		super({
			toolFilename: 'khamake',
			toolDescription: 'Build tool for Kha'
		});
		this._populateActions();
	}

	protected onDefineParameters(): void { // override
		// No parameters
	}

	private _populateActions(): void {
		this.addAction(new InitAction());
		this.addAction(new ServerAction());
		this.addAction(new KromAction());
		this.addAction(new WindowsAction());
		this.addAction(new WindowsAppAction());
		this.addAction(new PlayStation3Action());
		this.addAction(new iOSAction());
		this.addAction(new OSXAction());
		this.addAction(new AndroidAction());
		this.addAction(new XBox360Action());
		this.addAction(new LinuxAction());
		this.addAction(new Html5Action());
		this.addAction(new HTML5WorkerAction());
		this.addAction(new FlashAction());
		this.addAction(new WPFAction());
		this.addAction(new JavaAction());
		this.addAction(new PlayStationMobileAction());
		this.addAction(new TizenAction());
		this.addAction(new UnityAction());
		this.addAction(new NodeAction());
		this.addAction(new DebugHTML5Action());
		this.addAction(new EmptyAction());
		this.addAction(new PiAction());
		this.addAction(new tvOSAction());
	}
}

// allow numbers to be used in action names
CommandLineAction["_actionNameRegExp"] = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const parser: KhamakeCommandLine = new KhamakeCommandLine();
parser.execute();
