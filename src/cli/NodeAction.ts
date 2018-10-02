import { BuildAction } from './BuildAction';
import { Platform } from '../Platform';

export class NodeAction extends BuildAction {
	public constructor() {
		super({
			actionName: Platform.Node,
			summary: 'build for the Node target',
			documentation: 'build for the Node target'
		});
	}

    protected onExecute(): Promise<void> { // abstract
        this.prepareBaseOptions();
        this._options.target = Platform.Node;
		return super.onExecute();
	}
}