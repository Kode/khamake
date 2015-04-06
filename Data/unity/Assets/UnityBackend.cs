using UnityEngine;
using System.Collections;
using UnityEditor;
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

	}

	void OnPostRender() {
		kha.Starter.update();
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

	public static Point getImageSize(Texture2D asset) {
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
	}
}
