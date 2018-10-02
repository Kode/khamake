import { BuildAction } from './BuildAction';
import { Platform } from '../Platform';

export class PlayStation3Action extends BuildAction {
	public constructor() {
		super({
			actionName: "playstation",
			summary: 'build for the PlayStation3 target',
			documentation: 'build for the PlayStation3 target'
		});
	}

    protected onExecute(): Promise<void> { // abstract
        this.prepareBaseOptions();
        this._options.target = Platform.PlayStation3;
		return super.onExecute();
	}
}