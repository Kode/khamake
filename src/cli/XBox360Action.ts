import { BuildAction } from './BuildAction';
import { Platform } from '../Platform';
import { CommandLineChoiceParameter } from '@microsoft/ts-command-line';
import { VisualStudioVersion } from '../VisualStudioVersion';

export class XBox360Action extends BuildAction {
	private _visualStudio: CommandLineChoiceParameter;
	
	public constructor() {
		super({
			actionName: Platform.Xbox360,
			summary: 'build for the Xbox360 target',
			documentation: 'build for the Xbox360 target'
		});
	}

    protected onExecute(): Promise<void> { // abstract
        this.prepareBaseOptions();
        this._options.target = Platform.Xbox360;
        this._options.visualstudio = this._visualStudio.value;
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
		
	}
}