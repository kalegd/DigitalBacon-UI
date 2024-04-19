/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import States from '/scripts/enums/InteractableStates.js';
import InteractionToolHandler from '/scripts/handlers/InteractionToolHandler.js';

class Interactable {
    constructor(object) {
        this._object = object;
        this._state = States.IDLE;
        this.children = new Set();
        this._hoveredOwners = new Set();
        this._selectedOwners = new Set();
        this._capturedOwners = new Set();
        this._stateCallbacks = new Set();
        this._hoveredCallbacks = new Set();
        this._callbacks = {};
        this._callbacksLength = 0;
        this._toolCounts = {};
        this._hoveredCallbackState = false;
        this._disabled = false;
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

    copyEventListenersTo(interactable) {
        for(let type in this._callbacks) {
            for(let [callback, options] of this._callbacks[type]) {
                interactable.addEventListener(type, callback, options);
            }
        }
    }

    removeEventListener(type, callback) {
        if(type in this._callbacks && this._callbacks[type].has(callback)) {
            let options = this._callbacks[type].get(callback);
            this._callbacks[type].delete(callback);
            this._callbacksLength--;
            let tool = options?.tool || 'none';
            this._toolCounts[tool]--;
        }
    }

    dispatchEvent(type, e) {
        if(this._disabled || !(type in this._callbacks)) return;
        let tool = InteractionToolHandler.getTool();
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
        let tool = InteractionToolHandler.getTool();
        return this._toolCounts['none'] || this._toolCounts[tool];
    }

    isOnlyGroup() {
        return !this.supportsTool();
    }

    addStateCallback(callback) {
        this._stateCallbacks.add(callback);
    }

    addHoveredCallback(callback) {
        this._hoveredCallbacks.add(callback);
    }

    removeStateCallback(callback) {
        this._stateCallbacks.delete(callback);
    }

    removeHoveredCallback(callback) {
        this._hoveredCallbacks.delete(callback);
    }

    _determineAndSetState() {
        if(this._selectedOwners.size > 0) {
            this.state = States.SELECTED;
        } else if(this._hoveredOwners.size > 0) {
            this.state = States.HOVERED;
        } else {
            this.state = States.IDLE;
        }
    }

    _determineHoveredCallbackState() {
        if(this._disabled || this._hoveredCallbacks.size == 0) return;
        let newState = false;
        for(let owner of this._hoveredOwners) {
            if(!this._selectedOwners.has(owner)) {
                newState = true;
                break;
            }
        }
        if(newState != this._hoveredCallbackState) {
            this._hoveredCallbackState = newState;
            for(let callback of this._hoveredCallbacks) {
                callback(newState);
            }
        }
    }

    addHoveredBy(owner) {
        if(this._hoveredOwners.has(owner)) return;
        this._hoveredOwners.add(owner);
        this._determineHoveredCallbackState();
        if(this._selectedOwners.size == 0)
            this.state = States.HOVERED;
    }

    removeHoveredBy(owner) {
        this._hoveredOwners.delete(owner);
        this._determineAndSetState();
        this._determineHoveredCallbackState();
    }

    addSelectedBy(owner) {
        this._selectedOwners.add(owner);
        this.state = States.SELECTED;
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
        this.state = States.IDLE;
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

    get disabled() { return this._disabled; }
    get object() { return this._object; }
    get state() { return this._state; }

    set disabled(disabled) {
        if(disabled) {
            if(this._hoveredCallbackState) {
                this._hoveredCallbacks.forEach((callback) => callback(false));
                this._hoveredCallbackState = false;
            }
            this.state = States.DISABLED;
            this._disabled = disabled;
        } else {
            this._disabled = disabled;
            this._determineAndSetState();
            this._determineHoveredCallbackState();
        }
    }
    set object(object) { this._object = object; }
    set state(newState) {
        if(!this._disabled && this._state != newState) {
            this._state = newState;
            for(let callback of this._stateCallbacks) {
                callback(newState);
            }
        }
    }
}

export default Interactable;
