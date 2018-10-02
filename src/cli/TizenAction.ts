import { BuildAction } from './BuildAction';
import { Platform } from '../Platform';

export class TizenAction extends BuildAction {
	public constructor() {
		super({
			actionName: Platform.Tizen,
			summary: 'build for the Tizen target',
			documentation: 'build for the Tizen target'
		});
	}

    protected onExecute(): Promise<void> { // abstract
        this.prepareBaseOptions();
        this._options.target = Platform.Tizen;
		return super.onExecute();
	}
}