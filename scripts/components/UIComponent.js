/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import * as THREE from 'three';

class UIComponent extends THREE.Object3D {
    constructor(params = {}) {
        super();
        this._style = params['style'] || {};
    }
}

export default UIComponent;
