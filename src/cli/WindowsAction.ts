import { BuildAction } from './BuildAction';
import { Platform } from '../Platform';

export class WindowsAction extends BuildAction {
	public constructor() {
		super({
			actionName: Platform.Windows,
			summary: 'build for the Windows target',
			documentation: 'build for the Windows target'
		});
	}

    protected onExecute(): Promise<void> { // abstract
        this.prepareBaseOptions();
        this._options.target = Platform.Windows;
		return super.onExecute();
	}
}