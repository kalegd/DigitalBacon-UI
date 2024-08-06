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
            let object = interactable.object;
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
        let owner = controller['owner'];
        let isPressed = controller['isPressed'];
        let hovered = this._hoveredInteractables.get(owner);
        let selected = this._selectedInteractables.get(owner);
        let over = this._overInteractables.get(owner);
        let closest = controller['closestInteractable'];
        if(closest != hovered) {
            if(hovered) {
                hovered.removeHoveredBy(owner);
                this._hoveredInteractables.delete(owner);
            }
            if(closest && ((!selected && !isPressed) || closest == selected)) {
                closest.addHoveredBy(owner);
                this._hoveredInteractables.set(owner, closest);
                hovered = closest;
            }
        }
        //Events
        //over  - when uncaptured pointer is first over an interactable. if
        //        pointer becomes uncaptured while over another interactable,
        //        we trigger this event
        //out   - when uncaptured pointer is out. if pointer becomes uncaptured
        //        while no longer over the capturing interactable, we trigger
        //        this event
        //down  - when select starts
        //up    - when trigger released on an interactable. Also when a captured
        //        action is released anywhere
        //click - when trigger is released over selected interactable. Also when
        //        captured action is released anywhere
        //move  - when uncaptured pointer is over interactable. Also when a
        //        captured pointer is anywhere
        //drag  - when uncaptured pointer over selected interactable. Also when
        //        captured pointer is anywhere
        let basicEvent = { owner: owner };
        if(selected) {
            if(!isPressed) {
                selected.removeSelectedBy(owner);
                this._selectedInteractables.delete(owner);
            }
            if(selected == closest) {
                if(over != closest) {
                    if(over) over.out(basicEvent);
                    closest.over(basicEvent);
                    this._overInteractables.set(owner, closest);
                }
                closest.move(basicEvent);
                closest.drag(basicEvent);
                if(!isPressed) {
                    this._trigger('up', basicEvent, closest);
                    closest.click(basicEvent);
                }
            } else if(selected.isCapturedBy(owner)) {
                if(selected != over) {
                    if(over) over.out(basicEvent);
                    selected.over(basicEvent);
                    this._overInteractables.set(owner, selected);
                    over = selected;
                }
                selected.move(basicEvent);
                selected.drag(basicEvent);
                if(!isPressed) {
                    this._trigger('up', basicEvent, selected);
                    selected.click(basicEvent);
                    if(over) over.out(basicEvent);
                    if(closest) {
                        closest.over(basicEvent);
                        this._overInteractables.set(owner, closest);
                    } else {
                        this._overInteractables.delete(owner);
                    }
                }
            } else if(closest) {
                if(over != closest) {
                    if(over) over.out(basicEvent);
                    closest.over(basicEvent);
                    this._overInteractables.set(owner, closest);
                }
                closest.move(basicEvent);
                if(!isPressed) {
                    this._trigger('up', basicEvent, closest);
                }
            } else if(over) {
                over.out(basicEvent);
                this._overInteractables.delete(owner);
            }
        } else {
            if(closest) {
                if(over != closest) {
                    if(over) over.out(basicEvent);
                    closest.over(basicEvent);
                    this._overInteractables.set(owner, closest);
                }
                closest.move(basicEvent);
                if(isPressed && !this._wasPressed.get(owner)) {
                    this._trigger('down', basicEvent, closest);
                    closest.addSelectedBy(owner);
                    this._selectedInteractables.set(owner, closest);
                } else if(!isPressed && this._wasPressed.get(owner)) {
                    this._trigger('up', basicEvent, closest);
                }
            } else {
                if(over) {
                    over.out(basicEvent);
                    this._overInteractables.delete(owner);
                }
                if(isPressed) {
                    if(!this._wasPressed.get(owner))
                        this._trigger('down', basicEvent);
                } else if(this._wasPressed.get(owner)) {
                    this._trigger('up', basicEvent);
                }
            }
        }
        this._wasPressed.set(owner, isPressed);
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
                if(!xrController) xrController = InputHandler.getXRController(
                    type, handedness, 'targetRay');
                if(!xrController) continue;
                let owner = this._getOwner(xrController);
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
                    owner: owner,
                    boundingSphere: boundingSphere,
                    isPressed: isPressed,
                    closestPointDistance: Number.MAX_SAFE_INTEGER,
                };
                let skipUpdate = false;
                if(this._toolHandlers[this._tool]) {
                    skipUpdate = this._toolHandlers[this._tool](controller);
                }
                if(!skipUpdate) {
                    this._scopeInteractables(controller, this._interactables);
                    this._updateInteractables(controller);
                }
            }
        }
    }
}

let gripInteractableHandler = new GripInteractableHandler();
export default gripInteractableHandler;
