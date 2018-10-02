import { BuildAction } from './BuildAction';
import { Platform } from '../Platform';

export class KromAction extends BuildAction {
	public constructor() {
		super({
			actionName: Platform.Krom,
			summary: 'build for the krom target',
			documentation: 'build for the krom target'
		});
	}

    protected onExecute(): Promise<void> { // abstract
        this.prepareBaseOptions();
        this._options.target = Platform.Krom;
		return super.onExecute();
	}
}