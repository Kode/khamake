import { BuildAction } from './BuildAction';
import { Platform } from '../Platform';
import { VrApi } from '../VrApi';
import { CommandLineChoiceParameter } from '@microsoft/ts-command-line';

export class KromAction extends BuildAction {
	private _vrApi: CommandLineChoiceParameter;
	
	public constructor() {
		super({
			actionName: Platform.Krom,
			summary: 'build for the krom target',
			documentation: 'build for the krom target'
		});
	}

    protected onExecute(): Promise<void> { // abstract
        this.prepareBaseOptions();
        this._options.target = Platform.Krom;
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
                VrApi.WebVR,
            ],
            defaultValue: VrApi.None
        });
	}
}