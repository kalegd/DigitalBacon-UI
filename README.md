# DigitalBacon-UI
### [Examples](https://kalegd.github.io/DigitalBacon-UI/) &nbsp;|	&nbsp;[Documentation](https://github.com/kalegd/DigitalBacon-UI/blob/main/docs/DigitalBacon-UI.md)	&nbsp;|	&nbsp;[npm](https://www.npmjs.com/package/digitalbacon-ui)

JavaScript 3D UI library for three.js that supports touch screen, mouse, and XR hardware inputs


<p align="center"><img src="/images/readme-text-input.gif" title="Spotify Demo" height="300" width="300"> &nbsp;&nbsp;&nbsp;<img src="/images/readme-spotify.gif" title="text input demo" height="300"width="300"></p>

### Usage
```javascript
import * as DigitalBaconUI from 'DigitalBacon-UI';
import * as THREE from 'three';

//sample three.js scene setup
const container = document.getElementById('your-threejs-canvas-parent-id');
const scene = new THREE.Scene();
const ambientLight = new THREE.AmbientLight(0x404040, 1);
const renderer = new THREE.WebGLRenderer({ antialias : true });
const camera = new THREE.PerspectiveCamera(90, container.clientWidth / container.clientHeight, 0.1, 1000);
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);
scene.add(camera);
scene.add(ambientLight);
camera.position.y = 1.7;

//Creating a hello world sign with DigitalBacon-UI
DigitalBaconUI.InputHandler.enableXRControllerManagement(scene);
await DigitalBaconUI.init(container, renderer, scene, camera);
const body = new DigitalBaconUI.Body({
    borderRadius: 0.05,
    borderWidth: 0.005,
    height: 0.25,
    justifyContent: 'center',
    materialColor: 0x000000,
    opacity: 0.7,
    width: 0.75,
});
const helloText = new DigitalBaconUI.Text('Hello World!',
    { color: 0xffffff, fontSize: 0.075 });
body.position.set(0, 1.7, -1);
body.add(helloText);
scene.add(body);

renderer.setAnimationLoop((time, frame) => {
    DigitalBaconUI.update(frame);
    renderer.render(scene, camera);
});
```

## Local Network Testing

If you want to test your changes with another device on your local network, you can run `npm run start-ssl`. Before doing this you'll need to create both cert.pem and key.pem files. Mac Users can generate these files via `openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem`
