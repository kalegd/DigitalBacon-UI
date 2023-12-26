/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { uuidv4 } from '/scripts/utils.js';

class InteractionTool {
    constructor() {
        this._tool = null;
        this._listeners = {};
    }

    getTool() {
        return this._tool;
    }

    setTool(tool) {
        this._tool = tool;
        for(let id in this._listeners) {
            this._listeners[id](tool);
        }
    }

    addUpdateListener(callback) {
        let id = uuidv4();
        this._listeners[id] = callback;
        return id;
    }

    removeUpdateListener(id) {
        delete this._lisreners[id];
    }
}

let interactionTool = new InteractionTool();
export default interactionTool;
