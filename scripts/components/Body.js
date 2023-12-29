/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import UIComponent from '/scripts/components/UIComponent.js';
import { numberOr } from '/scripts/utils.js';
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

//https://stackoverflow.com/a/65576761/11626958
function createShape(width, height, x, y, borderRadius) {
    let shape = new THREE.Shape();
    shape.moveTo(x, y + borderRadius);
    shape.lineTo(x, y + height - borderRadius);
    if(borderRadius)
        shape.quadraticCurveTo(x, y + height, x + borderRadius, y + height);
    shape.lineTo(x + width - borderRadius, y + height);
    if(borderRadius)
        shape.quadraticCurveTo(x + width, y + height, x + width,
            y + height - borderRadius);
    shape.lineTo(x + width, y + borderRadius);
    if(borderRadius)
        shape.quadraticCurveTo(x + width, y, x + width - borderRadius, y);
    shape.lineTo(x + borderRadius, y);
    if(borderRadius)
        shape.quadraticCurveTo(x, y, x, y + borderRadius);
    return shape;
}

class Body extends UIComponent {
    constructor(params = {}) {
        super();
        this._borderMaterial = params['borderMaterial']
            || DEFAULT_BORDER_MATERIAL;
        this._borderRadius = numberOr(params['borderRadius'], 0.05);
        this._borderWidth = numberOr(params['borderWidth'], 0.001);
        this._enableClipping = !(params['enableClipping'] == false);
        this._height = params['height'] || 1;
        this._width = params['width'] || 1;
        this._material = params['material'] || DEFAULT_MATERIAL;
        this._content = new THREE.Object3D();
        this.add(this._content);
        this._createBody();
        if(this._borderWidth) this._createBorder();
    }

    _createBody() {
        let borderRadius = Math.max(this._borderRadius - this._borderWidth, 0);
        let height = this._height - 2 * this._borderWidth;
        let width = this._width - 2 * this._borderWidth;
        let x = width / -2;
        let y = height / -2;
        this._bodyShape = createShape(width, height, x, y, borderRadius);
        let geometry = new THREE.ShapeGeometry(this._bodyShape);
        this._body = new THREE.Mesh(geometry, this._material);
        this.add(this._body);
    }

    _createBorder() {
        let x = this._width / -2;
        let y = this._height / -2;
        let shape = createShape(this._width, this._height, x, y,
            this._borderRadius);
        shape.holes.push(this._bodyShape);
        let geometry = new THREE.ShapeGeometry(shape);
        this._border = new THREE.Mesh(geometry, this._borderMaterial);
        this.add(this._border);
    }

    add(object) {
        if(object instanceof UIComponent) {
            this._content.add(object);
        } else {
            super.add(object);
        }
    }

    remove(object) {
        if(object instanceof UIComponent && !(object instanceof Body)) {
            this._content.remove(object);
        } else {
            super.remove(object);
        }
    }
}

export default Body;
