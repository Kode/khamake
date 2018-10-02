import { BuildAction } from './BuildAction';
import { Platform } from '../Platform';

export class XBox360Action extends BuildAction {
	public constructor() {
		super({
			actionName: "xbox",
			summary: 'build for the Xbox360 target',
			documentation: 'build for the Xbox360 target'
		});
	}

    protected onExecute(): Promise<void> { // abstract
        this.prepareBaseOptions();
        this._options.target = Platform.Xbox360;
		return super.onExecute();
	}
}