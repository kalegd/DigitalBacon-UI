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
        this._defaults['color'] = 0x000000;
        this._defaults['fontSize'] = 0.1;
        this._defaults['textAlign'] = 'left';
        this._text = new Text();
        this._content.add(this._text);
        if(this.font) this._text.font = this.font;
        this._text.color = this.color;
        this._text.fontSize = this.fontSize;
        this._text.textAlign = this.textAlign;
        this._text.anchorX = 'center';
        this._text.anchorY = 'middle';
        this._text.overflowWrap = 'break-word';
        if(typeof this.maxWidth == Number) this._text.maxWidth = this.maxWidth;
        this._text.addEventListener('synccomplete', () => this.updateLayout());
        this._text.sync();
        this._text.text = text || '';
        this._text.sync();
        if(this.overflow != 'visible')
            this._text.material.clippingPlanes = this._getClippingPlanes();
    }

    _handleStyleUpdateForColor() {
        this._text.color = this.color;
    }

    _handleStyleUpdateForFont() {
        this._text.font = this.font;
        if(this.width == 'auto' || this.height == 'auto') this.updateLayout();
    }

    _handleStyleUpdateForFontSize() {
        this._text.fontSize = this.fontSize;
        if(this.width == 'auto' || this.height == 'auto') this.updateLayout();
    }

    _handleStyleUpdateForTextAlign() {
        this._text.textAlign = this.textAlign;
    }

    _handleStyleUpdateForMaxWidth() {
        if(this.maxWidth != null) {
            if(typeof this.maxWidth == 'number')
                this._text.maxWidth = this.maxWidth;
        } else {
            this._text.maxWidth = null;
        }
        super._handleStyleUpdateForMaxWidth();
    }

    _computeDimension(dimensionName, overrideParam) {
        let dimension = this[(overrideParam) ? overrideParam : dimensionName];
        if(dimension != 'auto') {
            let value = super._computeDimension(dimensionName, overrideParam);
            if(dimensionName == 'width') this._text.maxWidth = value;
            return value;
        }
        let capitalizedDimensionName = capitalizeFirstLetter(dimensionName);
        let computedParam = 'computed' + capitalizedDimensionName;
        let maxParam = 'max' + capitalizedDimensionName;
        let minParam = 'min' + capitalizedDimensionName;
        let textRenderInfo = this._text.textRenderInfo;
        if(textRenderInfo) {
            let bounds = textRenderInfo.blockBounds;
            this[computedParam] = (dimensionName == 'width')
                ? Math.abs(bounds[0] - bounds[2])
                : Math.abs(bounds[1] - bounds[3]);
        }
        if(overrideParam) {
            return this[computedParam];
        } else if(this[computedParam] == 0 && this[minParam] != null) {
            this._computeDimension(dimensionName, minParam);
        } else if(dimensionName == 'width' && this[maxParam]) {
            let currentComputedValue = this[computedParam];
            this._computeDimension(dimensionName, maxParam);
            this._text.maxWidth = this[computedParam];
            if(currentComputedValue < this[computedParam])
                this[computedParam] = currentComputedValue;
        }
        this._computeUnpaddedAndMarginedDimensions(dimensionName,
            this[computedParam]);
        return this[computedParam];
    }

    _updateMaterialOffset(parentOffset) {
        super._updateMaterialOffset(parentOffset);
        this._text.depthOffset = -1 * this._materialOffset - 1;
        this._text.renderOrder = this._materialOffset + 1;
    }

    get text() { return this._text.text; }
    get troikaText() { return this._text; }

    set text(v) {
        this._text.text = v;
        this._text.sync();
    }
}

export default TextComponent;
