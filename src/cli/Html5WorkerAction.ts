import { BuildAction } from './BuildAction';
import { Platform } from '../Platform';

export class HTML5WorkerAction extends BuildAction {
	public constructor() {
		super({
			actionName: Platform.HTML5Worker,
			summary: 'build for the HTML5Worker target',
			documentation: 'build for the HTML5Worker target'
		});
	}

    protected onExecute(): Promise<void> { // abstract
        this.prepareBaseOptions();
        this._options.target = Platform.HTML5Worker;
		return super.onExecute();
	}
}