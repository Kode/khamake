using UnityEngine;
using System.Collections;

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
}
