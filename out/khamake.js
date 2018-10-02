"use strict";
// Called from entry point, e.g. Kha/make.js
// This is where options are processed:
// e.g. '-t html5 --server'
Object.defineProperty(exports, "__esModule", { value: true });
const ts_command_line_1 = require("@microsoft/ts-command-line");
const InitAction_1 = require("./cli/InitAction");
const ServerAction_1 = require("./cli/ServerAction");
const Html5Action_1 = require("./cli/Html5Action");
const KromAction_1 = require("./cli/KromAction");
const IOSAction_1 = require("./cli/IOSAction");
const OSXAction_1 = require("./cli/OSXAction");
const PlayStation3Action_1 = require("./cli/PlayStation3Action");
const WindowsAction_1 = require("./cli/WindowsAction");
const WindowsAppAction_1 = require("./cli/WindowsAppAction");
const AndroidAction_1 = require("./cli/AndroidAction");
const XBox360Action_1 = require("./cli/XBox360Action");
const LinuxAction_1 = require("./cli/LinuxAction");
const Html5WorkerAction_1 = require("./cli/Html5WorkerAction");
const FlashAction_1 = require("./cli/FlashAction");
const WPFAction_1 = require("./cli/WPFAction");
const JavaAction_1 = require("./cli/JavaAction");
const PlaystationMobileAction_1 = require("./cli/PlaystationMobileAction");
const TizenAction_1 = require("./cli/TizenAction");
const UnityAction_1 = require("./cli/UnityAction");
const NodeAction_1 = require("./cli/NodeAction");
const DebugHtml5Action_1 = require("./cli/DebugHtml5Action");
const PiAction_1 = require("./cli/PiAction");
const TVOSAction_1 = require("./cli/TVOSAction");
const EmptyAction_1 = require("./cli/EmptyAction");
class KhamakeCommandLine extends ts_command_line_1.CommandLineParser {
    constructor() {
        super({
            toolFilename: 'khamake',
            toolDescription: 'Build tool for Kha'
        });
        this._populateActions();
    }
    onDefineParameters() {
        // No parameters
    }
    _populateActions() {
        this.addAction(new InitAction_1.InitAction());
        this.addAction(new ServerAction_1.ServerAction());
        this.addAction(new KromAction_1.KromAction());
        this.addAction(new WindowsAction_1.WindowsAction());
        this.addAction(new WindowsAppAction_1.WindowsAppAction());
        this.addAction(new PlayStation3Action_1.PlayStation3Action());
        this.addAction(new IOSAction_1.iOSAction());
        this.addAction(new OSXAction_1.OSXAction());
        this.addAction(new AndroidAction_1.AndroidAction());
        this.addAction(new XBox360Action_1.XBox360Action());
        this.addAction(new LinuxAction_1.LinuxAction());
        this.addAction(new Html5Action_1.Html5Action());
        this.addAction(new Html5WorkerAction_1.HTML5WorkerAction());
        this.addAction(new FlashAction_1.FlashAction());
        this.addAction(new WPFAction_1.WPFAction());
        this.addAction(new JavaAction_1.JavaAction());
        this.addAction(new PlaystationMobileAction_1.PlayStationMobileAction());
        this.addAction(new TizenAction_1.TizenAction());
        this.addAction(new UnityAction_1.UnityAction());
        this.addAction(new NodeAction_1.NodeAction());
        this.addAction(new DebugHtml5Action_1.DebugHTML5Action());
        this.addAction(new EmptyAction_1.EmptyAction());
        this.addAction(new PiAction_1.PiAction());
        this.addAction(new TVOSAction_1.tvOSAction());
    }
}
// allow numbers to be used in action names
ts_command_line_1.CommandLineAction["_actionNameRegExp"] = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const parser = new KhamakeCommandLine();
parser.execute();
//# sourceMappingURL=khamake.js.map