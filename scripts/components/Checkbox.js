/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import InteractableComponent from '/scripts/components/InteractableComponent.js';
import { Text } from '/node_modules/troika-three-text/dist/troika-three-text.esm.js';

class Checkbox extends InteractableComponent {
    constructor(...styles) {
        super(...styles);
        this._defaults['backgroundVisible'] = true;
        this._defaults['borderMaterial'].color.set(0x4f4f4f);
        this._defaults['borderMaterial'].opacity = 0.9;
        this._defaults['borderWidth'] = 0.002;
        this._defaults['color'] = 0xffffff;
        this._defaults['height'] = 0.08;
        this._defaults['width'] = 0.08;
        this._text = new Text();
        this._content.add(this._text);
        this._text.text = ' ';
        this._text.color = this.color;
        this._text.lineHeight = 1;
        this._text.textAlign = 'center';
        this._text.anchorX = 'center';
        this._text.anchorY = 'middle';
        this.onClick = this.onTouch = () => this._change();
        if(this.overflow != 'visible')
            this._text.material.clippingPlanes = this._getClippingPlanes();
        this.updateLayout();
    }

    updateLayout() {
        super.updateLayout();
        this._text.fontSize = Math.min(this.computedHeight, this.computedWidth)
            * 0.65;
    }

    _updateMaterialOffset(parentOffset) {
        super._updateMaterialOffset(parentOffset);
        this._text.depthOffset = -1 * this._materialOffset - 1;
        this._text.renderOrder = this._materialOffset + 1;
    }

    _change() {
        this._checked = !this._checked;
        if(this._checked) {
            this._text.text = '✔';
            this.material.color.set(0x0030ff);
            this._text.sync();
        } else {
            this._text.text = '';
            this.material.color.set(0xffffff);
        }
        if(this._onChange) this._onChange(this._checked);
    }

    get checked() { return this._checked; }
    get onChange() { return this._onChange; }

    set checked(checked) {
        if(checked == this._checked) return;
        this._checked = checked;
        if(checked) {
            this._text.text = '✔';
            this.material.color.set(0x0030ff);
        } else {
            this._text.text = '';
            this.material.color.set(0xffffff);
        }
        this._text.sync();
    }
    set onChange(onChange) { this._onChange = onChange; }
}

export default Checkbox;
