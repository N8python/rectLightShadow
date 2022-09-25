import * as THREE from 'https://cdn.skypack.dev/pin/three@v0.137.0-X5O2PK3x44y1WRry67Kr/mode=imports/optimized/three.js';
import { EffectComposer } from 'https://unpkg.com/three@0.137.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://unpkg.com/three@0.137.0/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'https://unpkg.com/three@0.137.0/examples/jsm/postprocessing/ShaderPass.js';
import { SMAAPass } from 'https://unpkg.com/three@0.137.0/examples/jsm/postprocessing/SMAAPass.js';
import { GammaCorrectionShader } from 'https://unpkg.com/three@0.137.0/examples/jsm/shaders/GammaCorrectionShader.js';
import { EffectShader } from "./EffectShader.js";
import { OrbitControls } from 'https://unpkg.com/three@0.137.0/examples/jsm/controls/OrbitControls.js';
import { frameCorners } from "https://unpkg.com/three@0.137.0/examples/jsm/utils/CameraUtils.js";
import { RectAreaLightUniformsLib } from 'https://unpkg.com/three@0.137.0/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { RectAreaLightHelper } from 'https://unpkg.com/three@0.137.0/examples/jsm/helpers/RectAreaLightHelper.js';
import { AssetManager } from './AssetManager.js';
import { HorizontalBlurShader } from "./HorizontalBlurShader.js";
import { VerticalBlurShader } from "./VerticalBlurShader.js";
import { Stats } from "./stats.js";
import { EffectCompositer } from "./EffectCompositer.js";
import { GUI } from 'https://unpkg.com/three@0.144.0/examples/jsm/libs/lil-gui.module.min.js';
import { OBJLoader } from 'https://unpkg.com/three@0.144.0/examples/jsm/loaders/OBJLoader.js';
import { FBXLoader } from 'https://unpkg.com/three@0.144.0/examples/jsm/loaders/FBXLoader.js';
import * as BufferGeometryUtils from 'https://unpkg.com/three@0.144.0/examples/jsm/utils/BufferGeometryUtils.js';
import { GLTFExporter } from "./GLTFExporter.js";
async function main() {
    // Setup basic renderer, controls, and profiler
    const clientWidth = window.innerWidth * 0.99;
    const clientHeight = window.innerHeight * 0.98;
    const scene = new THREE.Scene();
    RectAreaLightUniformsLib.init();
    const camera = new THREE.PerspectiveCamera(75, clientWidth / clientHeight, 0.1, 1000);
    camera.position.set(50, 75, 50);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(clientWidth, clientHeight);
    document.body.appendChild(renderer.domElement);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.VSMShadowMap;
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 25, 0);
    const gltfExporter = new GLTFExporter();
    const stats = new Stats();
    stats.showPanel(0);
    document.body.appendChild(stats.dom);
    // Setup scene
    // Skybox
    const environment = new THREE.CubeTextureLoader().load([
        "skybox/Box_Right.bmp",
        "skybox/Box_Left.bmp",
        "skybox/Box_Top.bmp",
        "skybox/Box_Bottom.bmp",
        "skybox/Box_Front.bmp",
        "skybox/Box_Back.bmp"
    ]);
    //scene.background = environment;
    // Lighting
    const ambientLight = new THREE.AmbientLight(new THREE.Color(1.0, 1.0, 1.0), 0.0);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.35);
    directionalLight.position.set(150, 200, 50);
    // Shadows
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.left = -75;
    directionalLight.shadow.camera.right = 75;
    directionalLight.shadow.camera.top = 75;
    directionalLight.shadow.camera.bottom = -75;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.bias = -0.001;
    directionalLight.shadow.blurSamples = 8;
    directionalLight.shadow.radius = 4;
    //scene.add(directionalLight);
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.15);
    directionalLight2.color.setRGB(1.0, 1.0, 1.0);
    directionalLight2.position.set(-50, 200, -150);
    // scene.add(directionalLight2);
    // Objects
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 100).applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2)), new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, dithering: true }));
    ground.castShadow = true;
    ground.receiveShadow = true;
    scene.add(ground);
    const box = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, color: new THREE.Color(0.8, 0.2, 0.2), dithering: true }));
    box.castShadow = true;
    box.receiveShadow = true;
    box.position.y = 5.01;
    box.position.x = -20;
    box.position.z = 0;
    scene.add(box);
    const sphere = new THREE.Mesh(new THREE.TorusKnotGeometry(5, 1.5, 200, 32), new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, color: new THREE.Color(0.2, 0.8, 0.2), roughness: 0, metalness: 0, dithering: true }));
    sphere.position.y = 10;
    sphere.position.x = 20;
    sphere.position.z = 0;
    sphere.castShadow = true;
    sphere.receiveShadow = true;
    scene.add(sphere);
    let buddhaGeo = (await new OBJLoader().loadAsync("https://raw.githubusercontent.com/alecjacobson/common-3d-test-models/master/data/happy.obj")).children[0].geometry.scale(100, 100, 100).translate(0, -6.3, 0).rotateY(Math.PI);
    buddhaGeo.deleteAttribute('normal');
    buddhaGeo = BufferGeometryUtils.mergeVertices(buddhaGeo);
    buddhaGeo.computeVertexNormals();
    const torusKnot = new THREE.Mesh(buddhaGeo /*new THREE.TorusKnotGeometry(5, 1.5, 200, 32)*/ , new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, color: new THREE.Color(1.0, 1.0, 1.0), roughness: 0, metalness: 0, dithering: true }));
    //torusKnot.position.y = 10;
    torusKnot.position.x = 0;
    //torusKnot.position.z = 9;
    torusKnot.castShadow = true;
    torusKnot.receiveShadow = true;
    // scene.add(torusKnot);
    // Build postprocessing stack
    // Render Targets
    const defaultTexture = new THREE.WebGLRenderTarget(clientWidth, clientHeight, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.NearestFilter,
        type: THREE.FloatType
    });
    defaultTexture.depthTexture = new THREE.DepthTexture(clientWidth, clientHeight, THREE.FloatType);
    const depthTarget = new THREE.WebGLRenderTarget(4096, 4096, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.NearestFilter,
        type: THREE.FloatType
    });
    depthTarget.depthTexture = new THREE.DepthTexture(4096, 4096, THREE.FloatType);
    // Post Effects
    const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(512, {
        type: THREE.FloatType,
        minFilter: THREE.NearestFilter,
        maxFilter: THREE.NearestFilter
    });
    let width = 20;
    let height = 20;
    let light = new THREE.Object3D(); //THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ color: new THREE.Color(10.0, 10.0, 10.0), side: THREE.DoubleSide }));
    //light.rotation.y = Math.PI;
    light.position.y = 40;
    const rect = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color(10.0, 10.0, 10.0), side: THREE.DoubleSide }));
    rect.scale.x = width;
    rect.scale.y = height;
    const rectLight = new THREE.RectAreaLight(0xffffff, 3 * 4, width, height);
    rectLight.rotation.y = Math.PI;
    light.add(rectLight);
    const arealightHelper = new RectAreaLightHelper(rectLight);
    light.add(arealightHelper);
    scene.add(light);
    let factor = ((width / height) * (50.0 / width));
    let cam = new THREE.PerspectiveCamera(150, width / height, 6.7 / factor, 125);
    //cam.rotation.y = Math.PI;
    //cam.position.z -= 0.1;
    cam.position.z -= 6.7 / factor;
    //cam.position.z -= 0.1;
    cam.rotateY(Math.PI);
    light.add(cam);
    const camHelp = new THREE.CameraHelper(cam);
    // scene.add(camHelp);
    const cubeCamera = new THREE.CubeCamera(0.1, 1000, cubeRenderTarget);
    scene.add(cubeCamera);
    const customMeshDepth = new THREE.ShaderMaterial({
        uniforms: {
            lightPos: { value: light.position }
        },
        vertexShader: /*glsl*/ `
        varying vec3 vPosition;
        void main() { 
            vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
        }
        `,
        fragmentShader: /*glsl*/ `
        varying vec3 vPosition;
        uniform vec3 lightPos;
        void main() {
            float lightDistance = length(vPosition - lightPos);
            gl_FragColor = vec4(lightDistance, 0.0, 0.0, 1.0);
        }
        `
    });
    const hblur = new ShaderPass(HorizontalBlurShader);
    const vblur = new ShaderPass(VerticalBlurShader);
    const blurSize = 1.0;
    hblur.uniforms.h.value = blurSize * (clientHeight / clientWidth);
    vblur.uniforms.v.value = blurSize;
    console.log(hblur.uniforms.h.value);
    console.log(vblur.uniforms.v.value);
    const composer = new EffectComposer(renderer);
    const smaaPass = new SMAAPass(clientWidth, clientHeight);
    const effectPass = new ShaderPass(EffectShader);
    const effectCompositer = new ShaderPass(EffectCompositer);
    composer.addPass(effectPass);
    for (let i = 0; i < 6; i++) {
        composer.addPass(hblur);
        composer.addPass(vblur);
    }
    composer.addPass(effectCompositer);
    composer.addPass(new ShaderPass(GammaCorrectionShader));
    composer.addPass(smaaPass);
    const noiseTex = new THREE.TextureLoader().load("noise.png");
    noiseTex.wrapS = THREE.RepeatWrapping;
    noiseTex.wrapT = THREE.RepeatWrapping;
    //noiseTex.magFilter = THREE.NearestFilter;
    //noiseTex.minFilter = THREE.NearestFilter;
    const testMarker = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32), new THREE.MeshStandardMaterial());
    // scene.add(testMarker);
    const effectController = {
        width: 20,
        height: 20,
        rotationZ: 0,
        rotationY: 0,
        samples: 4,
        denoise: true,
        depthBias: 3.0,
        blurSize: 1,
        blurSharp: 2,
        blurThreshold: 0.2,
        autoThreshold: true,
        autoRotate: false,
        interpolateNoise: false,
        lightColor: [1, 1, 1],
        raySteps: 10,
        rayBias: 5
    };
    const gui = new GUI();
    gui.add(effectController, "width", 0.1, 100, 0.001).name("Width");
    gui.add(effectController, "height", 0.1, 80, 0.001).name("Height");
    gui.add(effectController, "samples", 1, 16, 1).name("Samples");
    gui.add(effectController, "raySteps", 2, 20, 2).name("Steps");
    gui.add(effectController, "rayBias", 0, 10, 0.001).name("Bias");
    gui.add(effectController, "blurSize", 0.0, 1.0, 0.001).name("Blur Size");
    const zRotController = gui.add(effectController, "rotationZ", 0.0, 2 * Math.PI, 0.001).name("Rotation Z");
    const yRotController = gui.add(effectController, "rotationY", 0.0, 2 * Math.PI, 0.001).name("Rotation Y");
    gui.add(effectController, "blurSharp", 0.0, 4.0, 0.001).name("Blur Sharp");
    gui.add(effectController, "depthBias", 0.0, 5.0, 0.001).name("Depth Bias");
    gui.add(effectController, "autoThreshold").name("Auto Threshold");
    const blurThresholdController = gui.add(effectController, "blurThreshold", 0.0, 1.0, 0.001).name("Blur Threshold");
    gui.addColor(effectController, "lightColor").name("Light Color");
    gui.add(effectController, "denoise").name("Denoise");
    gui.add(effectController, "autoRotate").name("Auto Rotate");
    gui.add(effectController, "interpolateNoise").name("Interpolate Noise");
    const link = document.createElement('a');
    link.style.display = 'none';
    document.body.appendChild(link);

    function save(blob, filename) {

        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();

        // URL.revokeObjectURL( url ); breaks Firefox...

    }

    function saveString(text, filename) {

        save(new Blob([text], { type: 'text/plain' }), filename);

    }
    /*document.onclick = (e) => {
        gltfExporter.parse(scene, function(result) {

            const output = JSON.stringify(result, null, 2);
            saveString(output, 'scene.gltf');
        }, {
            trs: false,
            onlyVisible: false,
            truncateDrawRange: false,
            binary: false,
            maxTextureSize: 4096
        })
    }*/
    let mixer;
    const dancer = await new FBXLoader().loadAsync('https://rawgit.com/mrdoob/three.js/r94/examples/models/fbx/Samba%20Dancing.fbx');

    scene.add(dancer);
    dancer.scale.multiplyScalar(0.1);
    dancer.traverse(c => {

        if (c.type === 'SkinnedMesh') {

            var newMat = new THREE.MeshStandardMaterial();
            newMat.color.copy(c.material.color);
            newMat.roughness = 1.0;
            newMat.skinning = true;

            c.material = newMat;
            c.castShadow = true;
            c.receiveShadow = true;

        }

    });
    mixer = new THREE.AnimationMixer(dancer);
    mixer.clipAction(dancer.animations[0]).play();


    const clock = new THREE.Clock();

    function animate() {
        const delta = clock.getDelta();
        if (mixer) {
            mixer.update(delta);
        }
        /*scene.overrideMaterial = customMeshDepth;
        cubeCamera.position.copy(light.position);
        cubeCamera.update(renderer, scene);
        scene.overrideMaterial = null;*/
        camHelp.visible = true;
        light.visible = true;
        // torusKnot.rotation.x += 0.01;
        /*width = 50; //+ 25 * Math.sin(performance.now() / 1000);
        height = 50; // + 25 * Math.cos(performance.now() / 1000);
        rect.scale.x = width;
        rect.scale.y = height;
        cam.aspect = width / height;
        let factor = ((width / height) * (50.0 / width));
        cam.near = 6.7 / factor;
        cam.far = 250;
        cam.position.z = -6.7 / factor;
        cam.updateProjectionMatrix();
        camHelp.update();*/
        light.position.x = 50.0 * Math.sin(effectController.rotationY);
        light.position.z = -50.0 * Math.cos(effectController.rotationY);
        hblur.enabled = effectController.denoise;
        vblur.enabled = effectController.denoise;
        //rectLight.rotation.z += 0.1;
        light.lookAt(0, 40, 0);
        renderer.setRenderTarget(defaultTexture);
        renderer.clear();
        renderer.render(scene, camera);
        camHelp.visible = false;
        light.visible = false;
        renderer.setRenderTarget(depthTarget);
        renderer.clear();
        renderer.render(scene, cam);
        const blurSize = effectController.blurSize;
        hblur.uniforms.h.value = blurSize * (clientHeight / clientWidth);
        vblur.uniforms.v.value = blurSize;
        // light.position.y = 25 + 10 * Math.sin(performance.now() / 10000);
        //torusKnot.rotation.x += 0.01;
        // torusKnot.rotation.y += 0.01;
        //  torusKnot.rotation.z += 0.01;
        rectLight.width = effectController.width;
        rectLight.height = effectController.height;
        const area = effectController.width * effectController.height;
        if (effectController.autoThreshold) {
            blurThresholdController.setValue(+((area ** 0.306) / ((400 ** 0.306) / 0.2)).toFixed(3));
        }
        if (effectController.autoRotate) {
            yRotController.setValue(effectController.rotationY + 0.01);
            zRotController.setValue(effectController.rotationZ + 0.05);
        }
        if (effectController.interpolateNoise) {
            noiseTex.magFilter = THREE.LinearFilter;
            noiseTex.minFilter = THREE.LinearFilter;
            noiseTex.needsUpdate = true;
        } else {
            noiseTex.magFilter = THREE.NearestFilter;
            noiseTex.minFilter = THREE.NearestFilter;
            noiseTex.needsUpdate = true;
        }
        rectLight.color.r = effectController.lightColor[0];
        rectLight.color.g = effectController.lightColor[1];
        rectLight.color.b = effectController.lightColor[2];
        rectLight.rotation.z = effectController.rotationZ;
        rectLight.intensity = 12 * (400 / (rectLight.width * rectLight.height))
        cam.updateMatrix();
        effectPass.uniforms["sceneDiffuse"].value = defaultTexture.texture;
        effectPass.uniforms["sceneDepth"].value = defaultTexture.depthTexture;
        effectPass.uniforms["projectionMatrixInv"].value = camera.projectionMatrixInverse;
        effectPass.uniforms["viewMatrixInv"].value = camera.matrixWorld;
        effectPass.uniforms["cameraPos"].value = camera.position;
        effectPass.uniforms['resolution'].value = new THREE.Vector2(clientWidth, clientHeight);
        effectPass.uniforms['lightPos'].value = light.position.clone();
        effectPass.uniforms['time'].value = performance.now() / 1000;
        effectPass.uniforms['lightDepth'].value = depthTarget.depthTexture;
        effectPass.uniforms['lightProj'].value = cam.projectionMatrix;
        effectPass.uniforms['lightView'].value = cam.matrixWorldInverse;
        effectPass.uniforms['near'].value = cam.near;
        effectPass.uniforms['far'].value = cam.far;
        effectPass.uniforms['width'].value = rectLight.width;
        effectPass.uniforms['height'].value = rectLight.height;
        effectPass.uniforms['blueNoise'].value = noiseTex;
        effectPass.uniforms['lightMatrix'].value = arealightHelper.matrixWorld;
        effectPass.uniforms['samples'].value = effectController.samples;
        effectPass.uniforms['raySteps'].value = effectController.raySteps;
        effectPass.uniforms['rayBias'].value = effectController.rayBias;
        effectCompositer.uniforms['sceneDiffuse'].value = defaultTexture.texture;
        hblur.uniforms["sceneDepth"].value = defaultTexture.depthTexture;
        hblur.uniforms["near"].value = cam.near;
        hblur.uniforms["far"].value = cam.far;
        vblur.uniforms["near"].value = cam.near;
        vblur.uniforms["resolution"].value = new THREE.Vector2(clientWidth, clientHeight);
        hblur.uniforms["resolution"].value = new THREE.Vector2(clientWidth, clientHeight);
        vblur.uniforms["blurThreshold"].value = effectController.blurThreshold;
        hblur.uniforms["blurThreshold"].value = effectController.blurThreshold;
        vblur.uniforms["depthBias"].value = effectController.depthBias;
        hblur.uniforms["depthBias"].value = effectController.depthBias;
        hblur.uniforms["blurSharp"].value = effectController.blurSharp;
        vblur.uniforms["blurSharp"].value = effectController.blurSharp;
        vblur.uniforms["far"].value = cam.far;
        vblur.uniforms["sceneDepth"].value = defaultTexture.depthTexture;
        // testMarker.position.copy(new THREE.Vector3(0.0, 0.0, 0.0).applyMatrix4(arealightHelper.matrixWorld));
        console.log();
        composer.render();
        controls.update();
        stats.update();
        requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
}
main();