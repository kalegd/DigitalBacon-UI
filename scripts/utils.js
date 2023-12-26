/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

export const uuidv4 = () => ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,
    c => (c^crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4)
        .toString(16));

export const isDescendant = (ancestor, child) => {
    while(child?.parent) {
        if(child.parent == ancestor) return true;
        child = child.parent;
    }
    return false;
};
