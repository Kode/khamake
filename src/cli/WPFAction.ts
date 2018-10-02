import { BuildAction } from './BuildAction';
import { Platform } from '../Platform';

export class WPFAction extends BuildAction {
	public constructor() {
		super({
			actionName: Platform.WPF,
			summary: 'build for the WPF target',
			documentation: 'build for the WPF target'
		});
	}

    protected onExecute(): Promise<void> { // abstract
        this.prepareBaseOptions();
        this._options.target = Platform.WPF;
		return super.onExecute();
	}
}