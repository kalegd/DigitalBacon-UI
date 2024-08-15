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
        this.onClick = (e) => this._select(e);
        this.onTouch = (e) => this._touchSelect(e);
        this.onDrag = (e) => this._drag(e);
        this.onTouchDrag = (e) => this._touchDrag(e);
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
            this._scrubberChild.renderOrder = this._materialOffset + 1;
    }

    _select(e) {
        let { owner, point } = e;
        if(this._scrubbingOwner == owner) {
            this._updateValue(owner, point);
            this._scrubbingOwner = null;
            if(this._onBlur) this._onBlur(this._value);
        }
    }

    _touchSelect(e) {
        if(this._scrubbingOwner == e.owner) {
            this._scrubbingOwner = null;
            if(this._onBlur) this._onBlur(this._value);
        }
    }

    _drag(e) {
        let { owner, point } = e;
        let changed = this._updateValue(owner, point);
        if(changed && this._onChange) this._onChange(this._value);
    }

    _touchDrag(e) {
        let owner = e.owner;
        let changed = this._updateValueFromTouch(owner);
        if(changed && this._onChange) this._onChange(this._value);
    }

    _updateValue(owner, point) {
        if(!this._scrubbingOwner) {
            this._scrubbingOwner = owner;
        } else if(this._scrubbingOwner != owner) {
            return false;
        }
        if(point) {
            point = VEC3.copy(point);
        } else {
            PLANE.set(VEC3.set(0, 0, 1), 0);
            PLANE.applyMatrix4(this.matrixWorld);
            point = owner.raycaster.ray.intersectPlane(PLANE, VEC3);
        }
        if(point) {
            point = this.worldToLocal(point);
            let newValue = point.x / this.width + 0.5;
            newValue = Math.max(0, Math.min(newValue, 1));
            let changed = this._value != newValue;
            this._value = newValue;
            if(changed) this._updateScrubber();
            return changed;
        }
        return false;
    }

    _updateValueFromTouch(owner) {
        if(!this._scrubbingOwner) {
            this._scrubbingOwner = owner;
            let details = this.touchInteractable.getClosestPointTo(
                owner.object);
            this._touchController = details[1].object;
            this._scrollVertex = this._touchController.bvhGeometry.index.array[
                details[1].faceIndex * 3];
        } else if(this._scrubbingOwner != owner) {
            return false;
        }
        let positionAttribute = this._touchController.bvhGeometry
            .getAttribute('position');
        VEC3.fromBufferAttribute(positionAttribute, this._scrollVertex);
        this._touchController.localToWorld(VEC3);
        this.worldToLocal(VEC3);
        let newValue = VEC3.x / this.width + 0.5;
        newValue = Math.max(0, Math.min(newValue, 1));
        let changed = this._value != newValue;
        this._value = newValue;
        if(changed) this._updateScrubber();
        return changed;
    }

    get onBlur() { return this._onBlur; }
    get onChange() { return this._onChange; }
    get value() { return this._value; }

    set onBlur(onBlur) { this._onBlur = onBlur; }
    set onChange(onChange) { this._onChange = onChange; }
    set value(value) {
        this._value = Math.max(0, Math.min(value, 1));
        this._updateScrubber();
    }
}

export default Range;
