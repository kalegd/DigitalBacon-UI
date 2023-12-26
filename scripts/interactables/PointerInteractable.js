/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import States from '/scripts/enums/InteractableStates.js';
import InteractionTool from '/scripts/handlers/InteractionTool.js';
import Interactable from '/scripts/interactables/Interactable.js';

class PointerInteractable extends Interactable {
    constructor(threeObj) {
        super(threeObj);
        if(threeObj) threeObj.pointerInteractable = this;
        this._maxDistance = -Infinity;
    }

    addAction(clickAction, draggableAction, maxDistance, tool, option) {
        if(clickAction && typeof clickAction == 'object') {
            if(!this._actions[clickAction.id]) {
                this._toolCounts[clickAction.tool || 'none']++;
            }
            this._actions[clickAction.id] = clickAction;
            this._actionsLength = Object.keys(this._actions).length;
            return clickAction;
        }
        if(!maxDistance) maxDistance = Infinity;
        if(maxDistance > this._maxDistance) this._maxDistance = maxDistance;
        let action = super.addAction(tool, option);
        action['clickAction'] = clickAction;
        action['draggableAction'] = draggableAction;
        action['draggingOwners'] = new Set();
        action['maxDistance'] = maxDistance;
        action['type'] = 'POINTER';
        return action;
    }

    removeAction(id) {
        let action = super.removeAction(id);
        if(action && action.maxDistance == this._maxDistance) {
            this._maxDistance = -Infinity;
            for(let id in this._actions) {
                if(this._actions[id].maxDistance > this._maxDistance)
                    this._maxDistance = this._actions[id].maxDistance;
            }
        }
        return action;
    }

    isWithinReach(distance) {
        return distance < this._maxDistance;
    }

    addHoveredBy(owner, closestPoint, distance) {
        if(this._hoveredOwners.has(owner)) {
            return;
        } else if(this._selectedOwners.has(owner)) {
            this.triggerActions(owner, closestPoint, distance);
        }
        this._hoveredOwners.add(owner);
        if(this._hoveredOwners.size == 1 && this._hoveredCallback) {
            this._hoveredCallback(true);
        }
        if(this._selectedOwners.size == 0) {
            this.setState(States.HOVERED);
        }
    }

    addSelectedBy(owner, closestPoint, distance) {
        this._selectedOwners.add(owner);
        this.setState(States.SELECTED);
        this.triggerDraggableActions(owner, closestPoint, distance);
    }

    removeSelectedBy(owner) {
        if(!this._hoveredOwners.has(owner)) {
            this.releaseDraggedActions(owner);
        }
        this._selectedOwners.delete(owner);
        this._determineAndSetState();
    }

    triggerActions(owner, closestPoint, distance) {
        let ids = Object.keys(this._actions);
        let tool = InteractionTool.getTool();
        for(let id of ids) {
            let action = this._actions[id];
            if(!action) continue;
            if(action.clickAction && (!action.tool || action.tool == tool)
                && (action.maxDistance >= distance
                    || action.draggingOwners.has(owner)))
            {
                action.clickAction(owner, closestPoint);
            }
            if(action.draggingOwners.has(owner))
                action.draggingOwners.delete(owner);
        }
    }

    triggerDraggableActions(owner, closestPoint, distance) {
        let ids = Object.keys(this._actions);
        let tool = InteractionTool.getTool();
        for(let id of ids) {
            let action = this._actions[id];
            if(!action) continue;
            if(action.draggableAction && (!action.tool || action.tool == tool)
                && (action.draggingOwners.has(owner)
                    || action.maxDistance >= distance))
            {
                action.draggableAction(owner, closestPoint);
                action.isDragging = true;
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
                if(action.clickAction) action.clickAction(owner);
                action.draggingOwners.delete(owner);
            }
        }
    }

    static emptyGroup() {
        return new PointerInteractable();
    }

    static createDraggable(threeObj, actionFunc, draggableActionFunc) {
        let interactable = new PointerInteractable(threeObj, true, null);
        interactable.addAction(actionFunc, draggableActionFunc);
        return interactable;
    }
}

export default PointerInteractable;
