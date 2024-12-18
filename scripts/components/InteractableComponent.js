/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import InstancedBackgroundManager from '/scripts/components/InstancedBackgroundManager.js';
import LayoutComponent from '/scripts/components/LayoutComponent.js';
import PointerInteractable from '/scripts/interactables/PointerInteractable.js';
import TouchInteractable from '/scripts/interactables/TouchInteractable.js';
import PointerInteractableHandler from '/scripts/handlers/PointerInteractableHandler.js';
import TouchInteractableHandler from '/scripts/handlers/TouchInteractableHandler.js';
import { capitalizeFirstLetter } from '/scripts/utils.js';
import * as THREE from 'three';

class InteractableComponent extends LayoutComponent {
    constructor(...styles) {
        super(...styles);
        this.pointerInteractable = (this.pointerInteractableClassOverride)
            ? new this.pointerInteractableClassOverride(this)
            : new PointerInteractable(this);
        this.touchInteractable = new TouchInteractable(this);
        this._clickAction = (e) => this._pointerClick(e);
        this._dragAction = (e) => this._pointerDrag(e);
        this._touchAction = (e) => this._touch(e);
        this._touchDragAction = (e) => this._touchDrag(e);
    }

    createBackground() {
        super.createBackground();
        this.pointerInteractable.object = this._background;
        this.touchInteractable.object = this._background;
    }

    _pointerClick(e) {
        if(this._onClick) {
            this._onClick(e);
        }
    }

    _pointerDrag(e) {
        if(this._onDrag) {
            this._onDrag(e);
        }
    }

    _touch(e) {
        if(this._onTouch) {
            this._onTouch(e);
        }
    }

    _touchDrag(e) {
        if(this._onTouchDrag) {
            this._onTouchDrag(e);
        }
    }

    _onAdded() {
        super._onAdded();
        let p = this.parentComponent;
        if(this.parent?.pointerInteractable && this.parent?.touchInteractable) {
            this.parent.pointerInteractable.addChild(this.pointerInteractable);
            this.parent.touchInteractable.addChild(this.touchInteractable);
        } else if(p instanceof InteractableComponent) {
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
        super._onRemoved();
        if(this.pointerInteractable.parent) {
            this.pointerInteractable.parent.removeChild(
                this.pointerInteractable);
        } else {
            PointerInteractableHandler.removeInteractable(
                this.pointerInteractable);
        }
        if(this.touchInteractable.parent) {
            this.touchInteractable.parent.removeChild(
                this.touchInteractable);
        } else {
            TouchInteractableHandler.removeInteractable(
                this.touchInteractable);
        }
    }

    _setCallback(interactable, type, name, newCallback) {
        let callbackName = '_on' + capitalizeFirstLetter(name);
        let localCallbackName = '_' + name + 'Action';
        if(newCallback && !this[callbackName]) {
            interactable.addEventListener(type, this[localCallbackName]);
        } else if(!newCallback && this[callbackName]) {
            interactable.removeEventListener(type, this[localCallbackName]);
        }
        this[callbackName] = newCallback;
    }

    _checkInstancedPointerListenerUpdate(isOnlyGroup) {
        if(isOnlyGroup) {
            InstancedBackgroundManager.checkRemovePointerInteractableListener(
                    this._instancedBackgroundId);
        } else {
            InstancedBackgroundManager.checkAddPointerInteractableListener(
                this._instancedBackgroundId);
        }
    }

    _checkInstancedTouchListenerUpdate(isOnlyGroup) {
        if(isOnlyGroup) {
            InstancedBackgroundManager.checkRemoveTouchInteractableListener(
                    this._instancedBackgroundId);
        } else {
            InstancedBackgroundManager.checkAddTouchInteractableListener(
                this._instancedBackgroundId);
        }
    }

    get onClick() { return this._onClick; }
    get onDrag() { return this._onDrag; }
    get onTouch() { return this._onTouch; }
    get onTouchDrag() { return this._onTouchDrag; }

    set onClick(v) {
        let wasOnlyGroup = this.pointerInteractable.isOnlyGroup();
        this._setCallback(this.pointerInteractable, 'click', 'click', v);
        let isOnlyGroup = this.pointerInteractable.isOnlyGroup();
        if(this._instancedBackgroundId && wasOnlyGroup != isOnlyGroup)
            this._checkInstancedPointerListenerUpdate(isOnlyGroup);
    }

    set onClickAndTouch(v) {
        this.onClick = v;
        this.onTouch = v;
    }

    set onDrag(v) {
        let wasOnlyGroup = this.pointerInteractable.isOnlyGroup();
        this._setCallback(this.pointerInteractable, 'drag', 'drag', v);
        let isOnlyGroup = this.pointerInteractable.isOnlyGroup();
        if(this._instancedBackgroundId && wasOnlyGroup != isOnlyGroup)
            this._checkInstancedPointerListenerUpdate(isOnlyGroup);
    }

    set onTouch(v) {
        let wasOnlyGroup = this.touchInteractable.isOnlyGroup();
        this._setCallback(this.touchInteractable, 'click', 'touch', v);
        let isOnlyGroup = this.touchInteractable.isOnlyGroup();
        if(this._instancedBackgroundId && wasOnlyGroup != isOnlyGroup)
            this._checkInstancedTouchListenerUpdate(isOnlyGroup);
    }

    set onTouchDrag(v) {
        let wasOnlyGroup = this.touchInteractable.isOnlyGroup();
        this._setCallback(this.touchInteractable, 'drag', 'touchDrag', v);
        let isOnlyGroup = this.touchInteractable.isOnlyGroup();
        if(this._instancedBackgroundId && wasOnlyGroup != isOnlyGroup)
            this._checkInstancedTouchListenerUpdate(isOnlyGroup);
    }
}

export default InteractableComponent;
