/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

class LayoutUpdateHandler {
    constructor() {
        this._backgroundQueue = new Set();
    }

    scheduleBackgroundUpdate(component) {
        this._backgroundQueue.add(component);
    }

    completeBackgroundUpdate(component) {
    }

    updateBackgrounds() {
        for(let component of this._backgroundQueue) {
            component.createBackground();
            this._backgroundQueue.delete(component);
        }
    }

    update() {
        this.updateBackgrounds();
    }
}

let layoutUpdateHandler = new LayoutUpdateHandler();
export default layoutUpdateHandler;
