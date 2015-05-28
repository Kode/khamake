
uniform sampler2D _tex;

struct Input2 {
	float4 gl_Position : POSITION;
	float4 color : TEXCOORD0;
	float2 texCoord : TEXCOORD1;
};

struct Output2 {
	float4 gl_FragColor : COLOR;
};

Output2 frag(Input2 input) {
	Output2 output;
	// Label 5
	float4 texcolor = (tex2D(_tex, float2(input.texCoord.x, 1.0 - input.texCoord.y)) * input.color);
	texcolor = float4((float3(texcolor.x, texcolor.y, texcolor.z) * input.color.w).x, (float3(texcolor.x, texcolor.y, texcolor.z) * input.color.w).y, (float3(texcolor.x, texcolor.y, texcolor.z) * input.color.w).z, texcolor.w);
	output.gl_FragColor = texcolor;
	// Branch to 6
	// Label 6
	return output;
}
