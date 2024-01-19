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
        this._text.text = text || '';
        this._text.color = this.color;
        this._text.fontSize = this.fontSize;
        this._text.textAlign = this.textAlign;
        this._text.anchorX = 'center';
        this._text.anchorY = 'middle';
        this._text.overflowWrap = 'break-word';
        if(this.maxWidth != null) this._text.maxWidth = this.maxWidth;
        this._text.sync(() => this.updateLayout());
        if(this.overflow != 'visible')
            this._text.material.clippingPlanes = this._getClippingPlanes();
    }

    _handleStyleUpdateForFontSize() {
        this._text.fontSize = this.fontSize;
        if(this.width == 'auto' || this.height == 'auto') this.updateLayout();
    }

    _handleStyleUpdateForMaxWidth() {
        if(this.maxWidth != null) {
            this._text.maxWidth = this.maxWidth;
        } else {
            this._text.maxWidth = null;
        }
        super._handleStyleUpdateForMaxWidth();
    }

    _computeDimension(dimensionName) {
        let dimension = this[dimensionName];
        if(dimension != 'auto') return super._computeDimension(dimensionName);
        let computedParam = 'computed' + capitalizeFirstLetter(dimensionName);
        let textRenderInfo = this._text.textRenderInfo;
        if(textRenderInfo) {
            let bounds = textRenderInfo.blockBounds;
            this[computedParam] = (dimensionName == 'width')
                ? Math.abs(bounds[0] - bounds[2])
                : Math.abs(bounds[1] - bounds[3]);
        }
        this._computeUnpaddedAndMarginedDimensions(dimensionName,
            this[computedParam]);
        return this[computedParam];
    }

    _updateMaterialOffset(parentOffset) {
        super._updateMaterialOffset(parentOffset);
        this._text.depthOffset = -1 * this._materialOffset - 1;
        this._text.renderOrder = 100 + this._materialOffset + 1;
    }

    get text() { return this._text.text; }
    set text(v) {
        this._text.text = v;
        this._text.sync(() => this.updateLayout());
    }
}

export default TextComponent;
