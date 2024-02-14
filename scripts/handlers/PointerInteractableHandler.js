/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import DeviceTypes from '/scripts/enums/DeviceTypes.js';
import Handedness from '/scripts/enums/Handedness.js';
import XRInputDeviceTypes from '/scripts/enums/XRInputDeviceTypes.js';
import InputHandler from '/scripts/handlers/InputHandler.js';
import InteractableHandler from '/scripts/handlers/InteractableHandler.js';
import { isDescendant } from '/scripts/utils.js';
import * as THREE from 'three';

const vector3 = new THREE.Vector3();

class PointerInteractableHandler extends InteractableHandler {
    constructor() {
        super();
        this._cursors = {};
        this._ignoredInteractables = new Set();;
    }

    init(renderer, scene, camera, orbitTarget) {
        super.init();
        this._renderer = renderer;
        this._scene = scene;
        this._camera = camera;
        this._cameraFocus = orbitTarget || camera;
        if(DeviceTypes.active != 'XR')
            this._option = { type: DeviceTypes.active };
    }

    _getXRCursor(hand) {
        if(this._cursors[hand]) return this._cursors[hand];
        let canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        let ctx = canvas.getContext("2d");
        ctx.beginPath();
        ctx.arc(32, 32, 29, 0, 2 * Math.PI);
        ctx.lineWidth = 5;
        ctx.stroke();
        ctx.fillStyle = "white";
        ctx.fill();
        let spriteMaterial = new THREE.SpriteMaterial({
            map: new THREE.CanvasTexture(canvas),
            depthTest: false,
            sizeAttenuation: false,
        });
        for(let handedness in Handedness) {
            let cursor = new THREE.Sprite(spriteMaterial);
            cursor.scale.set(0.015,0.015,0.015);
            cursor.visible = false;
            cursor.renderOrder = Infinity;
            this._cursors[handedness] = cursor;
            this._scene.add(cursor);
        }
        return this._cursors[hand];
    }

    _getRaycaster() {
        if(!this._option.raycaster)
            this._option.raycaster = new THREE.Raycaster();
        let position = InputHandler.getPointerPosition();
        this._option.raycaster.setFromCamera(position, this._camera);
        return this._option.raycaster;
    }

    _getXRRaycaster(xrController) {
        if(!xrController.raycaster)
            xrController.raycaster = new THREE.Raycaster();
        xrController.getWorldPosition(xrController.raycaster.ray.origin);
        xrController.getWorldDirection(xrController.raycaster.ray.direction)
            .negate().normalize();
        return xrController.raycaster;
    }

    _isControllerPressed(option) {
        if(option == Handedness.LEFT || option == Handedness.RIGHT) {
            let gamepad = InputHandler.getXRGamepad(option);
            return gamepad != null && gamepad.buttons[0].pressed;
        } else if(option == "POINTER") {
            return InputHandler.isPointerPressed();
        } else if(option == "TOUCH_SCREEN") {
            return InputHandler.isScreenTouched();
        }
    }

    _isXRControllerPressed(type, handedness) {
        if(type == XRInputDeviceTypes.HAND) {
            let model = InputHandler.getXRControllerModel(type, handedness);
            return model?.motionController?.isPinching == true;
        } else {
            let gamepad = InputHandler.getXRGamepad(handedness);
            return gamepad?.buttons != null && gamepad.buttons[0].pressed;
        }
    }

    _squashInteractables(option, interactables, objects) {
        for(let interactable of interactables) {
            let object = interactable.getObject();
            if(object && !interactable.isOnlyGroup()) objects.push(object);
            if(interactable.children.size != 0) {
                this._squashInteractables(option, interactable.children,
                    objects);
            }
        }
    }

    _getObjectInteractable(object) {
        while(object != null) {
            let interactable = object.pointerInteractable;
            if(interactable && !interactable.isOnlyGroup()) return interactable;
            object = object.parent;
        }
    }

    _raycastInteractables(controller, interactables) {
        this._ignoredInteractables.clear();
        let raycaster = controller['raycaster'];
        if(!raycaster || raycaster.disabled) return;
        raycaster.firstHitOnly = true;
        raycaster.params.Line.threshold = 0.01;
        let objects = [];
        this._squashInteractables(controller.option, interactables, objects);
        let intersections = raycaster.intersectObjects(objects);
        for(let intersection of intersections) {
            let interactable = this._getObjectInteractable(intersection.object);
            if(!interactable || this._ignoredInteractables.has(interactable))
                continue;
            if(this._checkClipped(intersection.object, intersection.point)) {
                this._ignoredInteractables.add(interactable);
                continue;
            }
            let distance = intersection.distance;
            let userDistance = distance;
            if(DeviceTypes.active != 'XR') {
                this._cameraFocus.getWorldPosition(vector3);
                userDistance = intersection.point
                    .distanceTo(vector3);
            }   
            if(!interactable.isWithinReach(userDistance)) continue;
            controller['closestPointDistance'] = distance;
            controller['closestPoint'] = intersection.point;
            controller['closestInteractable'] = interactable;
            controller['userDistance'] = userDistance;
            return;
        }
    }

    _checkClipped(object, point) {
        let clippingPlanes = object?.material?.clippingPlanes;
        if(clippingPlanes && clippingPlanes.length > 0) {
            for(let plane of clippingPlanes) {
                if(plane.distanceToPoint(point) < 0) return true;
            }
        }
        return false;
    }

    _updateInteractables(controller) {
        let option = controller['option'];
        let isPressed = controller['isPressed'];
        let hovered = this._hoveredInteractables.get(option);
        let selected = this._selectedInteractables.get(option);
        let over = this._overInteractables.get(option);
        let closest = controller['closestInteractable'];
        let closestPoint = controller['closestPoint'];
        let userDistance = controller['userDistance'];
        if(closest != hovered) {
            if(hovered) {
                hovered.removeHoveredBy(option);
                this._hoveredInteractables.delete(option);
            }
            if(closest && ((!selected && !isPressed) || closest == selected)) {
                closest.addHoveredBy(option);
                this._hoveredInteractables.set(option, closest);
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
        let basicEvent = { owner: option };
        let detailedEvent = {
            owner: option,
            closestPoint: closestPoint,
            userDistance,
        };
        if(selected) {
            if(!isPressed) {
                selected.removeSelectedBy(option);
                this._selectedInteractables.delete(option);
            }
            if(selected == closest) {
                if(over != closest) {
                    if(over) over.out(basicEvent);
                    closest.over(detailedEvent);
                    this._overInteractables.set(option, closest);
                }
                closest.move(detailedEvent);
                closest.drag(detailedEvent);
                if(!isPressed) {
                    this._trigger('up', detailedEvent, closest);
                    closest.click(detailedEvent);
                }
            } else if(selected.isCapturedBy(option)) {
                if(selected != over) {
                    if(over) over.out(basicEvent);
                    selected.over(basicEvent);
                    this._overInteractables.set(option, selected);
                    over = selected;
                }
                selected.move(basicEvent);
                selected.drag(basicEvent);
                if(!isPressed) {
                    this._trigger('up', basicEvent, selected);
                    selected.click(basicEvent);
                    if(over) over.out(basicEvent);
                    if(closest) {
                        closest.over(detailedEvent);
                        this._overInteractables.set(option, closest);
                    } else {
                        this._overInteractables.delete(option);
                    }
                }
            } else if(closest) {
                if(over != closest) {
                    if(over) over.out(basicEvent);
                    closest.over(detailedEvent);
                    this._overInteractables.set(option, closest);
                }
                closest.move(detailedEvent);
                if(!isPressed) {
                    this._trigger('up', detailedEvent, closest);
                }
            } else if(over) {
                over.out(basicEvent);
                this._overInteractables.delete(option);
            }
        } else {
            if(closest) {
                if(over != closest) {
                    if(over) over.out(basicEvent);
                    closest.over(detailedEvent);
                    this._overInteractables.set(option, closest);
                }
                closest.move(detailedEvent);
                if(isPressed && !this._wasPressed.get(option)) {
                    this._trigger('down', detailedEvent, closest);
                    closest.addSelectedBy(option);
                    this._selectedInteractables.set(option, closest);
                } else if(!isPressed && this._wasPressed.get(option)) {
                    this._trigger('up', detailedEvent, closest);
                }
            } else {
                if(over) {
                    over.out(basicEvent);
                    this._overInteractables.delete(option);
                }
                if(isPressed) {
                    if(!this._wasPressed.get(option))
                        this._trigger('down', basicEvent);
                } else if(this._wasPressed.get(option)) {
                    this._trigger('up', basicEvent);
                }
            }
        }
        this._wasPressed.set(option, isPressed);
    }

    //_updateInteractablesTouchScreen(controller) {
    //    let option = controller['option'];
    //    let isPressed = controller['isPressed'];
    //    let selectedInteractable = this._selectedInteractables.get(option);
    //    if(this._screenWasTouched) {
    //        if(!selectedInteractable) {
    //            this._screenWasTouched = isPressed;
    //            return;
    //        }

    //        this._raycastInteractables(controller, this._interactables);
    //        let userDistance = controller['userDistance'];
    //        let closestInteractable = controller['closestInteractable'];
    //        if(!isPressed) {
    //            this._screenWasTouched = false;
    //            if(closestInteractable == selectedInteractable) {
    //                selectedInteractable.triggerActions(option,
    //                    controller['closestPoint'], userDistance);
    //            }
    //            selectedInteractable.removeSelectedBy(option);
    //            this._selectedInteractables.delete(option);
    //        } else {
    //            if(selectedInteractable == closestInteractable) {
    //                selectedInteractable.triggerDragActions(option,
    //                    controller['closestPoint'], userDistance);
    //            } else {
    //                selectedInteractable.triggerDragActions(option, null,
    //                    Infinity);
    //            }
    //        }
    //    } else if(isPressed) {
    //        this._screenWasTouched = true;
    //        this._raycastInteractables(controller, this._interactables);
    //        let userDistance = controller['userDistance'];
    //        let closestInteractable = controller['closestInteractable'];
    //        if(closestInteractable) {
    //            closestInteractable.addSelectedBy(option,
    //                controller['closestPoint'], userDistance);
    //            this._selectedInteractables.set(option, closestInteractable);
    //        }
    //    }
    //}

    _updateCursor(controller) {
        let cursor = controller.cursor;
        if(!cursor) return;
        if(controller['closestPoint'] != null) {
            cursor.position.copy(controller['closestPoint']);
            if(!cursor.visible) {
                cursor.visible = true;
            }
        } else {
            if(cursor.visible) {
                cursor.visible = false;
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
                if(!xrController) continue;
                let active = isDescendant(this._scene, xrController);
                if(active) {
                    if(type == XRInputDeviceTypes.CONTROLLER) {
                        controllerExists = true;
                    } else if(controllerExists) {
                        active = false;
                    }
                }
                let raycaster, isPressed;
                if(active) {
                    let targetRay = InputHandler.getXRController(type,
                        handedness, 'targetRay');
                    raycaster = this._getXRRaycaster(targetRay);
                    if(!xrController.raycaster)
                        xrController.raycaster = raycaster;
                    isPressed = this._isXRControllerPressed(type, handedness);
                }
                let controller = {
                    option: xrController,
                    raycaster: raycaster,
                    isPressed: isPressed,
                    closestPoint: null,
                    closestPointDistance: Number.MAX_SAFE_INTEGER,
                    cursor: (active) ? this._getXRCursor(handedness) : null,
                    userDistance: Number.MAX_SAFE_INTEGER,
                };
                let skipUpdate = false;
                if(this._toolHandlers[this._tool]) {
                    skipUpdate = this._toolHandlers[this._tool](controller);
                }
                if(!skipUpdate) {
                    this._raycastInteractables(controller, this._interactables);
                    this._updateInteractables(controller);
                }
                this._updateCursor(controller);
            }
        }
    }

    _updateForPointer() {
        let controller = {
            option: this._option,
            raycaster: this._getRaycaster(),
            isPressed: this._isControllerPressed("POINTER"),
            closestPoint: null,
            closestPointDistance: Number.MAX_SAFE_INTEGER,
            userDistance: Number.MAX_SAFE_INTEGER,
        };
        let skipUpdate = false;
        if(this._toolHandlers[this._tool]) {
            skipUpdate = this._toolHandlers[this._tool](controller);
        }
        if(!skipUpdate) {
            this._raycastInteractables(controller, this._interactables);
            this._updateInteractables(controller);
        }
        let style = this._renderer.domElement.style;
        if(!this._selectedInteractables.get(this._option)
                && this._hoveredInteractables.get(this._option)) {
            if(!style.cursor) style.cursor = 'pointer';
        } else if(style.cursor == 'pointer') {
            style.cursor = '';
        }
    }

    _updateForTouchScreen() {
        let controller = {
            option: this._option,
            raycaster: this._getRaycaster(),
            isPressed: this._isControllerPressed("TOUCH_SCREEN"),
            closestPoint: null,
            closestPointDistance: Number.MAX_SAFE_INTEGER,
            userDistance: Number.MAX_SAFE_INTEGER,
        };
        controller.raycaster.disabled = !controller.isPressed
            && !this._wasPressed.get(this._option);
        let skipUpdate = false;
        if(this._toolHandlers[this._tool]) {
            skipUpdate = this._toolHandlers[this._tool](controller);
        }
        if(!skipUpdate) {
            this._raycastInteractables(controller, this._interactables);
            this._updateInteractables(controller);
        } else {
            this._wasPressed.set(this._option, controller.isPressed);
        }
    }
}

let pointerInteractableHandler = new PointerInteractableHandler();
export default pointerInteractableHandler;
