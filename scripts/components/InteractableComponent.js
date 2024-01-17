/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import LayoutComponent from '/scripts/components/LayoutComponent.js';
import PointerInteractable from '/scripts/interactables/PointerInteractable.js';
import TouchInteractable from '/scripts/interactables/TouchInteractable.js';
import PointerInteractableHandler from '/scripts/handlers/PointerInteractableHandler.js';
import TouchInteractableHandler from '/scripts/handlers/TouchInteractableHandler.js';
import * as THREE from 'three';

class InteractableComponent extends LayoutComponent {
    constructor(...styles) {
        super(...styles);
        this.pointerInteractable = new PointerInteractable(this);
        this.touchInteractable = new TouchInteractable(this);
        this._clickAction = (owner, closestPoint) => this._pointerClick(owner,
            closestPoint);
        this._dragAction = (owner, closestPoint) => this._pointerDrag(owner,
            closestPoint);
        this._touchAction = (owner) => this._touch(owner);
        this._touchDragAction = (owner) => this._touchDrag(owner);
        this._pointerInteractableAction = this.pointerInteractable.addAction(
            this._clickAction, this._dragAction);
        this._touchInteractableAction = this.touchInteractable.addAction(
            this._touchAction, this._touchDragAction);
        this.pointerInteractable.removeAction(this._pointerInteractableAction);
        this.touchInteractable.removeAction(this._touchInteractableAction);
        this.addEventListener('added', () => this._onAdded());
        this.addEventListener('removed', () => this._onRemoved());
    }

    _createBackground() {
        super._createBackground();
        this.pointerInteractable.setObject(this._background);
        this.touchInteractable.setObject(this._background);
    }

    updateLayout() {
        super.updateLayout();
        this._updateInteractables();
    }

    _updateInteractables() {
        let clickActive = this._onClick != null || this._onDrag != null;
        let touchActive = this._onTouch != null || this._onTouchDrag != null;
        let hasClickAction = this.pointerInteractable.hasAction(
            this._pointerInteractableAction);
        let hasTouchAction = this.touchInteractable.hasAction(
            this._touchInteractableAction);
        if(this._onDrag) {
            this._pointerInteractableAction.dragAction = this._dragAction;
        } else {
            delete this._pointerInteractableAction.dragAction;
        }
        if(this._onTouchDrag) {
            this._touchInteractableAction.dragAction = this._touchDragAction;
        } else {
            delete this._touchInteractableAction.dragAction;
        }
        if(clickActive != hasClickAction) {
            if(clickActive) {
                this.pointerInteractable.addAction(
                    this._pointerInteractableAction);
            } else {
                this.pointerInteractable.removeAction(
                    this._pointerInteractableAction);
            }
        }
        if(touchActive != hasTouchAction) {
            if(touchActive) {
                this.touchInteractable.addAction(this._touchInteractableAction);
            } else {
                this.touchInteractable.removeAction(
                    this._touchInteractableAction);
            }
        }
    }

    _pointerClick(owner, closestPoint) {
        if(this._onClick) {
            this._onClick(owner, closestPoint);
        }
    }

    _pointerDrag(owner, closestPoint) {
        if(this._onDrag) {
            this._onDrag(owner, closestPoint);
        }
    }

    _touch(owner) {
        if(this._onTouch) {
            this._onTouch(owner);
        }
    }

    _touchDrag(owner) {
        if(this._onTouchDrag) {
            this._onTouchDrag(owner);
        }
    }

    _onAdded() {
        let p = this.parentComponent;
        if(p instanceof InteractableComponent) {
            p.pointerInteractable.addChild(this.pointerInteractable);
            p.touchInteractable.addChild(this.touchInteractable);
        } else {
            p = this.parent;
            while(p) {
                if(p instanceof THREE.Scene) {
                    PointerInteractableHandler.addInteractable(
                        this.pointerInteractable);
                    TouchInteractableHandler.addInteractable(
                        this.touchInteractable);
                    return;
                }
                p = p.parent;
            }
            PointerInteractableHandler.removeInteractable(
                this.pointerInteractable);
            TouchInteractableHandler.removeInteractable(this.touchInteractable);
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
    get onTouch() { return this._onTouch; }
    get onTouchDrag() { return this._onTouchDrag; }

    set onClick(v) { this._onClick = v; this._updateInteractables(); }
    set onDrag(v) { this._onDrag = v; this._updateInteractables(); }
    set onTouch(v) { this._onTouch = v; this._updateInteractables(); }
    set onTouchDrag(v) { this._onTouchDrag = v; this._updateInteractables(); }
}

export default InteractableComponent;
