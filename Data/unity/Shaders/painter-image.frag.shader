Shader "Custom/painter-image.frag" {
	Properties {
        _tex ("Texture", 2D) = "white" { }
    }
	SubShader {
        Pass {
			Cull Off
			ZTest Always
			
            CGPROGRAM

            #pragma vertex vert
            #pragma fragment frag
            #include "UnityCG.cginc"
            
            uniform sampler2D _tex;
            uniform float4x4 _projectionMatrix;
            
            struct VS_INPUT
			{
				float3 vertexPosition : POSITION;
				float2 texPosition : TEXCOORD0;
				float4 vertexColor : TANGENT;
			};

            struct VS_OUTPUT
			{
				float4 position : POSITION;
			    float4 color : TEXCOORD0;
			    float2 texCoord : TEXCOORD1;
			};

            VS_OUTPUT vert (VS_INPUT input)
            {
				VS_OUTPUT output;
			    output.position = mul(transpose(_projectionMatrix), float4(input.vertexPosition, 1.0));
			    //output.position = float4(input.vertexPosition, 1.0);//mul(transpose(_projectionMatrix), float4(input.vertexPosition, 1.0));
			    //output.position.x /= 200;
			    //output.position.y /= 200;
			    output.position.w = 1.0;
			    output.position.z = 1.0;
				output.texCoord = input.texPosition;
				output.color = input.vertexColor;
			    return output;
            }

            fixed4 frag (VS_OUTPUT input) : SV_Target
            {
            	float2 coord = input.texCoord;
            	coord.y = 1 - coord.y;
			    fixed4 texcolor = tex2D(_tex, coord) * input.color;
			    //texcolor.x = 1.0;
			    //texcolor.y = 0.0;
			    //texcolor.z = 0.0;
			    texcolor.w = 1.0;
				//texcolor.xyz *= input.color.w;
				return texcolor;
            }
            
            ENDCG

        }
    }
}
