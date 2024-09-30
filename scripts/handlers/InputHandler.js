/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import DeviceTypes from '/scripts/enums/DeviceTypes.js';
import Handedness from '/scripts/enums/Handedness.js';
import XRInputDeviceTypes from '/scripts/enums/XRInputDeviceTypes.js';
import { updateBVHForComplexObject } from '/scripts/utils.js';
import { Object3D, Vector2 } from 'three';
import { XRControllerModelFactory } from '/scripts/three/XRControllerModelFactory.js';
import { XRHandModelFactory } from '/scripts/three/XRHandModelFactory.js';

/* global nipplejs */
const controllerModelFactory = new XRControllerModelFactory();
const handModelFactory = new XRHandModelFactory();

//Provides Polling for XR Input Sources, Keyboard, or Touch Screen inputs
class InputHandler {
    init(container, renderer) {
        this._container = container;
        this._renderer = renderer;
        this._renderer.domElement.tabIndex = "1";
        this._xrInputDevices = {};
        for(let type in XRInputDeviceTypes) {
            this._xrInputDevices[type] = {};
        }
        this._pointerPosition = new Vector2();
        this._pointerPressed = false;
        this._keysPressed = new Set();
        this._keyCodesPressed = new Set();
        this._screenTouched = false;
        this._joystickAngle = 0;
        this._joystickDistance = 0;
        this._container.style.position = 'relative';
        this._createExtraControls();
        this._addEventListeners();
    }

    _addEventListeners() {
        if(DeviceTypes.active == "XR") {
            //XR Event Listeners
            this._renderer.xr.addEventListener("sessionstart", () => {
                this._onXRSessionStart();
            });
            this._renderer.xr.addEventListener("sessionend", () => {
                this._onXRSessionEnd();
            });
        } else if(DeviceTypes.active == "POINTER") {
            //POINTER Event Listeners
            this._container.addEventListener('keydown', (event) => {
                this._keysPressed.add(event.key);
                this._keyCodesPressed.add(event.code);
            });
            this._container.addEventListener('keyup', (event) => {
                this._keysPressed.delete(event.key);
                this._keyCodesPressed.delete(event.code);
            });
            window.addEventListener('blur', () => {
                this._keysPressed.clear();
                this._keyCodesPressed.clear();
            });
            this._renderer.domElement.addEventListener( 'mousedown', () => {
                this._pointerPressed = true;
            });
            this._renderer.domElement.addEventListener( 'mouseup', () => {
                this._pointerPressed = false;
            });
            this._renderer.domElement.addEventListener( 'mousemove', (event) =>{
                let rect = event.target.getBoundingClientRect();
                this._pointerPosition.x = ((event.clientX - rect.left)
                    / this._renderer.domElement.clientWidth) * 2 - 1;
                this._pointerPosition.y = -((event.clientY - rect.top)
                    / this._renderer.domElement.clientHeight) * 2 + 1;
            });
            this._container.addEventListener('mouseup', () => {
                this._renderer.domElement.focus();
            });
        } else if(DeviceTypes.active == "TOUCH_SCREEN") {
            //TOUCH_SCREEN Event Listeners
            this._renderer.domElement.addEventListener('touchstart', () => {
                this._screenTouched = true;
                let rect = event.target.getBoundingClientRect();
                this._pointerPosition.x = ((event.touches[0].clientX -rect.left)
                    / this._renderer.domElement.clientWidth) * 2 - 1;
                this._pointerPosition.y = -((event.touches[0].clientY -rect.top)
                    / this._renderer.domElement.clientHeight) * 2 + 1;
            });
            this._renderer.domElement.addEventListener('touchend', () => {
                this._screenTouched = false;
            });
            this._renderer.domElement.addEventListener('touchmove', (event) =>{
                let rect = event.target.getBoundingClientRect();
                this._pointerPosition.x = ((event.touches[0].clientX -rect.left)
                    / this._renderer.domElement.clientWidth) * 2 - 1;
                this._pointerPosition.y = -((event.touches[0].clientY -rect.top)
                    / this._renderer.domElement.clientHeight) * 2 + 1;
            });
            //Prevent zoom on double tapping the joystick/buttons on iOS
            //https://stackoverflow.com/a/38573198/11626958
            let lastTouchEnd = 0;
            document.addEventListener('touchend', function (event) {
                let now = (new Date()).getTime();
                if (now - lastTouchEnd <= 300) event.preventDefault();
                lastTouchEnd = now;
            }, false);
        }
    }

    _onXRSessionStart() {
        this._session = this._renderer.xr.getSession();
        this._session.oninputsourceschange = (event) => {
            this._onXRInputSourceChange(event);
        };
        let inputSources = this._session.inputSources;
        for(let i = 0; i < inputSources.length; i++) {
            this._addXRInputSource(inputSources[i]);
        }
    }

    _onXRSessionEnd() {
        this._session.oninputsourcechange = null;
        this._session = null;
        for(let type in this._xrInputDevices) {
            for(let handedness in this._xrInputDevices[type]) {
                delete this._xrInputDevices[type][handedness].inputSource;
            }
        }
    }

    _onXRInputSourceChange(event) {
        for(let i = 0; i < event.removed.length; i++) {
            this._deleteXRInputSource(event.removed[i]);
        }
        for(let i = 0; i < event.added.length; i++) {
            this._addXRInputSource(event.added[i]);
        }
    }

    _addXRInputSource(inputSource) {
        if(inputSource.targetRayMode != 'tracked-pointer') return;
        let type = (inputSource.hand != null)
            ? XRInputDeviceTypes.HAND
            : XRInputDeviceTypes.CONTROLLER;

        let handedness = inputSource.handedness.toUpperCase();
        if(handedness in Handedness) {
            let xrInputDevice = this._xrInputDevices[type][handedness];
            if(!xrInputDevice) {
                xrInputDevice = { controllers: {} };
                this._xrInputDevices[type][handedness] = xrInputDevice;
                if(inputSource.targetRaySpace) {
                    xrInputDevice.controllers.targetRay = new Object3D();
                    xrInputDevice.controllers.targetRay.xrInputDeviceType =type;
                    xrInputDevice.controllers.targetRay.handedness = handedness;
                }
                if(inputSource.gripSpace) {
                    xrInputDevice.controllers.grip = new Object3D();
                    xrInputDevice.controllers.grip.xrInputDeviceType = type;
                    xrInputDevice.controllers.grip.handedness = handedness;
                }
            }
            xrInputDevice.inputSource = inputSource;
            if(!xrInputDevice.model) {
                if(type == XRInputDeviceTypes.HAND) {
                    xrInputDevice.model = handModelFactory
                        .createHandModel(inputSource);
                } else if(type == XRInputDeviceTypes.CONTROLLER) {
                    xrInputDevice.model = controllerModelFactory
                        .createControllerModel(inputSource, 'mesh');
                }
            } else {
                let motionController = xrInputDevice.model.motionController;
                if(motionController)
                    motionController.xrInputSource = inputSource;
            }
            if(this._xrControllerParent) {
                this._xrControllerParent.add(
                    xrInputDevice.controllers.targetRay);
                let controllers = xrInputDevice.controllers;
                if(inputSource.gripSpace) {
                    this._xrControllerParent.add(controllers.grip);
                    controllers.grip.add(xrInputDevice.model);
                    controllers.grip.model = xrInputDevice.model;
                } else {
                    controllers.targetRay.add(xrInputDevice.model);
                    controllers.targetRay.model = xrInputDevice.model;
                }
            }
        }
    }

    _deleteXRInputSource(inputSource) {
        if(inputSource.targetRayMode != 'tracked-pointer') return;
        let type = (inputSource.hand != null)
            ? XRInputDeviceTypes.HAND
            : XRInputDeviceTypes.CONTROLLER;

        let handedness = inputSource.handedness.toUpperCase();
        let xrInputDevice = this._getXRInputDevice(type, handedness);
        if(xrInputDevice?.inputSource)
            delete this._xrInputDevices[type][handedness].inputSource;
        if(xrInputDevice?.controllers && this._xrControllerParent) {
            this._xrControllerParent.remove(
                xrInputDevice.controllers.targetRay);
            this._xrControllerParent.remove(xrInputDevice.controllers.grip);
        }
    }

    _getXRInputDevice(type, handedness) {
        return (this._xrInputDevices[type])
            ? this._xrInputDevices[type][handedness]
            : null;
    }

    getXRInputSource(type, handedness) {
        let xrInputDevice = this._getXRInputDevice(type, handedness);
        return (xrInputDevice) ? xrInputDevice.inputSource : null;
    }

    getXRGamepad(handedness) {
        let type = XRInputDeviceTypes.CONTROLLER;
        let inputSource = this.getXRInputSource(type, handedness);
        return (inputSource) ? inputSource.gamepad : null;
    }

    getXRController(type, handedness, space) {
        let xrInputDevice = this._getXRInputDevice(type, handedness);
        return (xrInputDevice) ? xrInputDevice.controllers[space] : null;
    }
    
    getXRControllerModel(type, handedness) {
        let xrInputDevice = this._getXRInputDevice(type, handedness);
        return (xrInputDevice) ? xrInputDevice.model : null;
    }

    setXRControllerModel(type, handedness, model) {
        let xrInputDevice = this._getXRInputDevice(type, handedness);
        if(xrInputDevice) {
            if(xrInputDevice.model) {
                if(xrInputDevice.controllers.grip) {
                    xrInputDevice.controllers.grip.remove(xrInputDevice.model);
                } else {
                    xrInputDevice.controllers.targetRay.remove(
                        xrInputDevice.model);
                }
            }
            xrInputDevice.model = model;
            if(xrInputDevice.controllers.grip) {
                xrInputDevice.controllers.grip.add(model);
            } else {
                xrInputDevice.controllers.targetRay.add(model);
            }
            return true;
        }
        return false;
    }

    enableXRControllerManagement(controllerParent) {
        this._xrControllerParent = controllerParent;
    }

    disableXRControllerManagement() {
        this._xrControllerParent = null;
    }

    getPointerPosition() {
        return this._pointerPosition;
    }

    isPointerPressed() {
        return this._pointerPressed;
    }

    isKeyPressed(key) {
        return this._keysPressed.has(key);
    }

    isKeyCodePressed(code) {
        return this._keyCodesPressed.has(code);
    }

    isScreenTouched() {
        return this._screenTouched;
    }

    getJoystickAngle() {
        return this._joystickAngle;
    }

    getJoystickDistance() {
        return this._joystickDistance;
    }

    _createExtraControls() {
        this._extraControls = {};
        this._extraControlsDiv = document.createElement('div');
        this._extraControlsDiv.style.position = 'absolute';
        this._extraControlsDiv.style.bottom = '10px';
        this._extraControlsDiv.style.right = '10px';
        this._container.appendChild(this._extraControlsDiv);
    }

    createJoystick() {
        console.warn('InputHandler.createJoystick() is deprecated, please use InputHandler.showJoystick() instead');
        this._createJoystick();
    }

    _createJoystick() {
        if(this._joystickParent) {
            this.showJoystick();
            return;
        }
        this._joystickParent = document.createElement('div');
        this._joystickParent.style.position = 'absolute';
        this._joystickParent.style.width = '100px';
        this._joystickParent.style.height = '100px';
        this._joystickParent.style.left = '10px';
        this._joystickParent.style.bottom = this._joystickParentBottomStyle
            || '10px';
        this._container.appendChild(this._joystickParent);
        let options = {
            zone: this._joystickParent,
            mode: 'static',
            dynamicPage: true,
            position: {left: '50%', top: '50%'},
        };
        let manager = nipplejs.create(options);
        let joystick = manager.get(0);
        joystick.on('move', (event, data) => {
            this._joystickAngle = data.angle.radian;
            this._joystickDistance = Math.min(data.force, 1);
        });
        joystick.on('end', () => {
            this._joystickDistance = 0;
        });
    }

    showJoystick() {
        if(!this._joystickParent) {
            this._createJoystick();
        } else if(!this._container.contains(this._joystickParent)) {
            this._container.appendChild(this._joystickParent);
        }
    }

    hideJoystick() {
        if(!this._joystickParent) return;
        if(this._container.contains(this._joystickParent))
            this._container.removeChild(this._joystickParent);
    }

    configureJoystickForLvhContainer() {
        if(this._joystickParent) {
            this._joystickParent.style.bottom = 'calc(100lvh - 100dvh + 10px)';
        } else {
            this._joystickParentBottomStyle = 'calc(100lvh - 100dvh + 10px)';
        }
    }

    addExtraControlsButton(id, name) {
        let button = document.createElement('button');
        button.id = id;
        button.innerText = name;
        button.style.borderWidth = '1px';
        button.style.borderStyle = 'solid';
        button.style.borderColor = '#fff';
        button.style.borderRadius = '4px';
        button.style.background = 'rgba(0,0,0,0.5)';
        button.style.padding = '12px';
        button.style.color = '#fff';
        button.style.font = 'normal 13px sans-serif';
        button.style.marginLeft = '5px';
        button.style.opacity = '0.75';
        button.style.width = '70px';
        this._extraControlsDiv.appendChild(button);
        this._extraControls[id] = button;
        return button;
    }

    getExtraControlsButton(id) {
        return this._extraControls[id];
    }

    hideExtraControls() {
        this._extraControlsDiv.style.display = 'none';
    }

    hideExtraControlsButton(id) {
        let button = this._extraControls[id];
        if(button) button.style.display = 'none';
    }

    showExtraControls() {
        this._extraControlsDiv.style.display = 'block';
    }

    showExtraControlsButton(id) {
        let button = this._extraControls[id];
        if(button) button.style.display = 'inline-block';
    }

    _updateXRController(frame, referenceSpace, xrInputDevice) {
        let xrInputSource = xrInputDevice.inputSource;
        let xrControllers = xrInputDevice.controllers;
        if(xrInputSource) {
            let targetRayPose = frame.getPose(xrInputSource.targetRaySpace,
                referenceSpace);
            if(targetRayPose != null) {
                xrControllers.targetRay.matrix.fromArray(
                    targetRayPose.transform.matrix
                );
                xrControllers.targetRay.matrix.decompose(
                    xrControllers.targetRay.position,
                    xrControllers.targetRay.rotation,
                    xrControllers.targetRay.scale
                );
            }

            if(xrInputSource.gripSpace) {
                let gripPose = frame.getPose(xrInputSource.gripSpace,
                    referenceSpace);
                if(gripPose != null) {
                    xrControllers.grip.matrix.fromArray(
                        gripPose.transform.matrix);
                    xrControllers.grip.matrix.decompose(
                        xrControllers.grip.position,
                        xrControllers.grip.rotation,
                        xrControllers.grip.scale
                    );
                }
            }

            if(xrInputSource.hand && xrInputDevice.model) {
                let controllerMatrix = (xrControllers.grip)
                    ? xrControllers.grip.matrix
                    : xrControllers.targetRay.matrix;
                let motionController = xrInputDevice.model.motionController;
                if(motionController){
                    motionController.updateMesh(frame, referenceSpace,
                        controllerMatrix);
                    if(xrInputDevice.model.children.length)
                        updateBVHForComplexObject(xrInputDevice.model);
                }
            }
        }
    }

    update(frame) {
        if(frame == null) return;
        let referenceSpace = this._renderer.xr.getReferenceSpace();
        for(let type in this._xrInputDevices) {
            for(let handedness in this._xrInputDevices[type]) {
                this._updateXRController(frame, referenceSpace,
                    this._xrInputDevices[type][handedness]);
            }
        }
    }
}

let inputHandler = new InputHandler();
export default inputHandler;
