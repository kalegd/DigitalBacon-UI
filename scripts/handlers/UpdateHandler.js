/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

class UpdateHandler {
    constructor() {
        this._listeners = new Set();
    }

    add(callback) {
        this._listeners.add(callback);
    }

    remove(callback) {
        this._listeners.delete(callback);
    }

    update() {
        for(let callback of this._listeners) {
            callback();
        }
    }
}

let updateHandler = new UpdateHandler();
export default updateHandler;
