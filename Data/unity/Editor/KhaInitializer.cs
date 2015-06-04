using System.Collections;
using System.Linq;
using UnityEditor;
using UnityEngine;
 
public class KhaInitializer : MonoBehaviour
{
    [MenuItem("Kha/Initialize")]
    public static void Initialize()
    {
		var kha = GetKha();
		if (kha.GetComponent<UnityBackend> () != null) {
			Debug.Log("Kha is already initialized.");
			return;
		}
		kha.AddComponent<UnityBackend> ();

		var shaders = Resources.FindObjectsOfTypeAll<Shader> ();
		foreach (var shader in shaders) {
			if (!shader.name.StartsWith("Custom/")) continue;
			var mat = new Material(shader);
			var matname = shader.name.Substring(shader.name.LastIndexOf('/') + 1).Replace('.', '_').Replace('-', '_');
			AssetDatabase.CreateAsset(Instantiate(mat), "Assets/Resources/" + matname + ".mat");
		}
    }

	private static GameObject GetKha()
	{
		return Resources.FindObjectsOfTypeAll<GameObject>()
			.Where(go => string.IsNullOrEmpty(AssetDatabase.GetAssetPath(go))
			       && go.hideFlags == HideFlags.None).ToArray()[0];
	}
}
