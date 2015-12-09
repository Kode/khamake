"use strict";

const path = require('path');
const CSharpExporter = require('./CSharpExporter.js');
const Converter = require('./Converter.js');
const Files = require('./Files.js');
const Haxe = require('./Haxe.js');
const Options = require('./Options.js');
const Paths = require('./Paths.js');
const exportImage = require('./ImageTool.js');
const fs = require('fs-extra');
const uuid = require('./uuid.js');

class PlayStationMobileExporter extends CSharpExporter {
	constructor(khaDirectory, directory) {
		super(khaDirectory, directory);
		this.directory = directory;
		this.files = [];
	}

	sysdir() {
		return 'psm';
	}

	backend() {
		return "PSM";
	}

	exportSLN(projectUuid) {
		this.createDirectory(this.directory.resolve(Paths.get(this.sysdir() + '-build')));
		this.writeFile(this.directory.resolve(Paths.get(this.sysdir() + "-build", "Project.sln")));
		const solutionUuid = uuid.v4();

		this.p("Microsoft Visual Studio Solution File, Format Version 11.00");
		this.p("# Visual Studio 2010");
		this.p("Project(\"{" + solutionUuid.toString().toUpperCase() + "}\") = \"HaxeProject\", \"Project.csproj\", \"{" + projectUuid.toString().toUpperCase() + "}\"");
		this.p("EndProject");
		this.p("Global");
		this.p("GlobalSection(SolutionConfigurationPlatforms) = preSolution", 1);
		this.p("Debug|Any CPU = Debug|Any CPU", 2);
		this.p("Release|Any CPU = Release|Any CPU", 2);
		this.p("EndGlobalSection", 1);
		this.p("GlobalSection(ProjectConfigurationPlatforms) = postSolution", 1);
		this.p("{" + projectUuid.toString().toUpperCase() + "}.Debug|Any CPU.ActiveCfg = Debug|Any CPU", 2);
		this.p("{" + projectUuid.toString().toUpperCase() + "}.Debug|Any CPU.Build.0 = Debug|Any CPU", 2);
		this.p("{" + projectUuid.toString().toUpperCase() + "}.Release|Any CPU.ActiveCfg = Release|Any CPU", 2);
		this.p("{" + projectUuid.toString().toUpperCase() + "}.Release|Any CPU.Build.0 = Release|Any CPU", 2);
		this.p("EndGlobalSection", 1);
		this.p("GlobalSection(MonoDevelopProperties) = preSolution", 1);
		this.p("StartupItem = Project.csproj", 2);
		this.p("EndGlobalSection", 1);
		this.p("EndGlobal");
		this.closeFile();
	}

	exportResources() {
		this.createDirectory(this.directory.resolve(Paths.get(this.sysdir() + "-build", "shaders")));
		fs.writeFileSync(this.directory.resolve(Paths.get(this.sysdir() + "-build", "shaders", "Simple.fcg")).toString(),
			"void main(float4 out Color : COLOR, uniform float4 MaterialColor) {\n"
			+ "\tColor = MaterialColor;\n"
			+ "}\n");

		fs.writeFileSync(this.directory.resolve(Paths.get(this.sysdir() + "-build", "shaders", "Simple.vcg")).toString(),
			"void main(float4 in a_Position : POSITION, float4 out v_Position : POSITION, uniform float4x4 WorldViewProj) {\n"
			+ "\tv_Position = mul(a_Position, WorldViewProj);\n"
			+ "}\n");

		fs.writeFileSync(this.directory.resolve(Paths.get(this.sysdir() + "-build", "shaders", "Texture.fcg")).toString(),
			"void main(float2 in  v_TexCoord : TEXCOORD0, float4 out Color : COLOR, uniform sampler2D Texture0 : TEXUNIT0) {\n"
			+ "\tColor = tex2D(Texture0, v_TexCoord);\n"
			+ "}\n");

		fs.writeFileSync(this.directory.resolve(Paths.get(this.sysdir() + "-build", "shaders", "Texture.vcg")).toString(),
			"void main(float4 in a_Position : POSITION, float2 in a_TexCoord : TEXCOORD0, float4 out v_Position : POSITION, float2 out v_TexCoord : TEXCOORD0, uniform float4x4 WorldViewProj) {\n"
			+ "\tv_Position = mul(a_Position, WorldViewProj);\n"
			+ "\tv_TexCoord  = a_TexCoord;\n"
			+ "}\n");

		let appxml = this.directory.resolve(Paths.get(this.sysdir() + "-build", "app.xml"));
		if (!Files.exists(appxml)) {
			let appxmltext = fs.readFileSync(path.join(__dirname, "Data", "psm", "app.xml"), {encoding: 'utf8'});
			fs.writeFileSync(appxml.toString(), appxmltext);
		}
	}

	exportCsProj(projectUuid) {
		this.writeFile(this.directory.resolve(Paths.get(this.sysdir() + "-build", "Project.csproj")));
		this.p("<?xml version=\"1.0\" encoding=\"utf-8\"?>");
		this.p("<Project DefaultTargets=\"Build\" ToolsVersion=\"4.0\" xmlns=\"http://schemas.microsoft.com/developer/msbuild/2003\">");
		this.p("<PropertyGroup>", 1);
		this.p("<Configuration Condition=\" '$(Configuration)' == '' \">Debug</Configuration>", 2);
		this.p("<Platform Condition=\" '$(Platform)' == '' \">AnyCPU</Platform>", 2);
		this.p("<ProductVersion>10.0.0</ProductVersion>", 2);
		this.p("<SchemaVersion>2.0</SchemaVersion>", 2);
		this.p("<ProjectGuid>{" + projectUuid.toString().toUpperCase() + "}</ProjectGuid>", 2);
		this.p("<ProjectTypeGuids>{69878862-DA7D-4DC6-B0A1-50D8FAB4242F};{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}</ProjectTypeGuids>", 2);
		this.p("<OutputType>Exe</OutputType>", 2);
		this.p("<RootNamespace>PSTest</RootNamespace>", 2);
		this.p("<AssemblyName>PSTest</AssemblyName>", 2);
		this.p("</PropertyGroup>", 1);
		this.p("<PropertyGroup Condition=\" '$(Configuration)|$(Platform)' == 'Debug|AnyCPU' \">", 1);
		this.p("<DebugSymbols>true</DebugSymbols>", 2);
		this.p("<DebugType>full</DebugType>", 2);
		this.p("<Optimize>false</Optimize>", 2);
		this.p("<OutputPath>bin\\Debug</OutputPath>", 2);
		this.p("<DefineConstants>DEBUG;</DefineConstants>", 2);
		this.p("<ErrorReport>prompt</ErrorReport>", 2);
		this.p("<WarningLevel>4</WarningLevel>", 2);
		this.p("<ConsolePause>false</ConsolePause>", 2);
		this.p("</PropertyGroup>", 1);
		this.p("<PropertyGroup Condition=\" '$(Configuration)|$(Platform)' == 'Release|AnyCPU' \">", 1);
		this.p("<DebugType>none</DebugType>", 2);
		this.p("<Optimize>true</Optimize>", 2);
		this.p("<OutputPath>bin\\Release</OutputPath>", 2);
		this.p("<ErrorReport>prompt</ErrorReport>", 2);
		this.p("<WarningLevel>4</WarningLevel>", 2);
		this.p("<ConsolePause>false</ConsolePause>", 2);
		this.p("</PropertyGroup>", 1);
		this.p("<ItemGroup>", 1);
		this.p("<Reference Include=\"System\" />", 2);
		this.p("<Reference Include=\"System.Xml\" />", 2);
		this.p("<Reference Include=\"System.Core\" />", 2);
		this.p("<Reference Include=\"Sce.PlayStation.Core\" />", 2);
		this.p("</ItemGroup>", 1);
		this.p("<ItemGroup>", 1);
		this.includeFiles(this.directory.resolve(Paths.get(this.sysdir() + "-build", "Sources", "src")), this.directory.resolve(this.sysdir() + "-build"));
		this.p("</ItemGroup>", 1);
		this.p("<ItemGroup>", 1);
		this.p("<ShaderProgram Include=\"shaders\\Simple.fcg\" />", 2);
		this.p("<ShaderProgram Include=\"shaders\\Simple.vcg\" />", 2);
		this.p("<ShaderProgram Include=\"shaders\\Texture.fcg\" />", 2);
		this.p("<ShaderProgram Include=\"shaders\\Texture.vcg\" />", 2);
		this.p("</ItemGroup>", 1);
		this.p("<ItemGroup>", 1);
		this.p("<Folder Include=\"resources\\\" />", 2);
		this.p("</ItemGroup>", 1);
		this.p("<ItemGroup>", 1);
		for (let file of this.files) {
			this.p("<Content Include=\"..\\" + this.sysdir() + "\\" + file.toString() + "\">", 2);
			this.p("<Link>resources\\" + file.toString() + "</Link>", 3);
			this.p("</Content>", 2);
		}
		this.p("</ItemGroup>", 1);
		this.p("<Import Project=\"$(MSBuildExtensionsPath)\\Sce\\Sce.Psm.CSharp.targets\" />", 1);
		this.p("</Project>");
		this.closeFile();
	}

	/*copyMusic(platform, from, to, encoders, callback) {
		callback();
	}*/

	copySound(platform, from, to, encoders) {
		return [];
	}

	copyImage(platform, from, to, asset) {
		this.files.push(Paths.get(asset["file"]));
		let format = exportImage(from, this.directory.resolve(this.sysdir()).resolve(to), asset, undefined, false);
		return [to + '.' + format];
	}

	copyBlob(platform, from, to) {
		fs.copySync(from.toString(), this.directory.resolve(this.sysdir()).resolve(to).toString(), { clobber: true });
		this.files.push(to);
		return [to];
	}

	copyVideo(platform, from, to, encoders) {
		return [];
	}
}

module.exports = PlayStationMobileExporter;
