import { BuildAction } from './BuildAction';
import { Platform } from '../Platform';
import { CommandLineChoiceParameter } from '@microsoft/ts-command-line';
import { VrApi } from '../VrApi';

export class iOSAction extends BuildAction {
	private _vrApi: CommandLineChoiceParameter;
	
	public constructor() {
		super({
			actionName: Platform.iOS,
			summary: 'build for the iOS target',
			documentation: 'build for the iOS target'
		});
	}

    protected onExecute(): Promise<void> { // abstract
        this.prepareBaseOptions();
        this._options.target = Platform.iOS;
        this._options.vr = this._vrApi.value;
		return super.onExecute();
	}
	
	protected onDefineParameters(): void { //abstract
		super.onDefineParameters();
        this._vrApi = this.defineChoiceParameter({
			parameterLongName: "--vr",
            description: "Target VR device",
            alternatives: [
                VrApi.None,
                VrApi.Cardboard,
            ],
            defaultValue: VrApi.None
        });
	}
}