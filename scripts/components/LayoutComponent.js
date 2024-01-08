/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import UIComponent from '/scripts/components/UIComponent.js';
import { capitalizeFirstLetter, numberOr } from '/scripts/utils.js';
import * as THREE from 'three';

class LayoutComponent extends UIComponent {
    constructor(...styles) {
        super(...styles);
        this._content = new THREE.Object3D();
        this.add(this._content);
    }

    _handleStyleUpdateForHeight() {
        this._createBackground();
    }

    _handleStyleUpdateForWidth() {
        this._createBackground();
    }

    _createBackground() {
        if(this._background) this.remove(this._background);
        if(this._border) this.remove(this._border);
        this._border = null;
        let borderWidth = this.borderWidth || 0;
        let borderRadius = this.borderRadius || 0;
        let topLeftRadius = numberOr(this.borderTopLeftRadius, borderRadius);
        let topRightRadius = numberOr(this.borderTopRightRadius, borderRadius);
        let bottomLeftRadius = numberOr(this.borderBottomLeftRadius,
            borderRadius);
        let bottomRightRadius = numberOr(this.borderBottomRightRadius,
            borderRadius);
        let height = this.height;
        let width = this.width;
        if(borderWidth) {
            let borderShape = createShape(width, height, topLeftRadius,
                topRightRadius, bottomLeftRadius, bottomRightRadius);
            topLeftRadius = Math.max(topLeftRadius - borderWidth, 0);
            topRightRadius = Math.max(topRightRadius - borderWidth, 0);
            bottomLeftRadius = Math.max(bottomLeftRadius - borderWidth, 0);
            bottomRightRadius = Math.max(bottomRightRadius - borderWidth, 0);
            height -= 2 * borderWidth;
            width -= 2 * borderWidth;
            let shape = createShape(width, height, topLeftRadius,
                topRightRadius, bottomLeftRadius, bottomRightRadius);
            let geometry = new THREE.ShapeGeometry(shape);
            this._background = new THREE.Mesh(geometry, this.material);
            this.add(this._background);
            borderShape.holes.push(shape);
            geometry = new THREE.ShapeGeometry(borderShape);
            this._border = new THREE.Mesh(geometry, this.borderMaterial);
            this.add(this._border);
        } else {
            let shape = createShape(width, height, topLeftRadius,
                topRightRadius, bottomLeftRadius, bottomRightRadius);
            let geometry = new THREE.ShapeGeometry(this._bodyShape);
            this._background = new THREE.Mesh(geometry, this._material);
            this.add(this._background);
        }
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

//https://stackoverflow.com/a/65576761/11626958
function createShape(width, height, topLeftRadius, topRightRadius,
        bottomLeftRadius, bottomRightRadius) {
    let shape = new THREE.Shape();
    let halfWidth = width / 2;
    let halfHeight = height / 2;
    let negativeHalfWidth = halfWidth * -1;
    let negativeHalfHeight = halfHeight * -1;
    shape.moveTo(negativeHalfWidth, negativeHalfHeight + bottomLeftRadius);
    shape.lineTo(negativeHalfWidth, halfHeight - topLeftRadius);
    if(topLeftRadius)
        shape.absarc(negativeHalfWidth + topLeftRadius,
            halfHeight - topLeftRadius, topLeftRadius, Math.PI, Math.PI/2,true);
    shape.lineTo(halfWidth - topRightRadius, halfHeight);
    if(topRightRadius)
        shape.absarc(halfWidth - topRightRadius, halfHeight - topRightRadius,
            topRightRadius, Math.PI / 2, 0, true);
    shape.lineTo(halfWidth, negativeHalfHeight + bottomRightRadius);
    if(bottomRightRadius)
        shape.absarc(halfWidth - bottomRightRadius,
            negativeHalfHeight + bottomRightRadius, bottomRightRadius, 0,
            Math.PI / -2, true);
    shape.lineTo(negativeHalfWidth + bottomLeftRadius, negativeHalfHeight);
    if(bottomLeftRadius)
        shape.absarc(negativeHalfWidth + bottomLeftRadius,
            negativeHalfHeight + bottomLeftRadius, bottomLeftRadius,
            Math.PI / -2, -Math.PI, true);
    return shape;
}

export default LayoutComponent;
