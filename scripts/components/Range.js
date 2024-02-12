/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import InteractableComponent from '/scripts/components/InteractableComponent.js';
import * as THREE from 'three';

const DEFAULT_MATERIAL = new THREE.MeshBasicMaterial({
    color: 0x0030ff,
    side: THREE.DoubleSide,
    transparent: true,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
});
const VEC3 = new THREE.Vector3();
const PLANE = new THREE.Plane();

class Range extends InteractableComponent {
    constructor(...styles) {
        super(...styles);
        this._defaults['backgroundVisible'] = true;
        this._defaults['borderMaterial'].color.set(0x4f4f4f);
        this._defaults['borderWidth'] = 0.002;
        this._defaults['height'] = 0.02;
        this._defaults['materialColor'] = 0xffffff;
        this._defaults['width'] = 0.4;
        this._value = 0;
        this._scrubberMaterial = DEFAULT_MATERIAL.clone();
        this._scrubbingOwner;
        this.pointerInteractable.addEventListener('down',
            (e) => this.pointerInteractable.capture(e.owner));
        this.onClick = this.onTouch = (e) => this._select(e);
        this.onDrag = this.onTouchDrag = (e) => this._drag(e);
        this.updateLayout();
    }

    _createBackground() {
        this._defaults['borderRadius'] = Math.min(this.computedHeight,
            this.computedWidth) / 2;
        super._createBackground();
        if(this._scrubberChild?.parent)
            this._scrubberChild.parent.remove(this._scrubberChild);
        if(this._scrubberValue?.parent)
            this._scrubberValue.parent.remove(this._scrubberValue);
        let geometry = new THREE.CircleGeometry(this.computedHeight * 1.5);
        this._scrubberChild = new THREE.Mesh(geometry, this._scrubberMaterial);
        this._scrubberValue = new THREE.Mesh(this._background.geometry,
            this._scrubberMaterial);
        this._background.add(this._scrubberChild);
        this._background.add(this._scrubberValue);
        this._updateScrubber();
    }

    _updateScrubber() {
        this._scrubberChild.position.setX((this._value - 0.5) * this.width);
        this._scrubberValue.scale.setX(this._value);
        this._scrubberValue.position.setX(this.width * (this._value-1)/2);
    }

    _updateMaterialOffset(parentOffset) {
        super._updateMaterialOffset(parentOffset);
        this._scrubberMaterial.polygonOffsetFactor
            = this._scrubberMaterial.polygonOffsetUnits
            = -1 * this._materialOffset - 1;
        if(this._scrubberChild)
            this._scrubberChild.renderOrder = 100 + this._materialOffset + 1;
    }

    _select(e) {
        let { owner, closestPoint } = e;
        this._updateValue(owner, closestPoint);
        if(this._onChange) this._onChange(this._value, false);
    }

    _drag(e) {
        let { owner, closestPoint } = e;
        this._updateValue(owner, closestPoint);
        if(this._onChange) this._onChange(this._value, true);
    }

    _updateValue(owner, closestPoint) {
        if(!this._scrubbingOwner) {
            this._scrubbingOwner = owner;
        } else if(this._scrubbingOwner != owner) {
            return;
        }
        if(closestPoint) {
            closestPoint = VEC3.copy(closestPoint);
        } else {
            PLANE.set(VEC3.set(0, 0, 1), 0);
            PLANE.applyMatrix4(this.matrixWorld);
            closestPoint = owner.raycaster.ray.intersectPlane(PLANE, VEC3);
        }
        if(closestPoint) {
            closestPoint = this.worldToLocal(closestPoint);
            this._value = closestPoint.x / this.width + 0.5;
            this._value = Math.max(0, Math.min(this._value, 1));
            this._updateScrubber();
        }
    }

    get onChange() { return this._onChange; }
    get value() { return this._value; }

    set onChange(onChange) { this._onChange = onChange; }
    set value(value) {
        this._value = Math.max(0, Math.min(value, 1));
        this._updateScrubber();
    }
}

export default Range;
