/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

class InteractionToolHandler {
    constructor() {
        this._tool = null;
        this._listeners = new Set();
    }

    getTool() {
        return this._tool;
    }

    setTool(tool) {
        this._tool = tool;
        for(let callback of this._listeners) {
            callback(tool);
        }
    }

    addUpdateListener(callback) {
        this._listeners.add(callback);
    }

    removeUpdateListener(callback) {
        this._listeners.delete(callback);
    }
}

let interactionToolHandler = new InteractionToolHandler();
export default interactionToolHandler;
