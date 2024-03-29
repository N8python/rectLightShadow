import * as THREE from 'https://cdn.skypack.dev/pin/three@v0.137.0-X5O2PK3x44y1WRry67Kr/mode=imports/optimized/three.js';

const VerticalBlurShader = {

    uniforms: {

        'tDiffuse': { value: null },
        'sceneDepth': { value: null },
        'blurSharp': { value: 0 },
        'depthBias': { value: 5.0 },
        'near': { value: 0 },
        'far': { value: 0 },
        'v': { value: 1.0 / 512.0 },
        'resolution': { value: new THREE.Vector2() },
        'blurThreshold': { value: 0.25 }

    },

    vertexShader: /* glsl */ `
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,

    fragmentShader: /* glsl */ `
		uniform sampler2D tDiffuse;
		uniform sampler2D sceneDepth;
		uniform vec2 resolution;
		uniform float v;
		uniform float near;
		uniform float blurSharp;
		uniform float blurThreshold;
		uniform float depthBias;
		uniform float far;
		varying vec2 vUv;
		float linearize_depth(float d,float zNear,float zFar)
        {
            return zNear * zFar / (zFar + d * (zNear - zFar));
        }
		float depthFalloff(vec2 uv, float d) {
			float uvDepth = linearize_depth(texture2D(sceneDepth, uv).x, 0.1, 1000.0);
			return exp(-1.0 * depthBias * abs(uvDepth - d));
		}
		void main() {
			vec4 sum = vec4( 0.0 );
			float[9] weights =  float[9](0.051, 0.0918, 0.12245, 0.1531, 0.1633, 0.1531, 0.12245, 0.0918, 0.051);
			float weightSum = 0.0;
			float d = texture2D(sceneDepth, vUv).x;
			float b = texture2D(tDiffuse, vUv).x;
			float uvDepth = linearize_depth(d, 0.1, 1000.0);
			float radius = max(v * (1.0 - d) * (-blurSharp * pow(b - 0.5, 2.0) + 1.0), blurThreshold / resolution.y);
			for(float i = -4.0; i <= 4.0; i++) {
				vec2 sampleUv = vec2( vUv.x, vUv.y + i * radius );
				float w = weights[int(i + 4.0)] * depthFalloff(sampleUv, uvDepth);
				sum += texture2D( tDiffuse, sampleUv) * w;
				weightSum += w;
			}
			sum /= weightSum;
		/*	sum += texture2D( tDiffuse, vec2( vUv.x - 3.0 * radius, vUv.y ) ) * 0.0918;
			sum += texture2D( tDiffuse, vec2( vUv.x - 2.0 * radius, vUv.y ) ) * 0.12245;
			sum += texture2D( tDiffuse, vec2( vUv.x - 1.0 * radius, vUv.y ) ) * 0.1531;
			sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y ) ) * 0.1633;
			sum += texture2D( tDiffuse, vec2( vUv.x + 1.0 * radius, vUv.y ) ) * 0.1531;
			sum += texture2D( tDiffuse, vec2( vUv.x + 2.0 * radius, vUv.y ) ) * 0.12245;
			sum += texture2D( tDiffuse, vec2( vUv.x + 3.0 * radius, vUv.y ) ) * 0.0918;
			sum += texture2D( tDiffuse, vec2( vUv.x + 4.0 * radius, vUv.y ) ) * 0.051;*/
			gl_FragColor = sum;
		}`

};

export { VerticalBlurShader };