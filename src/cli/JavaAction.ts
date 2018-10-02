import { BuildAction } from './BuildAction';
import { Platform } from '../Platform';

export class JavaAction extends BuildAction {
	public constructor() {
		super({
			actionName: Platform.Java,
			summary: 'build for the Java target',
			documentation: 'build for the Java target'
		});
	}

    protected onExecute(): Promise<void> { // abstract
        this.prepareBaseOptions();
        this._options.target = Platform.Java;
		return super.onExecute();
	}
}