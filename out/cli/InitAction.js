"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const init_1 = require("../init");
const ts_command_line_1 = require("@microsoft/ts-command-line");
class InitAction extends ts_command_line_1.CommandLineAction {
    constructor() {
        super({
            actionName: 'init',
            summary: 'Initialize a Kha project',
            documentation: 'Initialize a Kha project inside the current directory'
        });
    }
    onExecute() {
        console.log('Initializing Kha project.\n');
        init_1.run(this._name.value, this._from.value, this._projectFile.value);
        console.log('If you want to use the git version of Kha, execute "git init" and "git submodule add https://github.com/Kode/Kha.git".');
        return Promise.resolve();
    }
    onDefineParameters() {
        this._name = this.defineStringParameter({
            argumentName: "NAME",
            parameterShortName: "-n",
            parameterLongName: "--name",
            description: "Project name to use when initializing a project",
            defaultValue: "Project"
        });
        this._from = this.defineStringParameter({
            argumentName: "PATH",
            parameterShortName: "-f",
            parameterLongName: "--from",
            description: "Location of your project",
            defaultValue: "."
        });
        this._projectFile = this.defineStringParameter({
            argumentName: "PATH",
            parameterLongName: "--projectfile",
            description: "Name of your project file",
            defaultValue: "khafile.js"
        });
    }
}
exports.InitAction = InitAction;
//# sourceMappingURL=InitAction.js.map