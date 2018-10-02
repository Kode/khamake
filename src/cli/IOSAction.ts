import { BuildAction } from './BuildAction';
import { Platform } from '../Platform';

export class iOSAction extends BuildAction {
	public constructor() {
		super({
			actionName: Platform.iOS,
			summary: 'build for the iOS target',
			documentation: 'build for the iOS target'
		});
	}

    protected onExecute(): Promise<void> { // abstract
        this.prepareBaseOptions();
        this._options.target = Platform.iOS;
		return super.onExecute();
	}
}