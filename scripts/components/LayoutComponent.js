/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import UIComponent from '/scripts/components/UIComponent.js';
import UpdateHandler from '/scripts/handlers/UpdateHandler.js';
import { capitalizeFirstLetter, numberOr } from '/scripts/utils.js';
import * as THREE from 'three';

const DEFAULT_MATERIAL = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    transparent: true,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
});

const DEFAULT_GLASSMORPHISM_MATERIAL = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.45,
    side: THREE.DoubleSide,
    specularIntensity: 0,
    transmission: 0.99,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
});

const DEFAULT_BORDER_MATERIAL = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    side: THREE.DoubleSide,
    polygonOffset: true,
});

class LayoutComponent extends UIComponent {
    constructor(...styles) {
        super(...styles);
        this._defaults['alignItems'] = 'center';
        this._defaults['backgroundVisible'] = false;
        this._defaults['borderMaterial'] = DEFAULT_BORDER_MATERIAL.clone();
        this._defaults['borderRadius'] = 0;
        this._defaults['borderWidth'] = 0;
        this._defaults['contentDirection'] = 'column';
        this._defaults['justifyContent'] = 'start';
        this._defaults['margin'] = 0;
        this._defaults['material'] = this.glassmorphism
            ? DEFAULT_GLASSMORPHISM_MATERIAL.clone()
            : DEFAULT_MATERIAL.clone();
        this._defaults['height'] = 'auto';
        this._defaults['overflow'] = 'visible';
        this._defaults['padding'] = 0;
        this._defaults['width'] = 'auto';
        this._updateListener = () => this._updateClippingPlanes();
        this.computedHeight = 0;
        this.marginedHeight = 0;
        this.unpaddedHeight = 0;
        this.computedWidth = 0;
        this.marginedWidth = 0;
        this.unpaddedWidth = 0;
        this._materialOffset = 0;
        this._content = new THREE.Object3D();
        this._content.position.z = 0.00000001;
        this.addEventListener('added', () => this._onAdded());
        this.addEventListener('removed', () => this._onRemoved());
        this.add(this._content);
        if(this.overflow != 'visible') this._createClippingPlanes();
    }

    _handleStyleUpdateForAlignItems() {
        this.updateLayout();
    }

    _handleStyleUpdateForBackgroundVisible() {
        if(!this._background) return;
        this._background.visible = this.backgroundVisible || false;
    }

    _handleStyleUpdateForBorderRadius() {
        this._createBackground();
    }

    _handleStyleUpdateForBorderBottomLeftRadius() {
        this._createBackground();
    }

    _handleStyleUpdateForBorderBottomRightRadius() {
        this._createBackground();
    }

    _handleStyleUpdateForBorderTopLeftRadius() {
        this._createBackground();
    }

    _handleStyleUpdateForBorderTopRightRadius() {
        this._createBackground();
    }

    _handleStyleUpdateForBorderMaterial() {
        let borderMaterial = this.borderMaterial;
        borderMaterial.polygonOffset = true;
        borderMaterial.polygonOffsetFactor = borderMaterial.polygonOffsetUnits
            = -1 * this._materialOffset;
        this._border.material = borderMaterial;
    }

    _handleStyleUpdateForJustifyContent() {
        this.updateLayout();
    }

    _handleStyleUpdateForMargin() {
        this.updateLayout();
    }

    _handleStyleUpdateForMarginBottom() {
        this.updateLayout();
    }

    _handleStyleUpdateForMarginLeft() {
        this.updateLayout();
    }

    _handleStyleUpdateForMarginRight() {
        this.updateLayout();
    }

    _handleStyleUpdateForMarginTop() {
        this.updateLayout();
    }

    _handleStyleUpdateForMaxHeight() {
        this.updateLayout();
    }

    _handleStyleUpdateForMaxWidth() {
        this.updateLayout();
    }

    _handleStyleUpdateForMinHeight() {
        this.updateLayout();
    }

    _handleStyleUpdateForMinWidth() {
        this.updateLayout();
    }

    _handleStyleUpdateForPadding() {
        this.updateLayout();
    }

    _handleStyleUpdateForPaddingBottom() {
        this.updateLayout();
    }

    _handleStyleUpdateForPaddingLeft() {
        this.updateLayout();
    }

    _handleStyleUpdateForPaddingRight() {
        this.updateLayout();
    }

    _handleStyleUpdateForPaddingTop() {
        this.updateLayout();
    }

    _handleStyleUpdateForHeight() {
        this.updateLayout();
    }

    _handleStyleUpdateForWidth() {
        this.updateLayout();
    }

    _handleStyleUpdateForMaterial() {
        let material = this.material;
        material.polygonOffset = true;
        material.polygonOffsetFactor = material.polygonOffsetUnits
            = -1 * this._materialOffset;
        this._background.material = material;
    }

    _handleStyleUpdateForMaterialColor() {
        let materialColor = this.materialColor;
        if(materialColor == null) materialColor = '#ffffff';
        this.material.color.set(materialColor);
    }

    _handleStyleUpdateForOpacity() {
        let opacity = this.opacity;
        if(opacity == null) opacity = 1;
        this.material.opacity = opacity;
    }

    _handleStyleUpdateForOverflow() {
        if(this.overflow != 'visible') {
            if(!this.clippingPlanes) this._createClippingPlanes();
        } else if(this.clippingPlanes) {
            this._clearClippingPlanes();
        }
    }

    _createBackground() {
        if(this._background) this.remove(this._background);
        if(this._border) this.remove(this._border);
        this._background = null;
        this._border = null;
        let material = this.material;
        let materialColor = this.materialColor;
        let opacity = this.opacity;
        if(materialColor != null) material.color.set(materialColor);
        if(opacity) material.opacity = opacity;
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
        let renderOrder = this._materialOffset;
        if(borderWidth) {
            let borderShape = LayoutComponent.createShape(width, height,
                topLeftRadius, topRightRadius, bottomLeftRadius,
                bottomRightRadius);
            topLeftRadius = Math.max(topLeftRadius - borderWidth, 0);
            topRightRadius = Math.max(topRightRadius - borderWidth, 0);
            bottomLeftRadius = Math.max(bottomLeftRadius - borderWidth, 0);
            bottomRightRadius = Math.max(bottomRightRadius - borderWidth, 0);
            height -= 2 * borderWidth;
            width -= 2 * borderWidth;
            let shape = LayoutComponent.createShape(width, height,topLeftRadius,
                topRightRadius, bottomLeftRadius, bottomRightRadius);
            let geometry = new THREE.ShapeGeometry(shape);
            this._background = new THREE.Mesh(geometry, this.material);
            this.add(this._background);
            borderShape.holes.push(shape);
            geometry = new THREE.ShapeGeometry(borderShape);
            this._border = new THREE.Mesh(geometry, this.borderMaterial);
            this.add(this._border);
            this._border.renderOrder = renderOrder;
        } else {
            let shape = LayoutComponent.createShape(width, height,topLeftRadius,
                topRightRadius, bottomLeftRadius, bottomRightRadius);
            let geometry = new THREE.ShapeGeometry(shape);
            this._background = new THREE.Mesh(geometry, this.material);
            this.add(this._background);
        }
        this._background.renderOrder = renderOrder;
        if(!this.backgroundVisible)
            this._background.visible = false;
    }

    _addClippingPlanesUpdateListener() {
        if(this.clippingPlanes) UpdateHandler.add(this._updateListener);
        for(let child of this._content.children) {
            if(child instanceof LayoutComponent)
                child._addClippingPlanesUpdateListener();
        }
    }

    _removeClippingPlanesUpdateListener() {
        UpdateHandler.remove(this._updateListener);
        for(let child of this._content.children) {
            if(child instanceof LayoutComponent)
                child._removeClippingPlanesUpdateListener();
        }
    }

    _createClippingPlanes() {
        this.clippingPlanes = [
            new THREE.Plane(new THREE.Vector3(0, 1, 0)),
            new THREE.Plane(new THREE.Vector3(0, -1, 0)),
            new THREE.Plane(new THREE.Vector3(1, 0, 0)),
            new THREE.Plane(new THREE.Vector3(-1, 0, 0))
        ];
        this._updateClippingPlanes();
        this.updateClippingPlanes(true);
        UpdateHandler.add(this._updateListener);
    }

    _getClippingPlanes() {
        let clippingPlanes = [];
        let object = this;
        while(object instanceof LayoutComponent) {
            if(object.clippingPlanes)
                clippingPlanes.push(...object.clippingPlanes);
            object = object.parentComponent;
        }
        return clippingPlanes.length ? clippingPlanes : null;
    }

    _clearClippingPlanes() {
        this.clippingPlanes = null;
        UpdateHandler.remove(this._updateListener);
        this.updateClippingPlanes(true);
    }

    _updateClippingPlanes() {
        let x = this.computedWidth / 2;
        let y = this.computedHeight / 2;
        this.clippingPlanes[0].constant = y;
        this.clippingPlanes[1].constant = y;
        this.clippingPlanes[2].constant = x;
        this.clippingPlanes[3].constant = x;
        this.clippingPlanes[0].normal.set(0, 1, 0);
        this.clippingPlanes[1].normal.set(0, -1, 0);
        this.clippingPlanes[2].normal.set(1, 0, 0);
        this.clippingPlanes[3].normal.set(-1, 0, 0);
        this.updateWorldMatrix(true);
        for(let plane of this.clippingPlanes) {
            plane.applyMatrix4(this.matrixWorld);
        }
    }

    updateClippingPlanes(recursive) {
        let clippingPlanes = this._getClippingPlanes();
        this.material.clippingPlanes = clippingPlanes;
        this.borderMaterial.clippingPlanes = clippingPlanes;
        if(this._text) this._text.material.clippingPlanes = clippingPlanes;
        if(!recursive) return;
        for(let child of this._content.children) {
            if(child instanceof LayoutComponent)
                child.updateClippingPlanes(true);
        }
    }

    updateLayout() {
        let oldHeight = this.computedHeight;
        let oldWidth = this.computedWidth;
        let oldMarginedHeight = this.marginedHeight;
        let oldMarginedWidth = this.marginedWidth;
        let oldUnpaddedHeight = this.unpaddedHeight;
        let oldUnpaddedWidth = this.unpaddedWidth;
        let height = this._computeDimension('height');
        let width = this._computeDimension('width');
        let contentHeight = this._getContentHeight();
        let contentWidth = this._getContentWidth();
        let contentSize = this._content.children.reduce(
            (sum, child) => sum + (child instanceof LayoutComponent ? 1 : 0),0);
        let alignItems = this.alignItems;
        let justifyContent = this.justifyContent;
        let p, dimension, unpaddedDimension, sign, paddingPrior,
            otherPaddingPrior, otherPaddingAfter, otherDimension,
            contentDimension, computedDimensionName, otherComputedDimensionName,
            marginPriorName, marginAfterName, otherMarginPriorName,
            otherMarginAfterName, vec2Param, otherVec2Param;
        let itemGap = 0;
        if(this.contentDirection == 'row') {
            dimension = -width;
            otherDimension = height;
            contentDimension = -contentWidth;
            unpaddedDimension = -this.unpaddedWidth;
            computedDimensionName = 'computedWidth';
            otherComputedDimensionName = 'computedHeight';
            paddingPrior = this.paddingLeft || this.padding;
            otherPaddingPrior = this.paddingTop || this.padding;
            otherPaddingAfter = this.paddingBottom || this.padding;
            marginPriorName = 'marginLeft';
            marginAfterName = 'marginRight';
            otherMarginPriorName = 'marginTop';
            otherMarginAfterName = 'marginBottom';
            vec2Param = 'x';
            otherVec2Param = 'y';
            sign = 1;
        } else {
            dimension = height;
            otherDimension = -width;
            contentDimension = contentHeight;
            unpaddedDimension = this.unpaddedHeight;
            computedDimensionName = 'computedHeight';
            otherComputedDimensionName = 'computedWidth';
            paddingPrior = this.paddingTop || this.padding;
            otherPaddingPrior = this.paddingLeft || this.padding;
            otherPaddingAfter = this.paddingRight || this.padding;
            marginPriorName = 'marginTop';
            marginAfterName = 'marginBottom';
            otherMarginPriorName = 'marginLeft';
            otherMarginAfterName = 'marginRight';
            vec2Param = 'y';
            otherVec2Param = 'x';
            sign = -1;
        }
        if(justifyContent == 'start') {
            p = dimension / 2;
            p += paddingPrior * sign;
        } else if(justifyContent == 'end') {
            p = dimension / -2 + contentDimension;
            p -= paddingPrior * sign;
        } else if(justifyContent == 'center') {
            p = contentDimension / 2;
        } else if(Math.abs(unpaddedDimension) - Math.abs(contentDimension) < 0){
            //spaceBetween, spaceAround, and spaceEvenly act the same when
            //overflowed
            p = contentDimension / 2;
        } else {
            if(justifyContent == 'spaceBetween') {
                itemGap =  Math.abs(unpaddedDimension - contentDimension)
                    / (contentSize - 1) * sign;
                p = dimension / 2;
            } else if(justifyContent == 'spaceAround') {
                itemGap = Math.abs(unpaddedDimension - contentDimension)
                    / contentSize * sign;
                p = dimension / 2 + itemGap / 2;
            } else if(justifyContent == 'spaceEvenly') {
                itemGap = Math.abs(unpaddedDimension - contentDimension)
                    / (contentSize + 1) * sign;
                p = dimension / 2 + itemGap;
            }
            p += paddingPrior * sign;
        }
        for(let child of this._content.children) {
            if(child instanceof LayoutComponent) {
                let margin = child.margin || 0;
                let marginPrior = numberOr(child[marginPriorName], margin);
                let marginAfter = numberOr(child[marginAfterName], margin);
                let otherMarginPrior = numberOr(child[otherMarginPriorName],
                    margin);
                let otherMarginAfter = numberOr(child[otherMarginAfterName],
                    margin);
                p += marginPrior * sign;
                child.position[vec2Param] = p + child[computedDimensionName]
                    / 2 * sign;
                p += child[computedDimensionName] * sign;
                p += marginAfter * sign;
                p += itemGap;
                if(alignItems == 'start') {
                    child.position[otherVec2Param] = otherDimension / 2
                        - child[otherComputedDimensionName] / 2 * sign
                        - otherPaddingPrior * sign
                        - otherMarginPrior * sign;
                } else if(alignItems == 'end') {
                    child.position[otherVec2Param] = -otherDimension / 2
                        + child[otherComputedDimensionName] / 2 * sign
                        + otherPaddingAfter * sign
                        + otherMarginAfter * sign;
                } else {
                    let offset = (otherPaddingAfter - otherPaddingPrior
                        + otherMarginAfter - otherMarginPrior) * sign / 2;
                    child.position[otherVec2Param] = offset;
                }
            }
        }
        if(oldWidth != width || oldHeight != height) {
            this._createBackground();
            if(this.clippingPlanes) this._updateClippingPlanes();
            if(this.parentComponent instanceof LayoutComponent)
                this.parent.parent.updateLayout();
            this._updateChildrensLayout(oldWidth != width, oldHeight != height);
        } else if(oldMarginedHeight != this.marginedHeight
                || oldMarginedWidth != this.marginedWidth) {
            if(this.clippingPlanes) this._updateClippingPlanes();
            if(this.parentComponent instanceof LayoutComponent)
                this.parent.parent.updateLayout();
        } else if(oldUnpaddedHeight != this.unpaddedHeight
                || oldUnpaddedWidth != this.unpaddedWidth) {
            this._updateChildrensLayout(oldUnpaddedWidth != this.unpaddedWidth,
                oldUnpaddedHeight != this.unpaddedHeight);
        }
    }

    _updateChildrensLayout(widthChanged, heightChanged) {
        for(let child of this._content.children) {
            if(child instanceof LayoutComponent) {
                let needsUpdate = false;
                if(widthChanged) {
                    let width = child.width;
                    if(typeof width == 'string' && width.endsWith('%'))
                        needsUpdate = true;
                }
                if(!needsUpdate && heightChanged) {
                    let height = child.height;
                    if(typeof height == 'string' && height.endsWith('%'))
                        needsUpdate = true;
                }
                if(needsUpdate) child.updateLayout();
            }
        }
    }

    _computeDimension(dimensionName, overrideParam) {
        let capitalizedDimensionName = capitalizeFirstLetter(dimensionName);
        let computedParam = 'computed' + capitalizedDimensionName;
        let marginedParam = 'margined' + capitalizedDimensionName;
        let unpaddedParam = 'unpadded' + capitalizedDimensionName;
        let maxParam = 'max' + capitalizedDimensionName;
        let minParam = 'min' + capitalizedDimensionName;
        let dimension = this[(overrideParam) ? overrideParam : dimensionName];
        if(typeof dimension == 'number') {
            this[computedParam] = dimension;
        } else if(dimension == 'auto') {
            if((this.contentDirection=='column') == (dimensionName=='height')) {
                let sum = 0;
                for(let child of this._content.children) {
                    if(child instanceof LayoutComponent)
                        sum += child[marginedParam];
                }
                let padding = (dimensionName == 'height')
                    ? this.paddingVertical
                    : this.paddingHorizontal;
                this[computedParam] = sum + padding;
            } else {
                let max = 0;
                for(let child of this._content.children) {
                    if(child instanceof LayoutComponent)
                        max = Math.max(max, child[marginedParam]);
                }
                let padding = (dimensionName == 'height')
                    ? this.paddingVertical
                    : this.paddingHorizontal;
                this[computedParam] = max + padding;
            }
        } else {
            let parentComponent = this.parentComponent;
            if(parentComponent instanceof LayoutComponent) {
                let percent = Number(dimension.replace('%', '')) / 100;
                this[computedParam] = parentComponent[unpaddedParam] * percent;
            }
        }
        if(overrideParam) {
            return this[computedParam];
        } else {
            let skipMin = false;
            if(this[maxParam] != null) {
                let currentComputedValue = this[computedParam];
                this._computeDimension(dimensionName, maxParam);
                if(currentComputedValue < this[computedParam]) {
                    this[computedParam] = currentComputedValue;
                } else {
                    skipMin = true;
                }
            }
            if(this[minParam] != null && !skipMin) {
                let currentComputedValue = this[computedParam];
                this._computeDimension(dimensionName, minParam);
                if(currentComputedValue > this[computedParam])
                    this[computedParam] = currentComputedValue;
            }
        }
        this._computeUnpaddedAndMarginedDimensions(dimensionName,
            this[computedParam]);
        return this[computedParam];
    }

    _computeUnpaddedAndMarginedDimensions(dimensionName, computed) {
        let marginedParam = 'margined' + capitalizeFirstLetter(dimensionName);
        let unpaddedParam = 'unpadded' + capitalizeFirstLetter(dimensionName);
        let direction = (dimensionName == 'height') ? 'Vertical' : 'Horizontal';
        this[unpaddedParam] = computed - this['padding' + direction];
        this[marginedParam] = computed + this['margin' + direction];
        if(dimensionName == 'height') {
            this.unpaddedHeight = Math.max(computed - this.paddingVertical, 0);
            this.marginedHeight = computed + this.marginVertical;
        } else {
            this.unpaddedWidth = Math.max(computed - this.paddingHorizontal, 0);
            this.marginedWidth = computed + this.marginHorizontal;
        }
    }

    _getContentHeight() {
        if(this.contentDirection == 'column') {
            let sum = 0;
            for(let child of this._content.children) {
                if(child instanceof LayoutComponent)
                    sum += child.marginedHeight;
            }
            return sum;
        } else {
            let max = 0;
            for(let child of this._content.children) {
                if(child instanceof LayoutComponent)
                    max = Math.max(max, child.marginedHeight);
            }
            return max;
        }
    }

    _getContentWidth() {
        if(this.contentDirection == 'row') {
            let sum = 0;
            for(let child of this._content.children) {
                if(child instanceof LayoutComponent)
                    sum += child.marginedWidth;
            }
            return sum;
        } else {
            let max = 0;
            for(let child of this._content.children) {
                if(child instanceof LayoutComponent)
                    max = Math.max(max, child.marginedWidth);
            }
            return max;
        }
    }

    _updateMaterialOffset(parentOffset) {
        this._materialOffset = parentOffset + 1;
        let material = this.material;
        let borderMaterial = this.borderMaterial;
        borderMaterial.polygonOffset = material.polygonOffset = true;
        borderMaterial.polygonOffsetFactor = borderMaterial.polygonOffsetUnits
            = material.polygonOffsetFactor = material.polygonOffsetUnits
            = -1 * this._materialOffset;
        for(let child of this._content.children) {
            if(child instanceof LayoutComponent)
                child._updateMaterialOffset(this._materialOffset);
        }
        let order = this._materialOffset;
        if(this._background) this._background.renderOrder = order;
        if(this._border) this._border.renderOrder = order;
    }

    _onAdded() {
        this._addClippingPlanesUpdateListener();
    }

    _onRemoved() {
        this._removeClippingPlanesUpdateListener();
    }

    add(object) {
        if(arguments.length > 1) {
            for(let argument of arguments) {
                this.add(argument);
            }
        } else if(object instanceof UIComponent
                && !object.bypassContentPositioning) {
            this._content.add(object);
            object.updateLayout();
            object._updateMaterialOffset(this._materialOffset);
            object.updateClippingPlanes(true);
            this.updateLayout();
        } else {
            super.add(object);
        }
    }

    remove(object) {
        if(arguments.length > 1) {
            for(let argument of arguments) {
                this.add(argument);
            }
        } else if(object instanceof UIComponent
                && !object.bypassContentPositioning) {
            this._content.remove(object);
        } else {
            super.remove(object);
        }
    }

    get marginHorizontal() {
        let margin = this.margin || 0;
        let marginLeft = numberOr(this.marginLeft, margin);
        let marginRight = numberOr(this.marginRight, margin);
        return marginLeft + marginRight;
    }
    get marginVertical() {
        let margin = this.margin || 0;
        let marginTop = numberOr(this.marginTop, margin);
        let marginBottom = numberOr(this.marginBottom, margin);
        return marginTop + marginBottom;
    }
    get paddingHorizontal() {
        let padding = this.padding || 0;
        let paddingLeft = numberOr(this.paddingLeft, padding);
        let paddingRight = numberOr(this.paddingRight, padding);
        return paddingLeft + paddingRight;
    }
    get paddingVertical() {
        let padding = this.padding || 0;
        let paddingTop = numberOr(this.paddingTop, padding);
        let paddingBottom = numberOr(this.paddingBottom, padding);
        return paddingTop + paddingBottom;
    }
    get parentComponent() { return this.parent?.parent; }

    //https://stackoverflow.com/a/65576761/11626958
    static createShape(width, height, topLeftRadius, topRightRadius,
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
                halfHeight - topLeftRadius, topLeftRadius, Math.PI, Math.PI/2,
                true);
        shape.lineTo(halfWidth - topRightRadius, halfHeight);
        if(topRightRadius)
            shape.absarc(halfWidth - topRightRadius, halfHeight -topRightRadius,
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
}

export default LayoutComponent;
