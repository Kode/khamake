import { BuildAction } from './BuildAction';
import { Platform } from '../Platform';

export class FlashAction extends BuildAction {
	public constructor() {
		super({
			actionName: Platform.Flash,
			summary: 'build for the Flash target',
			documentation: 'build for the Flash target'
		});
	}

    protected onExecute(): Promise<void> { // abstract
        this.prepareBaseOptions();
        this._options.target = Platform.Flash;
		return super.onExecute();
	}
}