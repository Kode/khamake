"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts_command_line_1 = require("@microsoft/ts-command-line");
const Options_1 = require("../Options");
const AudioApi_1 = require("../AudioApi");
const main_1 = require("../main");
class BuildAction extends ts_command_line_1.CommandLineAction {
    constructor(options) {
        super(options);
        this._options = new Options_1.Options();
    }
    prepareBaseOptions() {
        this._options.from = this._from.value;
        this._options.to = this._to.value;
        this._options.projectfile = this._projectFile.value;
        this._options.main = this._main.value;
        this._options.audio = this._audioAPI.value;
        this._options.kha = this._kha.value;
        this._options.haxe = this._haxe.value;
        this._options.nohaxe = this._noHaxe.value;
        this._options.ffmpeg = this._ffmpeg.value;
        this._options.ogg = this._ogg.value;
        this._options.mp3 = this._mp3.value;
        this._options.aac = this._aac.value;
        this._options.krafix = this._krafix.value;
        this._options.noshaders = this._noShaders.value;
        this._options.noproject = this._noProject.value;
        this._options.onlydata = this._onlyData.value;
        this._options.debug = this._debug.value;
        this._options.silent = this._silent.value;
        this._options.watch = this._watch.value;
        this._options.glsl2 = this._glsl2.value;
        this._options.shaderversion = this._shaderVersion.value;
        this._options.parallelAssetConversion = this._parallelAssetConversion.value;
        this._options.haxe3 = this._haxe3.value;
    }
    onExecute() {
        let logInfo = function (text, newline) {
            if (newline) {
                console.log(text);
            }
            else {
                process.stdout.write(text);
            }
        };
        let logError = function (text, newline) {
            if (newline) {
                console.error(text);
            }
            else {
                process.stderr.write(text);
            }
        };
        return main_1.run(this._options, { info: logInfo, error: logError })
            .then(function (_) { });
    }
    onDefineParameters() {
        this._from = this.defineStringParameter({
            argumentName: "PATH",
            parameterLongName: "--from",
            description: "Location of your project",
            defaultValue: "."
        });
        this._to = this.defineStringParameter({
            argumentName: "PATH",
            parameterLongName: "--to",
            description: "Build location",
            defaultValue: "build"
        });
        this._projectFile = this.defineStringParameter({
            argumentName: "FILENAME",
            parameterLongName: "--projectfile",
            description: "Name of your project file",
            defaultValue: "khafile.js"
        });
        this._main = this.defineStringParameter({
            parameterLongName: "--main",
            description: "Entrypoint for the haxe code (-main argument), defaults to \"Main\"",
            argumentName: "CLASS",
            defaultValue: "Main"
        });
        // TODO: THIS CHOICE IS NEVER USED?
        this._audioAPI = this.defineChoiceParameter({
            parameterShortName: "-a",
            parameterLongName: "--audio",
            description: "Audio api to use",
            alternatives: [
                AudioApi_1.AudioApi.Default,
                AudioApi_1.AudioApi.DirectSound,
                AudioApi_1.AudioApi.WASAPI,
            ],
            defaultValue: AudioApi_1.AudioApi.Default
        });
        this._kha = this.defineStringParameter({
            parameterShortName: "-k",
            parameterLongName: "--kha",
            description: "Location of Kha directory",
            argumentName: "PATH",
            defaultValue: ""
        });
        this._haxe = this.defineStringParameter({
            parameterLongName: "--haxe",
            description: "Location of Haxe directory",
            argumentName: "PATH",
            defaultValue: ""
        });
        this._noHaxe = this.defineFlagParameter({
            parameterLongName: "--nohaxe",
            description: "Do not compile Haxe sources",
        });
        this._ffmpeg = this.defineStringParameter({
            parameterLongName: "--ffmpeg",
            description: "Location of ffmpeg executable",
            argumentName: "PATH",
            defaultValue: ""
        });
        this._ogg = this.defineStringParameter({
            parameterLongName: "--ogg",
            description: "Commandline for running the ogg encoder",
            argumentName: "COMMAND",
            defaultValue: ""
        });
        this._mp3 = this.defineStringParameter({
            parameterLongName: "--mp3",
            description: "Commandline for running the mp3 encoder",
            argumentName: "COMMAND",
            defaultValue: ""
        });
        this._aac = this.defineStringParameter({
            parameterLongName: "--aac",
            description: "Commandline for running the aac encoder",
            argumentName: "COMMAND",
            defaultValue: ""
        });
        this._krafix = this.defineStringParameter({
            parameterLongName: "--krafix",
            description: "Location of krafix shader compiler",
            argumentName: "PATH",
            defaultValue: ""
        });
        this._noShaders = this.defineFlagParameter({
            parameterLongName: "--noshaders",
            description: "Do not compile shaders",
        });
        this._noProject = this.defineFlagParameter({
            parameterLongName: "--noproject",
            description: "Only source files. Don't generate project files",
        });
        this._onlyData = this.defineFlagParameter({
            parameterLongName: "--onlydata",
            description: "Only assets/data. Don\'t generate project files",
        });
        this._debug = this.defineFlagParameter({
            parameterLongName: "--debug",
            description: "Compile in debug mode",
        });
        this._silent = this.defineFlagParameter({
            parameterLongName: "--silent",
            description: "Silent mode",
        });
        this._watch = this.defineFlagParameter({
            parameterShortName: "-w",
            parameterLongName: "--watch",
            description: "Watch files and recompile on change",
        });
        this._glsl2 = this.defineFlagParameter({
            parameterLongName: "--glsl2",
            description: "Use experimental SPIRV-Cross glsl mode",
        });
        this._shaderVersion = this.defineStringParameter({
            parameterLongName: "--shaderversion",
            description: "Set target shader version manually",
            argumentName: "VERSION",
        });
        this._parallelAssetConversion = this.defineIntegerParameter({
            parameterLongName: "--parallel-asset-conversion",
            description: "Experimental - Spawn multiple processes during asset and shader conversion. Possible values:\n  0: disabled (default value)\n -1: choose number of processes automatically\n  N: specify number of processes manually",
            argumentName: "PROCESSES",
            defaultValue: 0,
        });
        this._haxe3 = this.defineFlagParameter({
            parameterLongName: "--haxe3",
            description: "Use the battle tested Haxe 3 compiler instead of the cutting edge not really released yet Haxe 4 compiler",
        });
    }
}
exports.BuildAction = BuildAction;
//# sourceMappingURL=BuildAction.js.map