/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { setupBVHForComplexObject } from '/scripts/utils.js';
import States from '/scripts/enums/InteractableStates.js';
import InteractionTool from '/scripts/handlers/InteractionTool.js';
import Interactable from '/scripts/interactables/Interactable.js';
import * as THREE from 'three';

const matrix4 = new THREE.Matrix4();

class TouchInteractable extends Interactable {
    constructor(object) {
        super(object);
        this._target1 = {};
        this._target2 = {};
        this._targets = [this._target1, this._target2];
        if(object) {
            object.touchInteractable = this;
            if(!object.bvhGeometry) setupBVHForComplexObject(object);
        }
        this._createBoundingObject();
    }

    addAction(touchAction, dragAction, tool) {
        if(touchAction && typeof touchAction == 'object') {
            if(!this._actions[touchAction.id]) {
                this._toolCounts[touchAction.tool || 'none']++;
            }
            this._actions[touchAction.id] = touchAction;
            this._actionsLength = Object.keys(this._actions).length;
            return touchAction;
        }
        let action = super.addAction(tool);
        action['touchAction'] = touchAction;
        action['dragAction'] = dragAction;
        action['draggingOwners'] = new Set();
        action['type'] = 'TOUCH';
        return action;
    }

    _createBoundingObject() {
        this._boundingBox = new THREE.Box3();
    }

    _getBoundingObject() {
        this._boundingBox.setFromObject(this._object);
        return this._boundingBox;
    }

    intersectsSphere(sphere) {
        let boundingBox = this._getBoundingObject();
        let intersects;
        if(boundingBox) {
            intersects = sphere.intersectsBox(boundingBox);
        } else {
            intersects = false;
        }
        return intersects;
    }

    intersectsObject(object) {
        if(!object?.bvhGeometry?.boundsTree) return;
        if(!this._object?.bvhGeometry?.boundsTree
            && !setupBVHForComplexObject(this._object)) return;
        matrix4.copy(this._object.matrixWorld).invert().multiply(
            object.matrixWorld);
        return this._object.bvhGeometry.boundsTree.intersectsGeometry(
            object.bvhGeometry, matrix4);
    }

    getIntersectionPoints(object) {
        if(object.model) object = object.model;
        if(!object?.bvhGeometry?.boundsTree) return;
        if(!this._object?.bvhGeometry?.boundsTree) return;
        matrix4.copy(this._object.matrixWorld).invert().multiply(
            object.matrixWorld);
        let found = this._object.bvhGeometry.boundsTree.closestPointToGeometry(
            object.bvhGeometry, matrix4, this._target1, this._target2);
        if(found) {
            this._target2.object = object;
            return this._targets;
        }
    }

    addSelectedBy(owner) {
        this._selectedOwners.add(owner);
        this.setState(States.SELECTED);
        this.triggerDragActions(owner);
    }

    removeSelectedBy(owner) {
        if(!this._hoveredOwners.has(owner)) {
            this.releaseDraggedActions(owner);
        }
        this._selectedOwners.delete(owner);
        this._determineAndSetState();
    }

    triggerDragActions(owner) {
        let ids = Object.keys(this._actions);
        let tool = InteractionTool.getTool();
        for(let id of ids) {
            let action = this._actions[id];
            if(!action) continue;
            if(!action.tool || action.tool == tool) {
                if(action.dragAction)
                    action.dragAction(owner);
                if(!action.draggingOwners.has(owner))
                    action.draggingOwners.add(owner);
            }
        }
    }

    releaseDraggedActions(owner) {
        let ids = Object.keys(this._actions);
        for(let id of ids) {
            let action = this._actions[id];
            if(!action) continue;
            if(action.draggingOwners.has(owner)) {
                if(action.touchAction) action.touchAction(owner);
                action.draggingOwners.delete(owner);
            }
        }
    }
}

export default TouchInteractable;
