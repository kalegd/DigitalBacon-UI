/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import LayoutComponent from '/scripts/components/LayoutComponent.js';
import * as THREE from 'three';

const DEFAULT_MATERIAL = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transmission: 1,
    roughness: 0.45,
    side: THREE.DoubleSide,
});

const DEFAULT_BORDER_MATERIAL = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
});

class Body extends LayoutComponent {
    constructor(...styles) {
        super(...styles);
        this._defaults['borderMaterial'] = DEFAULT_BORDER_MATERIAL;
        this._defaults['borderRadius'] = 0.05;
        this._defaults['borderWidth'] = 0.001;
        this._defaults['material'] = DEFAULT_MATERIAL;
        this._defaults['height'] = 1;
        this._defaults['width'] = 1;
        this._createBackground();
    }
}

export default Body;
