import { BuildAction } from './BuildAction';
import { Platform } from '../Platform';
import { CommandLineChoiceParameter } from '@microsoft/ts-command-line';
import { VisualStudioVersion } from '../VisualStudioVersion';
import { VrApi } from '../VrApi';

export class WindowsAppAction extends BuildAction {
	private _visualStudio: CommandLineChoiceParameter;
	private _vrApi: CommandLineChoiceParameter;
	
	public constructor() {
		super({
			actionName: Platform.WindowsApp,
			summary: 'build for the WindowsApp target',
			documentation: 'build for the WindowsApp target'
		});
	}

    protected onExecute(): Promise<void> { // abstract
        this.prepareBaseOptions();
        this._options.target = Platform.WindowsApp;
        this._options.visualstudio = this._visualStudio.value;
        this._options.vr = this._vrApi.value;
		return super.onExecute();
	}

	protected onDefineParameters(): void { //abstract
		super.onDefineParameters();
        this._visualStudio = this.defineChoiceParameter({
            parameterShortName: "-v",
			parameterLongName: "--visualstudio",
            description: "Version of Visual Studio to use",
            alternatives: [
                VisualStudioVersion.VS2010,
                VisualStudioVersion.VS2012,
                VisualStudioVersion.VS2013,
                VisualStudioVersion.VS2015,
                VisualStudioVersion.VS2017,
            ],
            defaultValue: VisualStudioVersion.VS2017
		});
        this._vrApi = this.defineChoiceParameter({
			parameterLongName: "--vr",
            description: "Target VR device",
            alternatives: [
                VrApi.None,
                VrApi.Oculus,
            ],
            defaultValue: VrApi.None
        });
	}
}