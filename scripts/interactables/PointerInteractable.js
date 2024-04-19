/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import InteractionToolHandler from '/scripts/handlers/InteractionToolHandler.js';
import Interactable from '/scripts/interactables/Interactable.js';

class PointerInteractable extends Interactable {
    constructor(object) {
        super(object);
        if(object) object.pointerInteractable = this;
        this._maxDistance = -Infinity;
        this._hoveredCursor = 'pointer';
    }

    addEventListener(type, callback, options = {}) {
        options = { ...options };
        if(options.maxDistance == null) options.maxDistance = Infinity;
        if(options.maxDistance > this._maxDistance)
            this._maxDistance = options.maxDistance;
        super.addEventListener(type, callback, options);
    }

    removeEventListener(type, callback) {
        let needsMaxDistanceUpdate = false;
        if(type in this._callbacks && this._callbacks[type].has(callback)) {
            let options = this._callbacks[type].get(callback);
            if(options.maxDistance == this._maxDistance)
                needsMaxDistanceUpdate = true;
        }
        super.removeEventListener(type, callback);
        if(needsMaxDistanceUpdate) {
            this._maxDistance = -Infinity;
            for(let type in this._callbacks) {
                for(let [_key, value] of this._callbacks[type]) {
                    if(value.maxDistance > this._maxDistance)
                        this._maxDistance = value.maxDistance;
                }
            }
        }
    }

    dispatchEvent(type, e) {
        if(this._disabled || !(type in this._callbacks)) return;
        let tool = InteractionToolHandler.getTool();
        for(let [callback, options] of this._callbacks[type]) {
            let callbackTool = options.tool;
            if(callbackTool && callbackTool != tool) continue;
            if(e?.userDistance == null || options.maxDistance >= e.userDistance)
                callback(e);
        }
    }

    isWithinReach(distance) {
        return distance < this._maxDistance;
    }

    get hoveredCursor() {
        return (this._disabled) ? 'not-allowed' : this._hoveredCursor;
    }

    set hoveredCursor(hoveredCursor) { this._hoveredCursor = hoveredCursor; }
}

export default PointerInteractable;
