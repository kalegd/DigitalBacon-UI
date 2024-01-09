/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import UIComponent from '/scripts/components/UIComponent.js';
import { capitalizeFirstLetter, numberOr } from '/scripts/utils.js';
import * as THREE from 'three';

const DEFAULT_MATERIAL = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transmission: 1,
    roughness: 0.45,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
});

const DEFAULT_BORDER_MATERIAL = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
});

class LayoutComponent extends UIComponent {
    constructor(...styles) {
        super(...styles);
        this._defaults['backgroundVisibility'] = 'visible';
        this._defaults['borderMaterial'] = DEFAULT_BORDER_MATERIAL.clone();
        this._defaults['borderRadius'] = 0;
        this._defaults['borderWidth'] = 0;
        this._defaults['material'] = DEFAULT_MATERIAL.clone();
        this._defaults['height'] = 'auto';
        this._defaults['width'] = 'auto';
        this._materialOffset = 0;
        this._content = new THREE.Object3D();
        this.add(this._content);
    }

    _handleStyleUpdateForHeight() {
        this.updateLayout();
    }

    _handleStyleUpdateForWidth() {
        this.updateLayout();
    }

    _createBackground() {
        if(this._background) this.remove(this._background);
        if(this._border) this.remove(this._border);
        this._background = null;
        this._border = null;
        if(this.backgroundVisibility == 'hidden') return;
        let material = this.material;
        let materialColor = this.materialColor;
        if(materialColor) material.color.set(materialColor);
        let borderWidth = this.borderWidth || 0;
        let borderRadius = this.borderRadius || 0;
        let topLeftRadius = numberOr(this.borderTopLeftRadius, borderRadius);
        let topRightRadius = numberOr(this.borderTopRightRadius, borderRadius);
        let bottomLeftRadius = numberOr(this.borderBottomLeftRadius,
            borderRadius);
        let bottomRightRadius = numberOr(this.borderBottomRightRadius,
            borderRadius);
        let height = this.computedHeight;
        let width = this.computedWidth;
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
            let geometry = new THREE.ShapeGeometry(shape);
            this._background = new THREE.Mesh(geometry, this.material);
            this.add(this._background);
        }
    }

    updateLayout() {
        let height = this._computeDimension('height');
        let width = this._computeDimension('width');
        let contentHeight = this._computeContentHeight;
        let contentWidth = this._computeContentWidth;
        let contentDirection = this.contentDirection;
        let alignItems = this.alignItems;
        let justifyContent = this.justifyContent;
        let p, dimension, dimensionName, sign, contentDimension,
            computedDimensionName, vec2Param;
        if(this.contentDirection == 'row') {
            dimension = -width;
            contentDimension = -contentWidth;
            computedDimensionName = 'computedWidth';
            vec2Param = 'x';
            sign = 1;
        } else {
            dimension = height;
            contentDimension = contentHeight;
            computedDimensionName = 'computedHeight';
            vec2Param = 'y';
            sign = -1;
        }
        if(justifyContent == 'start') {
            p = dimension / 2;
        } else if(justifyContent == 'end') {
            p = dimension / -2 + contentDimension;
        } else {
            p = contentDimension / 2;
        }
        for(let child of this._content.children) {
            if(child instanceof LayoutComponent) {
                child.position[vec2Param] = p + child[computedDimensionName]
                    / 2 * sign;
                p += child[computedDimensionName] * sign;
            }
        }
        this._createBackground();
    }

    _computeDimension(dimensionName) {
        let dimension = this[dimensionName];
        let computedParam = 'computed' + capitalizeFirstLetter(dimensionName);
        if(typeof dimension == 'number') {
            this[computedParam] = dimension;
        } else if(dimension == 'auto') {
            if((this.contentDirection=='column') == (dimensionName=='height')) {
                let sum = 0;
                for(let child of this._content.children) {
                    if(child instanceof LayoutComponent)
                        sum += child[computedParam];
                }
                this[computedParam] = sum;
            } else {
                let max = 0;
                for(let child of this._content.children) {
                    if(child instanceof LayoutComponent)
                        max = Math.max(max, child[computedParam]);
                }
                this[computedParam] = max;
            }
        } else {
            let parentComponent = this.parentComponent;
            if(parentComponent instanceof LayoutComponent) {
                let percent = Number(dimension.replace('%', '')) / 100;
                this[computedParam] = parentComponent[computedParam] * percent;
            }
        }
        return this[computedParam];
    }

    _getContentHeight() {
        if(this.contentDirection == 'column') {
            let sum = 0;
            for(let child of this._content.children) {
                if(child instanceof LayoutComponent)
                    sum += child.computedHeight;
            }
            return sum;
        } else {
            let max = 0;
            for(let child of this._content.children) {
                if(child instanceof LayoutComponent)
                    max = Math.max(max, child.computedHeight);
            }
            return max;
        }
    }

    _getContentWidth() {
        if(this.contentDirection == 'row') {
            let sum = 0;
            for(let child of this._content.children) {
                if(child instanceof LayoutComponent)
                    sum += child.computedWidth;
            }
            return sum;
        } else {
            let max = 0;
            for(let child of this._content.children) {
                if(child instanceof LayoutComponent)
                    max = Math.max(max, child.computedWidth);
            }
            return max;
        }
    }

    _updateMaterialOffset(parentOffset) {
        this._materialOffset = parentOffset + 1;
        this.material.polygonOffsetUnits = -10 * this._materialOffset;
        this.renderOrder = 100 - this._materialOffset;
        for(let child of this._content.children) {
            if(child instanceof LayoutComponent)
                child._updateMaterialOffset(this._materialOffset);
        }
    }

    add(object) {
        if(object instanceof UIComponent) {
            this._content.add(object);
            object.updateLayout();
            object._updateMaterialOffset(this._materialOffset);
            this.updateLayout();
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

    get alignItems() { return this._genericGet('alignItems'); }
    get justifyContent() { return this._genericGet('justifyContent'); }
    get parentComponent() { return this.parent?.parent; }

    set alignItems(v) { this._genericSet('alignItems', v); }
    set justifyContent(v) { this._genericSet('justifyContent', v); }
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
