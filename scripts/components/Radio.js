/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import InteractableComponent from '/scripts/components/InteractableComponent.js';
import * as THREE from 'three';

const RADIO_MAP = {};

const DEFAULT_MATERIAL = new THREE.MeshBasicMaterial({
    color: 0x0030ff,
    side: THREE.DoubleSide,
    transparent: true,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
});

class Radio extends InteractableComponent {
    constructor(name, ...styles) {
        super(...styles);
        this._defaults['backgroundVisible'] = true;
        this._defaults['borderMaterial'].color.set(0x4f4f4f);
        this._defaults['borderWidth'] = 0.002;
        this._defaults['height'] = 0.08;
        this._defaults['materialColor'] = 0xffffff;
        this._defaults['width'] = 0.08;
        this._name = name;
        this._toggleMaterial = DEFAULT_MATERIAL.clone();
        this.onClick = this.onTouch = () => this._select();
        this.updateLayout();
        if(!(name in RADIO_MAP)) RADIO_MAP[name] = new Set();
        RADIO_MAP[name].add(this);
    }

    _createBackground() {
        this._defaults['borderRadius'] = Math.min(this.computedHeight,
            this.computedHeight) / 2;
        super._createBackground();
        if(this._toggleChild?.parent)
            this._toggleChild.parent.remove(this._toggleChild);
        this._toggleChild = new THREE.Mesh(this._background.geometry,
            this._toggleMaterial);
        this._background.add(this._toggleChild);
        this._toggleChild.scale.set(0.75, 0.75, 0.75);
        this._toggleChild.visible = (this._selected) ? true : false;
        this.borderMaterial.color.set((this._selected) ? 0x0030ff : 0x4f4f4f);
    }

    _updateMaterialOffset(parentOffset) {
        super._updateMaterialOffset(parentOffset);
        this._toggleMaterial.polygonOffsetFactor
            = this._toggleMaterial.polygonOffsetUnits
            = -1 * this._materialOffset - 1;
        if(this._toggleChild)
            this._toggleChild.renderOrder = this._materialOffset + 1;
    }

    _select(ignoreOnChange) {
        for(let radio of RADIO_MAP[this._name]) {
            if(radio != this) radio.unselect();
        }
        this._selected = true;
        this.borderMaterial.color.set(0x0030ff);
        this._toggleChild.visible = true;
        if(!ignoreOnChange) {
            if(this._onChange) this._onChange(this._selected);
            if(this._onSelect) this._onSelect();
        }
    }

    _unselect(ignoreOnChange) {
        this._selected = false;
        this.borderMaterial.color.set(0x4f4f4f);
        this._toggleChild.visible = false;
        if(this._onChange && !ignoreOnChange) this._onChange(this._selected);
    }

    select() {
        this._select();
    }

    unselect() {
        this._unselect();
    }

    get onChange() { return this._onChange; }
    get onSelect() { return this._onSelect; }
    get selected() { return this._selected; }

    set onChange(onChange) { this._onChange = onChange; }
    set onSelect(onSelect) { this._onSelect = onSelect; }
    set selected(selected) {
        if(selected == this._selected) return;
        (selected) ? this._select(true) : this.unselect(true);
    }
}

export default Radio;
