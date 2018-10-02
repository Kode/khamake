import { BuildAction } from './BuildAction';
import { Platform } from '../Platform';

export class AndroidAction extends BuildAction {
	public constructor() {
		super({
			actionName: Platform.Android,
			summary: 'build for the Android target',
			documentation: 'build for the Android target'
		});
	}

    protected onExecute(): Promise<void> { // abstract
        this.prepareBaseOptions();
        this._options.target = Platform.Android;
		return super.onExecute();
	}
}