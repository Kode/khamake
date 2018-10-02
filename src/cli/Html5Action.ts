import { BuildAction } from './BuildAction';
import { CommandLineAction, CommandLineParameter } from "@microsoft/ts-command-line";

export class Html5Action extends BuildAction {
	public constructor() {
		super({
			actionName: 'html',
			summary: 'build for the html5 target',
			documentation: 'build for the html5 target'
		});
	}

	protected onExecute(): Promise<void> { // abstract
		return super.onExecute();
	}
}