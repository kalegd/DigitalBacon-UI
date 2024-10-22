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
        this._ignoredInteractables = new Set();
    }

    init(renderer, scene, camera, orbitTarget) {
        super.init();
        this._renderer = renderer;
        this._scene = scene;
        this._camera = camera;
        this._cameraFocus = orbitTarget || camera;
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

    _getRaycaster(owner) {
        if(!owner.raycaster) owner.raycaster = new THREE.Raycaster();
        let position = InputHandler.getPointerPosition();
        owner.raycaster.setFromCamera(position, this._camera);
        owner.raycaster.layers.mask = this._camera.layers.mask;
        return owner.raycaster;
    }

    _getXRRaycaster(xrController) {
        if(!xrController.raycaster)
            xrController.raycaster = new THREE.Raycaster();
        xrController.getWorldPosition(xrController.raycaster.ray.origin);
        xrController.getWorldDirection(xrController.raycaster.ray.direction)
            .negate().normalize();
        xrController.raycaster.layers.mask = this._camera.layers.mask;
        return xrController.raycaster;
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

    _squashInteractables(owner, interactables, objects) {
        for(let interactable of interactables) {
            let object = interactable.object;
            if(object && !interactable.isOnlyGroup()) objects.push(object);
            if(interactable.children.size != 0) {
                this._squashInteractables(owner, interactable.children,
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
        this._squashInteractables(controller.owner, interactables, objects);
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
        let owner = controller['owner'];
        let isPressed = controller['isPressed'];
        let hovered = this._hoveredInteractables.get(owner);
        let selected = this._selectedInteractables.get(owner);
        let over = this._overInteractables.get(owner);
        let closest = controller['closestInteractable'];
        let closestPoint = controller['closestPoint'];
        let userDistance = controller['userDistance'];
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
        let detailedEvent = {
            owner: owner,
            point: closestPoint,
            userDistance,
        };
        if(selected) {
            if(!isPressed) {
                selected.removeSelectedBy(owner);
                this._selectedInteractables.delete(owner);
            }
            if(selected == closest) {
                if(over != closest) {
                    if(over) over.out(basicEvent);
                    closest.over(detailedEvent);
                    this._overInteractables.set(owner, closest);
                }
                closest.move(detailedEvent);
                closest.drag(detailedEvent);
                if(!isPressed) {
                    this._trigger('up', detailedEvent, closest);
                    closest.click(detailedEvent);
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
                        closest.over(detailedEvent);
                        this._overInteractables.set(owner, closest);
                    } else {
                        this._overInteractables.delete(owner);
                    }
                }
            } else if(closest) {
                if(over != closest) {
                    if(over) over.out(basicEvent);
                    closest.over(detailedEvent);
                    this._overInteractables.set(owner, closest);
                }
                closest.move(detailedEvent);
                if(!isPressed) {
                    this._trigger('up', detailedEvent, closest);
                }
            } else if(over) {
                over.out(basicEvent);
                this._overInteractables.delete(owner);
            }
        } else {
            if(closest) {
                if(over != closest) {
                    if(over) over.out(basicEvent);
                    closest.over(detailedEvent);
                    this._overInteractables.set(owner, closest);
                }
                closest.move(detailedEvent);
                if(isPressed && !this._wasPressed.get(owner)) {
                    this._trigger('down', detailedEvent, closest);
                    closest.addSelectedBy(owner);
                    this._selectedInteractables.set(owner, closest);
                } else if(!isPressed && this._wasPressed.get(owner)) {
                    this._trigger('up', detailedEvent, closest);
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
                let raycaster, isPressed;
                if(active) {
                    let targetRay = InputHandler.getXRController(type,
                        handedness, 'targetRay');
                    raycaster = this._getXRRaycaster(targetRay);
                    if(!owner.raycaster)
                        owner.raycaster = raycaster;
                    isPressed = this._isXRControllerPressed(type, handedness);
                }
                let controller = {
                    owner: owner,
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
        let owner = this._getOwner(DeviceTypes.POINTER);
        let controller = {
            owner: owner,
            raycaster: this._getRaycaster(owner),
            isPressed: InputHandler.isPointerPressed(),
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
        let hoveredInteractable = this._hoveredInteractables.get(owner);
        if(hoveredInteractable && !this._selectedInteractables.get(owner)) {
            style.cursor = hoveredInteractable.hoveredCursor;
        } else if(style.cursor != '') {
            style.cursor = '';
        }
    }

    _updateForTouchScreen() {
        let owner = this._getOwner(DeviceTypes.TOUCH_SCREEN);
        let controller = {
            owner: owner,
            raycaster: this._getRaycaster(owner),
            isPressed: InputHandler.isScreenTouched(),
            closestPoint: null,
            closestPointDistance: Number.MAX_SAFE_INTEGER,
            userDistance: Number.MAX_SAFE_INTEGER,
        };
        controller.raycaster.disabled = !controller.isPressed
            && !this._wasPressed.get(owner);
        let skipUpdate = false;
        if(this._toolHandlers[this._tool]) {
            skipUpdate = this._toolHandlers[this._tool](controller);
        }
        if(!skipUpdate) {
            this._raycastInteractables(controller, this._interactables);
            this._updateInteractables(controller);
        } else {
            this._wasPressed.set(owner, controller.isPressed);
        }
    }
}

let pointerInteractableHandler = new PointerInteractableHandler();
export default pointerInteractableHandler;
