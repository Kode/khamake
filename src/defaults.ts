import {GraphicsApi} from './GraphicsApi';
import {Platform} from './Platform';

export function graphicsApi(platform: string): string {
	switch (platform) {
	case Platform.Empty:
	case Platform.Node:
	case Platform.Android:
	case Platform.HTML5:
	case Platform.DebugHTML5:
	case Platform.HTML5Worker:
	case Platform.Pi:
	case Platform.Linux:
		return GraphicsApi.OpenGL;
	case Platform.tvOS:
	case Platform.iOS:
	case Platform.OSX:
		return GraphicsApi.Metal;
	case Platform.Windows:
	case Platform.WindowsApp:
		return GraphicsApi.Direct3D11;
	case Platform.Krom:
		if (process.platform === 'win32') {
			return GraphicsApi.Direct3D11;
		}
		else if (process.platform === 'darwin') {
			return GraphicsApi.Metal;
		}
		else {
			return GraphicsApi.OpenGL;
		}
	default:
		return platform;
	}
}
