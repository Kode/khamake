import { BuildAction } from './BuildAction';
import { Platform } from '../Platform';

export class tvOSAction extends BuildAction {
	public constructor() {
		super({
			actionName: Platform.tvOS,
			summary: 'build for the tvOS target',
			documentation: 'build for the tvOS target'
		});
	}

    protected onExecute(): Promise<void> { // abstract
        this.prepareBaseOptions();
        this._options.target = Platform.tvOS;
		return super.onExecute();
	}
}