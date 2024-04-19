/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import InteractableComponent from '/scripts/components/InteractableComponent.js';
import { capitalizeFirstLetter } from '/scripts/utils.js';
import * as THREE from 'three';

const VEC3 = new THREE.Vector3();

class Image extends InteractableComponent {
    constructor(url, ...styles) {
        super(...styles);
        this._defaults['backgroundVisible'] = true;
        this._defaults['textureFit'] = 'fill';
        this._imageHeight = 0;
        this._imageWidth = 0;
        this.updateLayout();
        this.updateTexture(url);
    }

    _handleStyleUpdateForTextureFit() {
        this._updateFit(-1, 1);
    }

    _computeDimension(dimensionName) {
        let dimension = this[dimensionName];
        if(dimension != 'auto') return super._computeDimension(dimensionName);
        let otherDimensionName = (dimensionName == 'height')
            ? 'width'
            : 'height';
        let capitalized = capitalizeFirstLetter(dimensionName);
        let otherCapitalized = capitalizeFirstLetter(otherDimensionName);
        let computedParam = 'computed' + capitalized;
        if(this[otherDimensionName] == 'auto') {
            this[computedParam] = this['_image' + capitalized] / 100;
        } else {
            //height is always checked first, so we want the latest width
            if(dimensionName == 'height') this._computeDimension('width');
            let factor = this['computed' + otherCapitalized]
                / this['_image' + otherCapitalized];
            this[computedParam] = (this['_image' + capitalized] * factor) || 0;
            
        }
        this._computeUnpaddedAndMarginedDimensions(dimensionName,
            this[computedParam]);
        return this[computedParam];
    }

    updateLayout() {
        let oldHeight = this.computedHeight;
        let oldWidth = this.computedWidth;
        super.updateLayout();
        this._updateFit(oldHeight, oldWidth);
    }

    _updateFit(oldHeight, oldWidth) {
        let height = this.computedHeight;
        let width = this.computedWidth;
        if((oldHeight == this.computedHeight && oldWidth == this.computedWidth)
            || !this?._texture?.image) return;
        let textureFit = this.textureFit;
        if(textureFit == 'cover') {
            let aspectRatio = width / height;
            let oldAspectRatio = oldWidth / oldHeight;
            if(aspectRatio != oldAspectRatio) {
                let imageWidth = this._texture.image.width;
                let imageHeight = this._texture.image.height;
                let imageAspectRatio = imageWidth / imageHeight;
                if(aspectRatio < imageAspectRatio) {
                    this._texture.repeat.x = aspectRatio / imageAspectRatio;
                    this._texture.repeat.y = 1;
                    this._texture.offset.x = (1 - this._texture.repeat.x) / 2;
                    this._texture.offset.y = 0;
                } else {
                    this._texture.repeat.x = 1;
                    this._texture.repeat.y = imageAspectRatio / aspectRatio;
                    this._texture.offset.x = 0;
                    this._texture.offset.y = (1 - this._texture.repeat.y) / 2;
                }
            }
        } else {
            this._texture.repeat.x = 1;
            this._texture.repeat.y = 1;
            this._texture.offset.x = 0;
            this._texture.offset.y = 0;
        }
    }

    updateTexture(url) {
        if(!url) {
            if(this._texture) this._texture.dispose();
            this._texture = null;
            this.material.map = null;
            this.material.needsUpdate = true;
        } else if(url instanceof THREE.Texture) {
            this._updateTexture((url.bypassCloning) ? url : url.clone());
        } else {
            new THREE.TextureLoader().load(url, (texture) => {
                texture.colorSpace = THREE.SRGBColorSpace;
                this._updateTexture(texture);
            }, () => {}, () => {
                console.error("Couldn't load image :(");
            });
        }
    }

    _updateTexture(texture) {
        let oldTexture = this._texture;
        this._texture = texture;
        this._imageWidth = texture.image.width;
        this._imageHeight = texture.image.height;
        this.material.map = texture;
        this.material.needsUpdate = true;
        this.updateLayout();
        this._updateFit(-1, 1);
        if(oldTexture) oldTexture.dispose();
    }

    _createBackground() {
        super._createBackground();
        let minX = this.computedWidth / 2;
        let minY = this.computedHeight / 2;
        let attPos = this._background.geometry.attributes.position;
        let attUv = this._background.geometry.attributes.uv;
        for (let i = 0; i < attPos.count; i++){
            VEC3.fromBufferAttribute(attPos, i);
            attUv.setXY(i, (VEC3.x + minX) / this.computedWidth,
                (VEC3.y + minY) / this.computedHeight);
        }
    }
}

export default Image;
