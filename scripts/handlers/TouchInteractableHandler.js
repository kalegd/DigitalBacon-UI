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

const FRAMES_TO_SKIP = 5;
const VEC3 = new THREE.Vector3();

class TouchInteractableHandler extends InteractableHandler {
    constructor() {
        super();
        this._skipIntersectsCheck = new Map;
        this._sphere = new THREE.Sphere();
        this._box3 = new THREE.Box3();
    }

    init(scene) {
        super.init();
        this._scene = scene;
    }

    _getBoundingSphere(object) {
        if(!object) return null;
        if(!this._skipIntersectsCheck.get(object))
            this._skipIntersectsCheck.set(object, new Map());
        this._box3.setFromObject(object).getBoundingSphere(this._sphere);
        return this._sphere;
    }

    _isXRControllerPressed(type, handedness) {
        if(type == XRInputDeviceTypes.HAND) {
            let model = InputHandler.getXRControllerModel(type, handedness);
            return model?.motionController?.isGrabbing != null;
        } else {
            let gamepad = InputHandler.getXRGamepad(handedness);
            return gamepad?.buttons != null && gamepad.buttons[1].pressed;
        }
    }

    _scopeInteractables(controller, interactables) {
        let boundingSphere = controller['boundingSphere'];
        let skipIntersectsCheck = controller['skipIntersectsCheck'];
        if(boundingSphere == null) return;
        for(let interactable of interactables) {
            if(interactable.children.size != 0)
                this._scopeInteractables(controller, interactable.children);
            let object = interactable.getObject();
            if(object == null || interactable.isOnlyGroup()) continue;
            let intersects = interactable.intersectsSphere(boundingSphere);
            if(intersects && !this._checkClipped(object)) {
                let controllerObject = controller.model || controller.option;
                let frames = skipIntersectsCheck.get(interactable);
                if(!frames) {
                    if(interactable.intersectsObject(controllerObject)) {
                        controller['touchedInteractables'].add(interactable);
                    }
                    skipIntersectsCheck.set(interactable, FRAMES_TO_SKIP);
                } else {
                    if(this._selectedInteractables.get(controller.option)
                            .has(interactable)) {
                        controller['touchedInteractables'].add(interactable);
                    }
                    skipIntersectsCheck.set(interactable, frames - 1);
                }
            }
        }
    }

    _checkClipped(object) {
        let clippingPlanes = object?.material?.clippingPlanes;
        if(clippingPlanes && clippingPlanes.length > 0) {
            object.getWorldPosition(VEC3);
            for(let plane of clippingPlanes) {
                if(plane.distanceToPoint(VEC3) < 0) return true;
            }
        }
        return false;
    }

    _updateInteractables(controller) {
        let option = controller.option;
        this._scopeInteractables(controller, this._interactables);
        if(!this._selectedInteractables.get(option))
            this._selectedInteractables.set(option, new Set());
        let selectedInteractables = this._selectedInteractables.get(option);
        let touchedInteractables = controller['touchedInteractables'];
        let basicEvent = { owner: option };
        for(let interactable of selectedInteractables) {
            if(!touchedInteractables.has(interactable)) {
                interactable.removeSelectedBy(option);
                selectedInteractables.delete(interactable);
                interactable.drag(basicEvent);
                interactable.up(basicEvent);
                interactable.click(basicEvent);
            }
        }
        for(let interactable of touchedInteractables) {
            if(selectedInteractables.has(interactable)) {
                interactable.drag(basicEvent);
            } else {
                interactable.addSelectedBy(option);
                selectedInteractables.add(interactable);
                interactable.down(basicEvent);
            }
        }
    }

    _updateForXR() {
        for(let handedness in Handedness) {
            let controllerExists = false;
            for(let type of [XRInputDeviceTypes.HAND,
                             XRInputDeviceTypes.CONTROLLER]) {
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
                let boundingSphere, skipIntersectsCheck;
                if(active) {
                    let object = (isDescendant(xrController, xrControllerModel))
                        ? xrControllerModel
                        : xrController;
                    boundingSphere = this._getBoundingSphere(object);
                    skipIntersectsCheck = this._skipIntersectsCheck.get(object);
                }
                let controller = {
                    option: xrController,
                    model: xrControllerModel,
                    boundingSphere: boundingSphere,
                    touchedInteractables: new Set(),
                    skipIntersectsCheck: skipIntersectsCheck,
                };
                let skipUpdate = false;
                if(this._toolHandlers[this._tool]) {
                    skipUpdate = this._toolHandlers[this._tool](controller);
                }
                if(!skipUpdate) this._updateInteractables(controller);
            }
        }
    }
}

let touchInteractableHandler = new TouchInteractableHandler();
export default touchInteractableHandler;
