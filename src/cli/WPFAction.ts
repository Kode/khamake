import { BuildAction } from './BuildAction';
import { Platform } from '../Platform';
import { CommandLineChoiceParameter } from '@microsoft/ts-command-line';
import { VisualStudioVersion } from '../VisualStudioVersion';

export class WPFAction extends BuildAction {
	private _visualStudio: CommandLineChoiceParameter;
	
	public constructor() {
		super({
			actionName: Platform.WPF,
			summary: 'build for the WPF target',
			documentation: 'build for the WPF target'
		});
	}

    protected onExecute(): Promise<void> { // abstract
        this.prepareBaseOptions();
        this._options.visualstudio = this._visualStudio.value;
        this._options.target = Platform.WPF;
		return super.onExecute();
	}

	protected onDefineParameters(): void { //abstract
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
		
		super.onDefineParameters();
	}
}