/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import States from '/scripts/enums/InteractableStates.js';
import InteractionTool from '/scripts/handlers/InteractionTool.js';
import { uuidv4 } from '/scripts/utils.js';

class Interactable {
    constructor(object) {
        this._object = object;
        this._state = States.IDLE;
        this.children = new Set();
        this._hoveredOwners = new Set();
        this._selectedOwners = new Set();
        this._actions = {};
        this._actionsLength = 0;
        this._toolCounts = {};
    }

    addAction(tool) {
        let id = uuidv4();
        let action = {
            id: id,
            tool: tool,
        };
        this._actions[id] = action;
        this._actionsLength = Object.keys(this._actions).length;
        tool = tool || 'none';
        if(!this._toolCounts[tool]) this._toolCounts[tool] = 0;
        this._toolCounts[tool]++;
        return action;
    }

    removeAction(id) {
        if(id?.id) id = id.id;
        let action = this._actions[id];
        delete this._actions[id];
        this._actionsLength = Object.keys(this._actions).length;
        if(action) this._toolCounts[action.tool || 'none']--;
        return action;
    }

    hasAction(id) {
        if(id?.id) id = id.id;
        return this._actions[id] != null;
    }

    getActionsLength(tool) {
        return (tool) ? this._toolCounts[tool] : this._actionsLength;
    }

    supportsTool() {
        let tool = InteractionTool.getTool();
        return this._toolCounts['none'] || this._toolCounts[tool];
    }

    isOnlyGroup() {
        return !this.supportsTool();
    }

    getObject() {
        return this._object;
    }

    getState() {
        return this._state;
    }

    setState(newState) {
        if(this._state != newState) {
            this._state = newState;
            if(this._stateCallback) this._stateCallback(newState);
        }
    }

    setStateCallback(callback) {
        this._stateCallback = callback;
    }

    setHoveredCallback(callback) {
        this._hoveredCallback = callback;
    }

    _determineAndSetState() {
        if(this._selectedOwners.size > 0) {
            this.setState(States.SELECTED);
        } else if(this._hoveredOwners.size > 0) {
            this.setState(States.HOVERED);
        } else {
            this.setState(States.IDLE);
        }
    }

    addHoveredBy(owner) {
        if(this._hoveredOwners.has(owner)) return;
        this._hoveredOwners.add(owner);
        if(this._hoveredOwners.size == 1 && this._hoveredCallback)
            this._hoveredCallback(true);
        if(this._selectedOwners.size == 0)
            this.setState(States.HOVERED);
    }

    removeHoveredBy(owner) {
        this._hoveredOwners.delete(owner);
        if(this._hoveredOwners.size == 0 && this._hoveredCallback) {
            this._hoveredCallback(false);
        }
        this._determineAndSetState();
    }

    addSelectedBy(_owner) {
        console.error("Interactable.addSelectedBy(owner) must be overridden");
    }

    removeSelectedBy(_owner) {
        console.error(
            "Interactable.removeSelectedBy(owner) must be overridden");
    }

    reset() {
        this._hoveredOwners.clear();
        this._selectedOwners.clear();
        this.setState(States.IDLE);
        this.children.forEach((interactable) => {
            interactable.reset();
        });
    }

    addChild(interactable) {
        if(interactable.parent == this) return;
        if(interactable.parent) interactable.parent.removeChild(interactable);
        this.children.add(interactable);
        interactable.parent = this;
    }

    addChildren(interactables) {
        interactables.forEach((interactable) => {
            this.addChild(interactable);
        });
    }

    removeChild(interactable) {
        this.children.delete(interactable);
        interactable.parent = null;
    }

    removeChildren(interactables) {
        interactables.forEach((interactable) => {
            this.removeChild(interactable);
        });
    }
}

export default Interactable;
