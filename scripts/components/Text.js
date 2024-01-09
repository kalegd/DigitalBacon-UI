/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import LayoutComponent from '/scripts/components/LayoutComponent.js';
import { capitalizeFirstLetter } from '/scripts/utils.js';
import { Text } from '/node_modules/troika-three-text/dist/troika-three-text.esm.js';

class TextComponent extends LayoutComponent {
    constructor(text, ...styles) {
        super(...styles);
        this._defaults['alignItems'] = 'center';
        this._defaults['color'] = 0x000000;
        this._defaults['contentDirection'] = 'column';
        this._defaults['fontSize'] = 0.1;
        this._defaults['justifyContent'] = 'start';
        this._text = new Text();
        this._content.add(this._text);
        this._text.text = text;
        this._text.fontSize = this.fontSize;
        this._text.color = this.color;
        this._text.anchorX = 'center';
        this._text.anchorY = 'middle';
        this._text.sync(() => this.updateLayout());
        if(this.overflow != 'visible')
            this._text.material.clippingPlanes = this._getClippingPlanes();
    }

    _computeDimension(dimensionName) {
        let dimension = this[dimensionName];
        if(dimension != 'auto') return super._computeDimension(dimension);
        let computedParam = 'computed' + capitalizeFirstLetter(dimensionName);
        let textRenderInfo = this._text.textRenderInfo;
        if(textRenderInfo) {
            let bounds = textRenderInfo.blockBounds;
            this[computedParam] = (dimensionName == 'width')
                ? Math.abs(bounds[0] - bounds[2])
                : Math.abs(bounds[1] - bounds[3]);
        }
        return this[computedParam];
    }

    _updateMaterialOffset(parentOffset) {
        this._materialOffset = parentOffset + 1;
        let material = this.material;
        material.polygonOffsetFactor = material.polygonOffsetUnits
            = -10 * this._materialOffset;
        this.renderOrder = 100 - this._materialOffset;
        this._text.depthOffset = -10 * this._materialOffset - 10;
        for(let child of this._content.children) {
            if(child instanceof LayoutComponent)
                child._updateMaterialOffset(this._materialOffset);
        }
    }

    get text() { return this._text.text; }
    set text(v) {
        this._text.text = v;
        this._text.sync(() => this.updateLayout());
    }
}

export default TextComponent;
