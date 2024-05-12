import Stats from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/libs/stats.module.js';
import { VRButton } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/webxr/VRButton.js';
import { ARButton } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/webxr/ARButton.js';
import * as THREE from 'three';

//Basic three.js scene setup with support for WebXR
export const init = async () => {
    const container = document.getElementById('container');
    const vrButtonDiv = document.getElementById('vr-button');
    const arButtonDiv = document.getElementById('ar-button');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
    const clock = new THREE.Clock();
    const stats = new Stats();
    stats.showPanel(0);
    stats.dom.style.top = '';
    stats.dom.style.left = '';
    stats.dom.style.position = 'absolute';
    container.appendChild(stats.dom, container.firstChild);
    let sceneBackground = new THREE.CubeTextureLoader()
        .setPath('../images/skyboxes/blue_sky/')
        .load(['skybox_right.jpg', 'skybox_left.jpg', 'skybox_up.jpg',
               'skybox_down.jpg', 'skybox_front.jpg', 'skybox_back.jpg']);
    scene.background = sceneBackground;
    
    const renderer = new THREE.WebGLRenderer({ antialias : true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    let isMobile = false;
    if(navigator.userAgent) {
        let userAgent = navigator.userAgent.toLowerCase();
        if(userAgent.indexOf('iphone') >= 0 || userAgent.indexOf('ipad') >= 0)
            isMobile = true;
    }
    if(!isMobile && 'xr' in navigator
            && (await navigator.xr.isSessionSupported('immersive-vr')
                || await navigator.xr.isSessionSupported('immersive-ar'))) {
        let features = ['local-floor', 'bounded-floor', 'hand-tracking',
                        'layers', 'anchors', 'plane-detection'];
        let vrButton = VRButton.createButton(renderer);
        let arButton = ARButton.createButton(renderer,
            { optionalFeatures: features });
        vrButtonDiv.appendChild(vrButton);
        arButtonDiv.appendChild(arButton);
        arButton.addEventListener('click', () => scene.background = null);
        vrButton.addEventListener('click',
            () => scene.background = sceneBackground);
    }

    window.addEventListener('resize', () => { 
        renderer.setSize(container.clientWidth,
            container.clientHeight);
        camera.aspect = container.clientWidth
            / container.clientHeight;
        camera.updateProjectionMatrix();
        if(camera.aspect < 0.8) {
            camera.position.z = (0.8 - camera.aspect) * 3;
        } else {
            camera.position.z = 0;
        }
    });

    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    const pointLight = new THREE.PointLight(0xffffff, 100);
    pointLight.position.set(2.5, 5, 5);
    camera.position.y = 1.7;
    scene.add(camera);
    scene.add(ambientLight);
    scene.add(pointLight);
    return {
        container: container,
        vrButtonDiv: vrButtonDiv,
        arButtonDiv: arButtonDiv,
        scene: scene,
        camera: camera,
        clock: clock,
        stats: stats,
        renderer: renderer,
    };
}
