import { BuildAction } from './BuildAction';
import { Platform } from '../Platform';

export class PlayStationMobileAction extends BuildAction {
	public constructor() {
		super({
			actionName: Platform.PlayStationMobile,
			summary: 'build for the PlayStationMobile target',
			documentation: 'build for the PlayStationMobile target'
		});
	}

    protected onExecute(): Promise<void> { // abstract
        this.prepareBaseOptions();
        this._options.target = Platform.PlayStationMobile;
		return super.onExecute();
	}
}