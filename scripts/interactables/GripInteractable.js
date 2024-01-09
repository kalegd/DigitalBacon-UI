/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import States from '/scripts/enums/InteractableStates.js';
import InteractionTool from '/scripts/handlers/InteractionTool.js';
import Interactable from '/scripts/interactables/Interactable.js';
import * as THREE from 'three';

const vector3 = new THREE.Vector3();

class GripInteractable extends Interactable {
    constructor(object) {
        super(object);
        if(object) object.gripInteractable = this;
        this._createBoundingObject();
    }

    addAction(selectAction, releaseAction, tool) {
        if(selectAction && typeof selectAction == 'object') {
            if(!this._actions[selectAction.id]) {
                this._toolCounts[selectAction.tool || 'none']++;
            }
            this._actions[selectAction.id] = selectAction;
            this._actionsLength = Object.keys(this._actions).length;
            return selectAction;
        }
        let action = super.addAction(tool);
        action['selectAction'] = selectAction;
        action['releaseAction'] = releaseAction;
        action['selectedBy'] = new Set();
        action['type'] = 'GRIP';
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

    // Assumes intersectsSphere(sphere) is called first so we don't update the
    // bounding box by calling _getBoundingObject()
    distanceToSphere(sphere) {
        return sphere.distanceToPoint(this._boundingBox.getCenter(vector3));
    }

    addSelectedBy(owner) {
        this._triggerSelected(owner);
        this._selectedOwners.add(owner);
        this.setState(States.SELECTED);
    }

    removeSelectedBy(owner) {
        this._triggerReleased(owner);
        this._selectedOwners.delete(owner);
        this._determineAndSetState();
    }
    
    _triggerSelected(owner) {
        let tool = InteractionTool.getTool();
        let currentIds = Object.keys(this._actions);
        for(let id of currentIds) {
            let action = this._actions[id];
            if(!action) continue;
            if(!action.tool || action.tool == tool) {
                if(action.selectAction) action.selectAction(owner);
                action.selectedBy.add(owner);
            }
        }
    }

    _triggerReleased(owner) {
        let currentIds = Object.keys(this._actions);
        for(let id of currentIds) {
            let action = this._actions[id];
            if(!action) continue;
            if(action.selectedBy.has(owner)) {
                if(action.releaseAction) action.releaseAction(owner);
                action.selectedBy.delete(owner);
            }
        }
    }
}

export default GripInteractable;
