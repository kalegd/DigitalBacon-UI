/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import LayoutComponent from '/scripts/components/LayoutComponent.js';
import PointerInteractable from '/scripts/interactables/PointerInteractable.js';
import PointerInteractableHandler from '/scripts/handlers/PointerInteractableHandler.js';
import * as THREE from 'three';

class InteractableComponent extends LayoutComponent {
    constructor(...styles) {
        super(...styles);
        this.pointerInteractable = new PointerInteractable(this);
        this._clickAction = (owner, closestPoint) => this._onPointerClick(owner,
            closestPoint);
        this._dragAction = (owner, closestPoint) => this._onPointerDrag(owner,
            closestPoint);
        this._pointerInteractableAction = this.pointerInteractable.addAction(
            this._clickAction, this._dragAction);
        this.pointerInteractable.removeAction(this._pointerInteractableAction);
        this.addEventListener('added', () => this._onAdded());
        this.addEventListener('removed', () => this._onAdded());
    }

    updateLayout() {
        super.updateLayout();
        this._updateInteractables();
    }

    _updateInteractables() {
        let active = this._onClick != null || this._onDrag != null;
        let hasAction = this.pointerInteractable.hasAction(
            this._pointerInteractableAction);
        if(this._onDrag) {
            this._pointerInteractableAction.dragAction = this._dragAction;
        } else {
            delete this._pointerInteractableAction.dragAction;
        }
        if(active == hasAction) return;
        if(active) {
            this.pointerInteractable.addAction(this._pointerInteractableAction);
        } else {
            this.pointerInteractable.removeAction(
                this._pointerInteractableAction);
        }
    }

    _onPointerClick(owner, closestPoint) {
        if(this._onClick) {
            this._onClick(owner, closestPoint);
        }
    }

    _onPointerDrag(owner, closestPoint) {
        if(this._onDrag) {
            this._onDrag(owner, closestPoint);
        }
    }

    _onAdded() {
        let p = this.parentComponent;
        if(p instanceof InteractableComponent) {
            p.pointerInteractable.addChild(this.pointerInteractable);
        } else {
            p = this.parent;
            while(p) {
                if(p instanceof THREE.Scene) {
                    PointerInteractableHandler.addInteractable(
                        this.pointerInteractable);
                    return;
                }
                p = p.parent;
            }
            PointerInteractableHandler.removeInteractable(
                this.pointerInteractable);
        }
    }

    _onRemoved() {
        if(this.pointerInteractable.parent) {
            this.pointerInteractable.parent.removeChild(
                this.pointerInteractable);
        } else {
            PointerInteractableHandler.removeInteractable(
                this.pointerInteractable);
        }
    }

    get onClick() { return this._onClick; }
    get onDrag() { return this._onDrag; }

    set onClick(v) { this._onClick = v; this._updateInteractables(); }
    set onDrag(v) { this._onDrag = v; this._updateInteractables(); }
}

export default InteractableComponent;
