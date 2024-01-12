/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import InteractableComponent from '/scripts/components/InteractableComponent.js';
import { capitalizeFirstLetter } from '/scripts/utils.js';
import * as THREE from 'three';

const VEC3 = new THREE.Vector3();
const DEFAULT_MATERIAL = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    transparent: true,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
});

class Image extends InteractableComponent {
    constructor(url, ...styles) {
        super(...styles);
        this._defaults['backgroundVisible'] = true;
        if(this._defaults['material'] instanceof THREE.MeshPhysicalMaterial) {
            this._defaults['material'].dispose();
            this._defaults['material'] = DEFAULT_MATERIAL.clone();
        }
        this._imageHeight = 0;
        this._imageWidth = 0;
        this.updateLayout();
        this._createTexture(url);
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
        return this[computedParam];
    }

    _createTexture(url) {
        new THREE.TextureLoader().load(url, (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            this._texture = texture;
            this._imageWidth = texture.image.width;
            this._imageHeight = texture.image.height;
            this.material.map = texture;
            this.material.needsUpdate = true;
            this.updateLayout();
        }, () => {}, () => {
            console.error("Couldn't load image :(");
        });
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
