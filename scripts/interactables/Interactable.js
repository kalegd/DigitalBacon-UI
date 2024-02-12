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
        this._capturedOwners = new Set();
        this._callbacks = {};
        this._callbacksLength = 0;
        this._toolCounts = {};
        this._hoveredCallbackState = false;
    }

    addEventListener(type, callback, options) {
        if(options) options = { ...options };//Shallow copy
        let tool = options?.tool || 'none';
        if(!(type in this._callbacks)) this._callbacks[type] = new Map();
        if(this._callbacks[type].has(callback))
            this.removeEventListener(type, callback);
        this._callbacks[type].set(callback, options);
        this._callbacksLength++;
        if(!this._toolCounts[tool]) this._toolCounts[tool] = 0;
        this._toolCounts[tool]++;
    }

    removeEventListener(type, callback) {
        if(type in this._callbacks && this._callbacks[type].has(callback)) {
            let options = this._callbacks[type].get(callback);
            this._callbacks[type].delete(callback)
            this._callbacksLength--;
            let tool = options?.tool || 'none';
            this._toolCounts[tool]--;
        }
    }

    dispatchEvent(type, e) {
        if(!(type in this._callbacks)) return;
        let tool = InteractionTool.getTool();
        for(let [callback, options] of this._callbacks[type]) {
            let callbackTool = options?.tool;
            if(!callbackTool || callbackTool == tool) callback(e);
        }
    }

    over(e) {
        this.dispatchEvent('over', e);
    }

    out(e) {
        this.dispatchEvent('out', e);
    }

    down(e) {
        this.dispatchEvent('down', e);
    }

    up(e) {
        this.dispatchEvent('up', e);
    }

    click(e) {
        this.dispatchEvent('click', e);
        if(this._capturedOwners.has(e.owner))
            this._capturedOwners.delete(e.owner);
    }

    move(e) {
        this.dispatchEvent('move', e);
    }

    drag(e) {
        this.dispatchEvent('drag', e);
    }

    capture(owner) {
        this._capturedOwners.add(owner);
    }

    isCapturedBy(owner) {
        return this._capturedOwners.has(owner);
    }

    getCallbacksLength(tool) {
        return (tool) ? this._toolCounts[tool] : this._callbacksLength;
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

    setObject(object) {
        this._object = object;
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

    _determineHoveredCallbackState() {
        if(!this._hoveredCallback) return;
        let newState = false;
        for(let owner of this._hoveredOwners) {
            if(!this._selectedOwners.has(owner)) {
                newState = true;
                break;
            }
        }
        if(newState != this._hoveredCallbackState) {
            console.log(newState);
            this._hoveredCallbackState = newState;
            this._hoveredCallback(newState);
        }
    }

    addHoveredBy(owner) {
        if(this._hoveredOwners.has(owner)) return;
        this._hoveredOwners.add(owner);
        this._determineHoveredCallbackState();
        if(this._selectedOwners.size == 0)
            this.setState(States.HOVERED);
    }

    removeHoveredBy(owner) {
        this._hoveredOwners.delete(owner);
        this._determineAndSetState();
        this._determineHoveredCallbackState();
    }

    addSelectedBy(owner) {
        this._selectedOwners.add(owner);
        this.setState(States.SELECTED);
        this._determineHoveredCallbackState();
    }

    removeSelectedBy(owner) {
        this._selectedOwners.delete(owner);
        this._determineAndSetState();
        this._determineHoveredCallbackState();
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
