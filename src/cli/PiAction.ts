import { BuildAction } from './BuildAction';
import { Platform } from '../Platform';

export class PiAction extends BuildAction {
	public constructor() {
		super({
			actionName: Platform.Pi,
			summary: 'build for the Pi target',
			documentation: 'build for the Pi target'
		});
	}

    protected onExecute(): Promise<void> { // abstract
        this.prepareBaseOptions();
        this._options.target = Platform.Pi;
		return super.onExecute();
	}
}