/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { uuidv4 } from '/scripts/utils.js';

class UpdateHandler {
    constructor() {
        this._listeners = {};
    }

    add(callback) {
        let id = uuidv4();
        this._listeners[id] = callback;
        return id;
    }

    remove(id) {
        delete this._listeners[id];
    }

    update() {
        for(let id in this._listeners) {
            this._listeners[id]();
        }
    }
}

let updateHandler = new UpdateHandler();
export default updateHandler;
