import * as THREE from 'https://cdn.skypack.dev/pin/three@v0.137.0-X5O2PK3x44y1WRry67Kr/mode=imports/optimized/three.js';
const EffectShader = {

    uniforms: {

        'sceneDiffuse': { value: null },
        'sceneDepth': { value: null },
        'blueNoise': { value: null },
        'projectionMatrixInv': { value: new THREE.Matrix4() },
        'lightMatrix': { value: new THREE.Matrix4() },
        'viewMatrixInv': { value: new THREE.Matrix4() },
        'cameraPos': { value: new THREE.Vector3() },
        'resolution': { value: new THREE.Vector2() },
        'lightPos': { value: new THREE.Vector3(30.0, 60.0, 30.0) },
        'lightDepth': { value: null },
        'lightProj': { value: new THREE.Matrix4() },
        'lightView': { value: new THREE.Matrix4() },
        'height': { value: null },
        'width': { value: null },
        'time': { value: 0 },
        'near': { value: 0 },
        'far': { value: 0 },
        'samples': { value: 4 },
        'raySteps': { value: 10 },
        'rayBias': { value: 5 }
    },

    vertexShader: /* glsl */ `
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,

    fragmentShader: /* glsl */ `
		uniform sampler2D sceneDiffuse;
    uniform sampler2D sceneDepth;
    uniform sampler2D blueNoise;
    uniform float time;
    uniform float samples;
    uniform float raySteps;
    uniform float rayBias;
    uniform mat4 projectionMatrixInv;
    uniform mat4 viewMatrixInv;
    uniform vec3 cameraPos;
    uniform vec2 resolution;
    uniform vec3 lightPos;
    uniform mat4 lightProj;
    uniform mat4 lightView;
    uniform mat4 lightMatrix;
    uniform float height;
		uniform float width;
    uniform sampler2D lightDepth;
    uniform float near;
    uniform float far;
        varying vec2 vUv;
        vec3 WorldPosFromDepth(float depth, vec2 coord) {
          float z = depth * 2.0 - 1.0;
          vec4 clipSpacePosition = vec4(coord * 2.0 - 1.0, z, 1.0);
          vec4 viewSpacePosition = projectionMatrixInv * clipSpacePosition;
          // Perspective division
          viewSpacePosition /= viewSpacePosition.w;
          vec4 worldSpacePosition = viewMatrixInv * viewSpacePosition;
          return worldSpacePosition.xyz;
      }
      vec3 computeNormal(vec3 worldPos, vec2 vUv) {
    vec2 downUv = vUv + vec2(0.0, 1.0 / (resolution.y * 1.0));
    vec3 downPos = WorldPosFromDepth( texture2D(sceneDepth, downUv).x, downUv);
    vec2 rightUv = vUv + vec2(1.0 / (resolution.x * 1.0), 0.0);;
    vec3 rightPos = WorldPosFromDepth(texture2D(sceneDepth, rightUv).x, rightUv);
    vec2 upUv = vUv - vec2(0.0, 1.0 / (resolution.y * 0.01));
    vec3 upPos = WorldPosFromDepth(texture2D(sceneDepth, upUv).x, upUv);
    vec2 leftUv = vUv - vec2(1.0 / (resolution.x * 1.0), 0.0);;
    vec3 leftPos = WorldPosFromDepth(texture2D(sceneDepth, leftUv).x, leftUv);
    int hChoice;
    int vChoice;
    if (length(leftPos - worldPos) < length(rightPos - worldPos)) {
      hChoice = 0;
    } else {
      hChoice = 1;
    }
    if (length(upPos - worldPos) < length(downPos - worldPos)) {
      vChoice = 0;
    } else {
      vChoice = 1;
    }
    vec3 hVec;
    vec3 vVec;
    if (hChoice == 0 && vChoice == 0) {
      hVec = leftPos - worldPos;
      vVec = upPos - worldPos;
    } else if (hChoice == 0 && vChoice == 1) {
      hVec = leftPos - worldPos;
      vVec = worldPos - downPos;
    } else if (hChoice == 1 && vChoice == 1) {
      hVec = rightPos - worldPos;
      vVec = downPos - worldPos;
    } else if (hChoice == 1 && vChoice == 0) {
      hVec = rightPos - worldPos;
      vVec = worldPos - upPos;
    }
    return normalize(cross(hVec, vVec));
    }
    float seed = 0.0;
    highp float randP( const in vec2 uv ) {
      const highp float a = 12.9898, b = 78.233, c = 43758.5453;
      highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, 3.141592653589793 );
      return fract( sin( sn ) * c );
    }
    uint hash( uint x ) {
      x += ( x << 10u );
      x ^= ( x >>  6u );
      x += ( x <<  3u );
      x ^= ( x >> 11u );
      x += ( x << 15u );
      return x;
    }
    
    
    
    // Compound versions of the hashing algorithm I whipped together.
    uint hash( uvec2 v ) { return hash( v.x ^ hash(v.y)                         ); }
    uint hash( uvec3 v ) { return hash( v.x ^ hash(v.y) ^ hash(v.z)             ); }
    uint hash( uvec4 v ) { return hash( v.x ^ hash(v.y) ^ hash(v.z) ^ hash(v.w) ); }
    
    
    
    // Construct a float with half-open range [0:1] using low 23 bits.
    // All zeroes yields 0.0, all ones yields the next smallest representable value below 1.0.
    float floatConstruct( uint m ) {
      const uint ieeeMantissa = 0x007FFFFFu; // binary32 mantissa bitmask
      const uint ieeeOne      = 0x3F800000u; // 1.0 in IEEE binary32
    
      m &= ieeeMantissa;                     // Keep only mantissa bits (fractional part)
      m |= ieeeOne;                          // Add fractional part to 1.0
    
      float  f = uintBitsToFloat( m );       // Range [1:2]
      return f - 1.0;                        // Range [0:1]
    }
    
    
    
    // Pseudo-random value in half-open range [0:1].
    float random( float x ) { return floatConstruct(hash(floatBitsToUint(x))); }
    float random( vec2  v ) { return floatConstruct(hash(floatBitsToUint(v))); }
    float random( vec3  v ) { return floatConstruct(hash(floatBitsToUint(v))); }
    float random( vec4  v ) { return floatConstruct(hash(floatBitsToUint(v))); }
    
    float rand()
    {
    /*float result = fract(sin(seed + mod(time, 1000.0) + dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
    //_Seed += 1.0;
    seed += 1.0;
    return result;*/
    /*float result = random(vec4(vUv, seed, time));
    seed += 1.0;
    return result;*/
    seed += 1.0;
    return texture2D(blueNoise, vUv + 0.01 * seed ).x;
    }
        float linearize_depth(float d,float zNear,float zFar)
        {
            return zNear * zFar / (zFar + d * (zNear - zFar));
        }
    #define NUM_SAMPLES 17
		#define NUM_RINGS 11     
    vec2 poissonDisk[NUM_SAMPLES];
    void initPoissonSamples( const in vec2 randomSeed ) {
      float ANGLE_STEP = 6.283185307179586 * float( NUM_RINGS ) / float( NUM_SAMPLES );
      float INV_NUM_SAMPLES = 1.0 / float( NUM_SAMPLES );

      // jsfiddle that shows sample pattern: https://jsfiddle.net/a16ff1p7/
      float angle = randP( randomSeed ) * 6.283185307179586;
      float radius = INV_NUM_SAMPLES;
      float radiusStep = radius;

      for( int i = 0; i < NUM_SAMPLES; i ++ ) {
        poissonDisk[i] = vec2( cos( angle ), sin( angle ) ) * pow( radius, 0.75 );
        radius += radiusStep;
        angle += ANGLE_STEP;
      }
    }
    float penumbraSize( const in float zReceiver, const in float zBlocker ) { // Parallel plane estimation
      return (zReceiver - zBlocker) / zBlocker;
    }
    bool castRay(vec3 worldPos, vec3 toLight) {
      vec3 startPos = worldPos + 1.0 * toLight;
              float rayLength = 50.0;
              vec3 endPos = worldPos + rayLength * toLight;
              float raySteps = (raySteps / 2.0) + (raySteps) * rand();
              float bias = rayBias;
              vec3 lastPos = startPos;
              bool hit = false;
              for(float i = 0.0; i <= raySteps; i++) {
                vec3 samplePos = mix(startPos, endPos, i / raySteps);
                vec4 projectPosEnd = lightProj * lightView * vec4(samplePos, 1.0);
                projectPosEnd.xyz /= projectPosEnd.w;
                projectPosEnd.xyz = projectPosEnd.xyz * 0.5 + 0.5;
                vec4 projectPosStart = lightProj * lightView * vec4(lastPos, 1.0);
                projectPosStart.xyz /= projectPosStart.w;
                projectPosStart.xyz = projectPosStart.xyz * 0.5 + 0.5;
                float zMax = projectPosStart.z;
                float zMin = projectPosEnd.z;
                if (zMin > zMax) {
                  float temp = zMin;
                  zMin = zMax;
                  zMax = temp;
                }
                vec3 midPos = mix(lastPos, samplePos, 0.5);
                vec4 projectPosMid = lightProj * lightView * vec4(midPos, 1.0);
                projectPosMid.xyz /= projectPosMid.w;
                projectPosMid.xyz = projectPosMid.xyz * 0.5 + 0.5;
                if (projectPosMid.x < 0.0 || projectPosMid.x > 1.0) {
                  break;
                }
                if (projectPosMid.y < 0.0 || projectPosMid.y > 1.0) {
                  break;
                }
                if (projectPosMid.z < 0.0 || projectPosMid.z > 1.0) {
                  break;
                }
                float sceneZ = texture2D(lightDepth, projectPosMid.xy).x;
                zMin = linearize_depth(zMin, near, far);
                zMax = linearize_depth(zMax, near, far);
                sceneZ = linearize_depth(sceneZ, near, far);
                if (sceneZ > zMin - bias && sceneZ < zMax) {
                  hit = true;
                  break;
                }
                lastPos = samplePos;
              }
              return hit;
    }

		void main() {
            vec4 diffuse = texture2D(sceneDiffuse, vUv);
            vec4 texel = texture2D( sceneDiffuse, vUv );
            float depth = texture2D(sceneDepth, vUv).x;
            vec3 worldPos = WorldPosFromDepth(depth, vUv);
            vec3 normal = computeNormal(worldPos, vUv);
            float shadow = 0.0;
            if (depth < 1.0) {
              float hits = 0.0;
              for(float i = 0.0; i < samples; i++) {
                vec3 toLight = normalize((lightMatrix * vec4(vec3((rand() - 0.5), (rand() - 0.5), 0.0), 1.0)).xyz - worldPos);
                bool hit = castRay(worldPos, toLight);
                if (hit) {
                  hits++;
                }
              }
              shadow = hits / samples;
            }
            gl_FragColor = vec4(/*diffuse.rgb **/ vec3(1.0 - shadow), 1.0);
		}`

};

export { EffectShader };