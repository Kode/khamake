import { BuildAction } from './BuildAction';
import { Platform } from '../Platform';

export class Html5Action extends BuildAction {
	public constructor() {
		super({
			actionName: Platform.HTML5,
			summary: 'build for the HTML5 target',
			documentation: 'build for the HTML5 target'
		});
	}

    protected onExecute(): Promise<void> { // abstract
        this.prepareBaseOptions();
        this._options.target = Platform.HTML5;
		return super.onExecute();
	}
}