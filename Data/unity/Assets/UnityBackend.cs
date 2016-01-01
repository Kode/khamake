using UnityEngine;
using System.Collections;
using System.Reflection;

public struct Point {
	public int x, y;
	
	public Point(int px, int py) {
		x = px;
		y = py;
	}
}

public class UnityBackend : MonoBehaviour {
	void Start() {
		haxe.root.EntryPoint__Main.Main();
	}

	void Update() {
		if (Input.GetKeyDown (KeyCode.LeftArrow)) {
			kha.SystemImpl.leftDown();
		}
		if (Input.GetKeyDown (KeyCode.RightArrow)) {
			kha.SystemImpl.rightDown();
		}
		if (Input.GetKeyDown (KeyCode.UpArrow)) {
			kha.SystemImpl.upDown();
		}
		if (Input.GetKeyDown (KeyCode.DownArrow)) {
			kha.SystemImpl.downDown();
		}
		if (Input.GetKeyUp (KeyCode.LeftArrow)) {
			kha.SystemImpl.leftUp();
		}
		if (Input.GetKeyUp (KeyCode.RightArrow)) {
			kha.SystemImpl.rightUp();
		}
		if (Input.GetKeyUp (KeyCode.UpArrow)) {
			kha.SystemImpl.upUp();
		}
		if (Input.GetKeyUp (KeyCode.DownArrow)) {
			kha.SystemImpl.downUp();
		}
		for (int i = 0; i < 3; ++i) {
			if (Input.GetMouseButtonDown (i)) {
				kha.SystemImpl.mouseDown (i, (int)Input.mousePosition.x, Screen.height - (int)Input.mousePosition.y);
			}
			if (Input.GetMouseButtonUp (i)) {
				kha.SystemImpl.mouseUp (i, (int)Input.mousePosition.x, Screen.height - (int)Input.mousePosition.y);
			}
		}
	}

	void OnPostRender() {
		kha.SystemImpl.update();
	}

	public static bool uvStartsAtTop() {
#if UNITY_UV_STARTS_AT_TOP
		return true;
#else
		return false;
#endif
	}

	public static Texture2D loadImage(string filename) {
		return Resources.Load("Images/" + cutEnding(filename)) as Texture2D;
	}

	public static byte[] loadBlob(string filename) {
		TextAsset asset = Resources.Load("Blobs/" + filename) as TextAsset;
		return asset.bytes;
	}

	private static string cutEnding(string filename) {
		return filename.Substring(0, filename.LastIndexOf('.'));
	}

	/*public static Point getImageSize(Texture2D asset) {
		if (asset != null) {
			string assetPath = AssetDatabase.GetAssetPath(asset);
			TextureImporter importer = AssetImporter.GetAtPath(assetPath) as TextureImporter;
			if (importer != null) {
				object[] args = new object[2] { 0, 0 };
				MethodInfo mi = typeof(TextureImporter).GetMethod("GetWidthAndHeight", BindingFlags.NonPublic | BindingFlags.Instance);
				mi.Invoke(importer, args);
				return new Point((int)args[0], (int)args[1]);
			}
		}
		return new Point(0, 0);
	}*/
}
