/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import UIComponent from '/scripts/components/UIComponent.js';
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

class Body extends UIComponent {
    constructor(...styles) {
        super(...styles);
        this._defaults['borderMaterial'] = DEFAULT_BORDER_MATERIAL;
        this._defaults['borderRadius'] = 0.05;
        this._defaults['borderWidth'] = 0.001;
        this._defaults['material'] = DEFAULT_MATERIAL;
        this._defaults['height'] = 1;
        this._defaults['width'] = 1;
        this._content = new THREE.Object3D();
        this.add(this._content);
        this._createBackground();
    }

    _handleStyleUpdateForHeight() {
        this._createBackground();
    }

    _handleStyleUpdateForWidth() {
        this._createBackground();
    }

    add(object) {
        if(object instanceof UIComponent) {
            this._content.add(object);
        } else {
            super.add(object);
        }
    }

    remove(object) {
        if(object instanceof UIComponent && !(object.constructor.name=='Body')){
            this._content.remove(object);
        } else {
            super.remove(object);
        }
    }
}

export default Body;
