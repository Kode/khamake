import { BuildAction } from './BuildAction';
import { Platform } from '../Platform';

export class Html5Action extends BuildAction {
	public constructor() {
		super({
			actionName: 'html',
			summary: 'build for the html5 target',
			documentation: 'build for the html5 target'
		});
	}

    protected onExecute(): Promise<void> { // abstract
        this.prepareBaseOptions();
        this._options.target = Platform.HTML5;
		return super.onExecute();
	}
}