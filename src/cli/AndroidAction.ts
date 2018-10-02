import { BuildAction } from './BuildAction';
import { Platform } from '../Platform';
import { CommandLineChoiceParameter } from '@microsoft/ts-command-line';
import { VrApi } from '../VrApi';

export class AndroidAction extends BuildAction {
	private _vrApi: CommandLineChoiceParameter;
	
	public constructor() {
		super({
			actionName: Platform.Android,
			summary: 'build for the Android target',
			documentation: 'build for the Android target'
		});
	}

    protected onExecute(): Promise<void> { // abstract
        this.prepareBaseOptions();
		this._options.target = Platform.Android;
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
                VrApi.GearVr,
                VrApi.Cardboard,
            ],
            defaultValue: VrApi.None
        });
	}
}