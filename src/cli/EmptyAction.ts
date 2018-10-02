import { BuildAction } from './BuildAction';
import { Platform } from '../Platform';

export class EmptyAction extends BuildAction {
	public constructor() {
		super({
			actionName: Platform.Empty,
			summary: 'build for the Empty target',
			documentation: 'build for the Empty target'
		});
	}

    protected onExecute(): Promise<void> { // abstract
        this.prepareBaseOptions();
        this._options.target = Platform.Empty;
		return super.onExecute();
	}
}