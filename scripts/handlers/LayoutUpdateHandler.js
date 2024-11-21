/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

class LayoutUpdateHandler {
    constructor() {
        this._backgroundQueue = new Set();
        this._layoutQueue = new Set();
    }

    scheduleBackgroundUpdate(component) {
        this._backgroundQueue.add(component);
    }

    scheduleLayoutUpdate(component) {
        this._layoutQueue.add(component);
    }

    completeLayoutUpdate(component) {
        this._layoutQueue.delete(component);
    }

    updateBackgrounds() {
        for(let component of this._backgroundQueue) {
            component.createBackground();
            this._backgroundQueue.delete(component);
        }
    }

    updateLayouts() {
        for(let component of this._layoutQueue) {
            component.updateLayout();
            this._layoutQueue.delete(component);
        }
    }

    update() {
        this.updateLayouts();
        this.updateBackgrounds();
    }
}

let layoutUpdateHandler = new LayoutUpdateHandler();
export default layoutUpdateHandler;
