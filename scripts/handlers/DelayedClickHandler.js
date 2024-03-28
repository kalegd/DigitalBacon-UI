/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import DeviceTypes from '/scripts/enums/DeviceTypes.js';

class DelayedClickHandler {
    constructor() {
        this._listeners = new Set();
    }

    setup() {
        if(DeviceTypes.active != "XR") {
            this._eventType = DeviceTypes.active == "TOUCH_SCREEN"
                ? 'touchend'
                : 'click';
            this._clickListener = () => {
                setTimeout(() => {
                    for(let callback of this._listeners) {
                        callback();
                        this._listeners.delete(callback);
                    }
                }, 30);
            };
            document.addEventListener(this._eventType, this._clickListener);
            //Why this convoluted chain of event listener checking a variable
            //likely set by an interactable (which use polling)? Because we
            //can't trigger popups, file inputs, etc with a click event outside
            //of an event listener on Safari :(
        }
    }

    trigger(callback) {
        this._listeners.add(callback);
    }
}

let delayedClickHandler = new DelayedClickHandler();
export default delayedClickHandler;
