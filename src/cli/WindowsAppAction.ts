import { BuildAction } from './BuildAction';
import { Platform } from '../Platform';

export class WindowsAppAction extends BuildAction {
	public constructor() {
		super({
			actionName: Platform.WindowsApp,
			summary: 'build for the WindowsApp target',
			documentation: 'build for the WindowsApp target'
		});
	}

    protected onExecute(): Promise<void> { // abstract
        this.prepareBaseOptions();
        this._options.target = Platform.WindowsApp;
		return super.onExecute();
	}
}