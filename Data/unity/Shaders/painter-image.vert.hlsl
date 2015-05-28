uniform float4 dx_ViewAdjust;
uniform float4x4 _projectionMatrix;

struct Input {
	float2 texPosition : TEXCOORD0;
	float4 vertexColor : TANGENT;
	float3 vertexPosition : POSITION;
};

struct Output {
	float4 gl_Position : POSITION;
	float4 color : TEXCOORD0;
	float2 texCoord : TEXCOORD1;
};

Output vert(Input input) {
	Output output;
	// Label 5
	output.gl_Position = mul(transpose(_projectionMatrix), float4(input.vertexPosition.x, input.vertexPosition.y, input.vertexPosition.z, 1.0));
	output.texCoord = input.texPosition;
	output.color = input.vertexColor;
	// Branch to 6
	// Label 6
	//output.gl_Position.x = output.gl_Position.x - dx_ViewAdjust.x * output.gl_Position.w;
	//output.gl_Position.y = output.gl_Position.y + dx_ViewAdjust.y * output.gl_Position.w;
	output.gl_Position.z = 0.5;//(output.gl_Position.z + output.gl_Position.w) * 0.5;
	return output;
}
