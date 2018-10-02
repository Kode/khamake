import { BuildAction } from './BuildAction';
import { Platform } from '../Platform';

export class OSXAction extends BuildAction {
	public constructor() {
		super({
			actionName: Platform.OSX,
			summary: 'build for the OSX target',
			documentation: 'build for the OSX target'
		});
	}

    protected onExecute(): Promise<void> { // abstract
        this.prepareBaseOptions();
        this._options.target = Platform.OSX;
		return super.onExecute();
	}
}