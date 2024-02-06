/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Handedness from '/scripts/enums/Handedness.js';
import XRInputDeviceTypes from '/scripts/enums/XRInputDeviceTypes.js';
import InputHandler from '/scripts/handlers/InputHandler.js';
import InteractableHandler from '/scripts/handlers/InteractableHandler.js';
import { isDescendant } from '/scripts/utils.js';
import * as THREE from 'three';

class GripInteractableHandler extends InteractableHandler {
    constructor() {
        super();
    }

    init(scene) {
        super.init();
        this._scene = scene;
        this._sphere = new THREE.Sphere();
        this._box3 = new THREE.Box3();
    }

    _getBoundingSphere(object) {
        if(!object) return null;
        this._box3.setFromObject(object).getBoundingSphere(this._sphere);
        return this._sphere;
    }

    _isXRControllerPressed(type, handedness) {
        if(type == XRInputDeviceTypes.HAND) {
            let model = InputHandler.getXRControllerModel(type, handedness);
            return model?.motionController?.isGrabbing == true;
        } else {
            let gamepad = InputHandler.getXRGamepad(handedness);
            return gamepad?.buttons != null && gamepad.buttons[1].pressed;
        }
    }

    _scopeInteractables(controller, interactables) {
        let boundingSphere = controller['boundingSphere'];
        if(boundingSphere == null) return;
        for(let interactable of interactables) {
            if(interactable.children.size != 0)
                this._scopeInteractables(controller, interactable.children);
            let object = interactable.getObject();
            if(object == null || interactable.isOnlyGroup()) continue;
            let intersects = interactable.intersectsSphere(boundingSphere);
            if(intersects) {
                let distance = interactable.distanceToSphere(boundingSphere);
                if(distance < controller['closestPointDistance']) {
                    controller['closestPointDistance'] = distance;
                    controller['closestInteractable'] = interactable;
                }
            }
        }
    }

    _updateInteractables(controller) {
        let option = controller.option;
        let isPressed = controller['isPressed'];
        this._scopeInteractables(controller, this._interactables);
        let hoveredInteractable = this._hoveredInteractables.get(option);
        let selectedInteractable = this._selectedInteractables.get(option);
        let closestInteractable = controller['closestInteractable'];
        if(closestInteractable) {
            if(isPressed) {
                if(!selectedInteractable 
                        && hoveredInteractable == closestInteractable)
                {
                    closestInteractable.addSelectedBy(option);
                    this._selectedInteractables.set(option,closestInteractable);
                    closestInteractable.removeHoveredBy(option);
                    this._hoveredInteractables.delete(option);
                }
            } else {
                if(hoveredInteractable != closestInteractable) {
                    if(hoveredInteractable) {
                        hoveredInteractable.removeHoveredBy(option);
                    }
                    closestInteractable.addHoveredBy(option);
                    this._hoveredInteractables.set(option, closestInteractable);
                }
                if(selectedInteractable) {
                    selectedInteractable.removeSelectedBy(option);
                    this._selectedInteractables.delete(option);
                }
            }
        } else if(!isPressed) {
            if(hoveredInteractable) {
                hoveredInteractable.removeHoveredBy(option);
                this._hoveredInteractables.delete(option);
            }
            if(selectedInteractable) {
                selectedInteractable.removeSelectedBy(option);
                this._selectedInteractables.delete(option);
            }
        }
    }

    _updateForXR() {
        for(let handedness in Handedness) {
            let controllerExists = false;
            for(let type of [XRInputDeviceTypes.CONTROLLER,
                             XRInputDeviceTypes.HAND]) {
                let xrController = InputHandler.getXRController(type,
                    handedness, 'grip');
                let xrControllerModel = InputHandler.getXRControllerModel(type,
                    handedness);
                if(!xrController) continue;
                let active = isDescendant(this._scene, xrController);
                if(active) {
                    if(type == XRInputDeviceTypes.CONTROLLER) {
                        controllerExists = true;
                    } else if(controllerExists) {
                        active = false;
                    }
                }
                let boundingSphere, isPressed;
                if(active) {
                    let isChild = isDescendant(xrController, xrControllerModel);
                    boundingSphere = (isChild)
                        ? this._getBoundingSphere(xrControllerModel)
                        : this._getBoundingSphere(xrController);
                    isPressed = this._isXRControllerPressed(type, handedness);
                }
                let controller = {
                    option: xrController,
                    boundingSphere: boundingSphere,
                    isPressed: isPressed,
                    closestPointDistance: Number.MAX_SAFE_INTEGER,
                };
                let skipUpdate = false;
                if(this._toolHandlers[this._tool]) {
                    skipUpdate = this._toolHandlers[this._tool](controller);
                }
                if(!skipUpdate) this._updateInteractables(controller);
            }
        }
    }

    _updateForPointer() {
        return;
    }

    _updateForTouchScreen() {
        return;
    }

}

let gripInteractableHandler = new GripInteractableHandler();
export default gripInteractableHandler;
