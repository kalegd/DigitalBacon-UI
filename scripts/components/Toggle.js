/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import InteractableComponent from '/scripts/components/InteractableComponent.js';
import { numberOr } from '/scripts/utils.js';
import * as THREE from 'three';

const DEFAULT_MATERIAL = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    transparent: true,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
});

class Toggle extends InteractableComponent {
    constructor(...styles) {
        super(...styles);
        this._defaults['backgroundVisible'] = true;
        this._defaults['color'] = 0xffffff;
        this._defaults['height'] = 0.08;
        this._defaults['materialColor'] = 0xcccccc;
        this._defaults['width'] = 0.14;
        this._toggleMaterial = DEFAULT_MATERIAL.clone();
        this.onClick = this.onTouch = () => this._change();
        this.updateLayout();
    }

    _createBackground() {
        super._createBackground();
        if(this._toggleChild?.parent)
            this._toggleChild.parent.remove(this._toggleChild);
        let borderRadius = this.borderRadius || 0;
        let topLeftRadius = numberOr(this.borderTopLeftRadius, borderRadius);
        let topRightRadius = numberOr(this.borderTopRightRadius, borderRadius);
        let bottomLeftRadius = numberOr(this.borderBottomLeftRadius,
            borderRadius);
        let bottomRightRadius = numberOr(this.borderBottomRightRadius,
            borderRadius);
        let padding = this.computedHeight * 0.24;
        let height = this.computedHeight - padding;
        let width = (this.computedWidth - padding) / 2;
        this._toggleOffset = (this.computedWidth - width - padding) / 2;
        topLeftRadius = Math.max(topLeftRadius - padding / 2, 0);
        topRightRadius = Math.max(topRightRadius - padding / 2, 0);
        bottomLeftRadius = Math.max(bottomLeftRadius - padding / 2, 0);
        bottomRightRadius = Math.max(bottomRightRadius - padding / 2, 0);
        let renderOrder = this._materialOffset + 1;
        let shape = Toggle.createShape(width, height, topLeftRadius,
            topRightRadius, bottomLeftRadius, bottomRightRadius);
        let geometry = new THREE.ShapeGeometry(shape);
        this._toggleChild = new THREE.Mesh(geometry, this._toggleMaterial);
        this._toggleChild.renderOrder = renderOrder;
        this._background.add(this._toggleChild);
        if(this._checked) {
            this._toggleChild.position.setX(this._toggleOffset);
        } else {
            this._toggleChild.position.setX(-this._toggleOffset);
        }
    }

    _updateMaterialOffset(parentOffset) {
        super._updateMaterialOffset(parentOffset);
        this._toggleMaterial.polygonOffsetFactor
            = this._toggleMaterial.polygonOffsetUnits
            = -1 * this._materialOffset - 1;
        if(this._toggleChild)
            this._toggleChild.renderOrder = this._materialOffset + 1;
    }

    _change() {
        this._checked = !this._checked;
        if(this._checked) {
            this.material.color.set(0x0030ff);
            this._toggleChild.position.setX(this._toggleOffset);
        } else {
            this.material.color.set(0xcccccc);
            this._toggleChild.position.setX(-this._toggleOffset);
        }
        if(this._onChange) this._onChange(this._checked);
    }

    get checked() { return this._checked; }
    get onChange() { return this._onChange; }

    set checked(checked) {
        if(checked == this._checked) return;
        this._checked = checked;
        if(checked) {
            this.material.color.set(0x0030ff);
            this._toggleChild.position.setX(this._toggleOffset);
        } else {
            this.material.color.set(0xcccccc);
            this._toggleChild.position.setX(-this._toggleOffset);
        }
    }
    set onChange(onChange) { this._onChange = onChange; }
}

export default Toggle;
