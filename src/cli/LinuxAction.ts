import { BuildAction } from './BuildAction';
import { Platform } from '../Platform';

export class LinuxAction extends BuildAction {
	public constructor() {
		super({
			actionName: Platform.Linux,
			summary: 'build for the Linux target',
			documentation: 'build for the Linux target'
		});
	}

    protected onExecute(): Promise<void> { // abstract
        this.prepareBaseOptions();
        this._options.target = Platform.Linux;
		return super.onExecute();
	}
}