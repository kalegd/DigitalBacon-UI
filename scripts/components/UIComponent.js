/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Style from '/scripts/components/Style.js';
import { capitalizeFirstLetter, numberOr } from '/scripts/utils.js';
import * as THREE from 'three';

class UIComponent extends THREE.Object3D {
    constructor(...styles) {
        super();
        styles = Array.from(new Set(styles));//Remove duplicates
        this._styles = [];
        this._needsUpdate = {};
        this._overrideStyle = {};
        this._latestValue = {};
        this._defaults = {};
        this._listeners = new Map();
        for(let style of styles) {
            if(!(style instanceof Style)) style = new Style(style);
            this._styles.push(style);
            this._addStyleListenerFor(style);
        }
    }

    addStyle(style) {
        let alreadyUsed = false;
        for(let i = this._styles.length - 1; i >= 0; i--) {
            if(style == this._styles[i]) {
                this._styles.splice(i, 1);
                alreadyUsed = true;
            }
        }
        this._styles.push(style);
        for(let property in Style.PROPERTIES) {
            if(property in style) this._onStyleChange(property);
        }
        if(!alreadyUsed) this._addStyleListenerFor(style);
    }

    _addStyleListenerFor(style) {
        let id = style.addUpdateListener((property) => {
            this._onStyleChange(property);
        });
        this._listeners.set(id, style);
    }

    _onStyleChange(param) {
        this._needsUpdate[param] = true;
        let methodName = '_handleStyleUpdateFor' + capitalizeFirstLetter(param);
        if(methodName in this) this[methodName]();
    }

    removeStyle(style) {
        let removed = false;
        for(let i = this._styles.length - 1; i >= 0; i--) {
            if(style == this._styles[i]) {
                this._styles.splice(i, 1);
                removed = true;
            }
        }
        if(removed) {
            for(let property in Style.PROPERTIES) {
                if(property in style) this._onStyleChange(property);
            }
            let listenerId = this._listeners.get(style);
            if(listenerId) style.removeUpdateListener(listenerId);
            this._listeners.delete(style);
        }
    }

    _createBackground() {
        if(this._background) this.remove(this._background);
        if(this._border) this.remove(this._border);
        this._border = null;
        let borderWidth = this.borderWidth || 0;
        let borderRadius = this.borderRadius || 0;
        let topLeftRadius = numberOr(this.topLeftRadius, borderRadius);
        let topRightRadius = numberOr(this.topRightRadius, borderRadius);
        let bottomLeftRadius = numberOr(this.bottomLeftRadius, borderRadius);
        let bottomRightRadius = numberOr(this.bottomRightRadius, borderRadius);
        let height = this.height;
        let width = this.width;
        if(borderRadius) {
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

    _genericGet(param) {
        if(param in this._overrideStyle) return this._overrideStyle[param];
        if(!this._needsUpdate[param] && this._latestValue[param] != null)
            return this._latestValue[param];
        for(let i = this._styles.length - 1; i >= 0; i--) {
            let value = this._styles[i][param];
            if(value != null) {
                this._needsUpdate[param] = false;
                this._latestValue[param] = value;
                return value;
            }
        }
        this._needsUpdate[param] = false;
        this._latestValue[param] = this._defaults[param];
        return this._defaults[param];
    }

    _genericSet(param, value) {
        if(value == null) {
            delete this._overrideStyle[param];
        } else {
            this._overrideStyle[param] = value;
        }
        let methodName = '_handleStyleUpdateFor' + capitalizeFirstLetter(param);
        if(methodName in this) this[methodName]();
    }

    get borderMaterial() { return this._genericGet('borderMaterial'); }
    get borderRadius() { return this._genericGet('borderRadius'); }
    get borderBottomLeftRadius() {
        return this._genericGet('borderBottomLeftRadius');
    }
    get borderBottomRightRadius() {
        return this._genericGet('borderBottomRightRadius');
    }
    get borderTopLeftRadius() {
        return this._genericGet('borderTopLeftRadius');
    }
    get borderTopRightRadius() {
        return this._genericGet('borderTopRightRadius');
    }
    get borderWidth() { return this._genericGet('borderWidth'); }
    get height() { return this._genericGet('height'); }
    get material() { return this._genericGet('material'); }
    get width() { return this._genericGet('width'); }

    set borderMaterial(v) { return this._genericSet('borderMaterial', v); }
    set borderRadius(v) { this._genericSet('borderRadius', v); }
    set borderBottomLeftRadius(v) {
        this._genericSet('borderBottomLeftRadius', v);
    }
    set borderBottomRightRadius(v) {
        this._genericSet('borderBottomRightRadius', v);
    }
    set borderTopLeftRadius(v) { this._genericSet('borderTopLeftRadius', v); }
    set borderTopRightRadius(v) { this._genericSet('borderTopRightRadius', v); }
    set borderWidth(v) { return this._genericSet('borderWidth', v); }
    set height(v) { this._genericSet('height', v); }
    set material(v) { return this._genericSet('material', v); }
    set width(v) { this._genericSet('width', v); }
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
        shape.quadraticCurveTo(negativeHalfWidth, halfHeight,
            negativeHalfWidth + topLeftRadius, halfHeight);
    shape.lineTo(halfWidth - topRightRadius, halfHeight);
    if(topRightRadius)
        shape.quadraticCurveTo(halfWidth, halfHeight, halfWidth,
            halfHeight - topRightRadius);
    shape.lineTo(halfWidth, negativeHalfHeight + bottomRightRadius);
    if(bottomRightRadius)
        shape.quadraticCurveTo(halfWidth, negativeHalfHeight, halfWidth - bottomRightRadius, negativeHalfHeight);
    shape.lineTo(negativeHalfWidth + bottomLeftRadius, negativeHalfHeight);
    if(bottomLeftRadius)
        shape.quadraticCurveTo(negativeHalfWidth, negativeHalfHeight,
            negativeHalfWidth, negativeHalfHeight + bottomLeftRadius);
    return shape;
}

export default UIComponent;
