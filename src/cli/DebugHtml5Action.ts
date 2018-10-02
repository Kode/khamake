import { BuildAction } from './BuildAction';
import { Platform } from '../Platform';

export class DebugHTML5Action extends BuildAction {
	public constructor() {
		super({
			actionName: Platform.DebugHTML5,
			summary: 'build for the DebugHTML5 target',
			documentation: 'build for the DebugHTML5 target'
		});
	}

    protected onExecute(): Promise<void> { // abstract
        this.prepareBaseOptions();
        this._options.target = Platform.DebugHTML5;
		return super.onExecute();
	}
}