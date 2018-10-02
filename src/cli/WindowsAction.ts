import { BuildAction } from './BuildAction';
import { Platform } from '../Platform';
import { CommandLineChoiceParameter } from '@microsoft/ts-command-line';
import { VisualStudioVersion } from '../VisualStudioVersion';

export class WindowsAction extends BuildAction {
	private _visualStudio: CommandLineChoiceParameter;
	
	public constructor() {
		super({
			actionName: Platform.Windows,
			summary: 'build for the Windows target',
			documentation: 'build for the Windows target'
		});
	}

    protected onExecute(): Promise<void> { // abstract
        this.prepareBaseOptions();
        this._options.visualstudio = this._visualStudio.value;
        this._options.target = Platform.Windows;
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