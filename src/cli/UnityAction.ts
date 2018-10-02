import { BuildAction } from './BuildAction';
import { Platform } from '../Platform';

export class UnityAction extends BuildAction {
	public constructor() {
		super({
			actionName: Platform.Unity,
			summary: 'build for the Unity target',
			documentation: 'build for the Unity target'
		});
	}

    protected onExecute(): Promise<void> { // abstract
        this.prepareBaseOptions();
        this._options.target = Platform.Unity;
		return super.onExecute();
	}
}