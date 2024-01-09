/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Style from '/scripts/components/Style.js';
import { capitalizeFirstLetter } from '/scripts/utils.js';
import * as THREE from 'three';

class UIComponent extends THREE.Object3D {
    constructor(...styles) {
        super();
        styles = Array.from(new Set(styles));//Remove duplicates
        this._styles = [];
        this._needsUpdate = {};
        this._overrideStyle = {};
        this._latestValue = {};
        this._defaults = {};
        this._listeners = new Map();
        for(let style of styles) {
            if(!(style instanceof Style)) style = new Style(style);
            this._styles.push(style);
            this._addStyleListenerFor(style);
        }
    }

    addStyle(style) {
        let alreadyUsed = false;
        for(let i = this._styles.length - 1; i >= 0; i--) {
            if(style == this._styles[i]) {
                this._styles.splice(i, 1);
                alreadyUsed = true;
            }
        }
        this._styles.push(style);
        for(let property in Style.PROPERTIES) {
            if(property in style) this._onStyleChange(property);
        }
        if(!alreadyUsed) this._addStyleListenerFor(style);
    }

    _addStyleListenerFor(style) {
        let id = style.addUpdateListener((property) => {
            this._onStyleChange(property);
        });
        this._listeners.set(id, style);
    }

    _onStyleChange(param) {
        this._needsUpdate[param] = true;
        let methodName = '_handleStyleUpdateFor' + capitalizeFirstLetter(param);
        if(methodName in this) this[methodName]();
    }

    removeStyle(style) {
        let removed = false;
        for(let i = this._styles.length - 1; i >= 0; i--) {
            if(style == this._styles[i]) {
                this._styles.splice(i, 1);
                removed = true;
            }
        }
        if(removed) {
            for(let property in Style.PROPERTIES) {
                if(property in style) this._onStyleChange(property);
            }
            let listenerId = this._listeners.get(style);
            if(listenerId) style.removeUpdateListener(listenerId);
            this._listeners.delete(style);
        }
    }

    _genericGet(param) {
        if(param in this._overrideStyle) return this._overrideStyle[param];
        if(!this._needsUpdate[param] && this._latestValue[param] != null)
            return this._latestValue[param];
        for(let i = this._styles.length - 1; i >= 0; i--) {
            let value = this._styles[i][param];
            if(value != null) {
                this._needsUpdate[param] = false;
                this._latestValue[param] = value;
                return value;
            }
        }
        this._needsUpdate[param] = false;
        this._latestValue[param] = this._defaults[param];
        return this._defaults[param];
    }

    _genericSet(param, value) {
        if(value == null) {
            delete this._overrideStyle[param];
        } else {
            this._overrideStyle[param] = value;
        }
        let methodName = '_handleStyleUpdateFor' + capitalizeFirstLetter(param);
        if(methodName in this) this[methodName]();
    }

    get alignItems() { return this._genericGet('alignItems'); }
    get backgroundVisibility() {
        return this._genericGet('backgroundVisibility');
    }
    get borderMaterial() { return this._genericGet('borderMaterial'); }
    get borderRadius() { return this._genericGet('borderRadius'); }
    get borderBottomLeftRadius() {
        return this._genericGet('borderBottomLeftRadius');
    }
    get borderBottomRightRadius() {
        return this._genericGet('borderBottomRightRadius');
    }
    get borderTopLeftRadius() {
        return this._genericGet('borderTopLeftRadius');
    }
    get borderTopRightRadius() {
        return this._genericGet('borderTopRightRadius');
    }
    get borderWidth() { return this._genericGet('borderWidth'); }
    get color() { return this._genericGet('color'); }
    get contentDirection() { return this._genericGet('contentDirection'); }
    get fontSize() { return this._genericGet('fontSize'); }
    get height() { return this._genericGet('height'); }
    get justifyContent() { return this._genericGet('justifyContent'); }
    get material() { return this._genericGet('material'); }
    get materialColor() { return this._genericGet('materialColor'); }
    get width() { return this._genericGet('width'); }

    set alignItems(v) { this._genericSet('alignItems', v); }
    set backgroundVisibility(v) { this._genericSet('backgroundVisibility', v); }
    set borderMaterial(v) { return this._genericSet('borderMaterial', v); }
    set borderRadius(v) { this._genericSet('borderRadius', v); }
    set borderBottomLeftRadius(v) {
        this._genericSet('borderBottomLeftRadius', v);
    }
    set borderBottomRightRadius(v) {
        this._genericSet('borderBottomRightRadius', v);
    }
    set borderTopLeftRadius(v) { this._genericSet('borderTopLeftRadius', v); }
    set borderTopRightRadius(v) { this._genericSet('borderTopRightRadius', v); }
    set borderWidth(v) { return this._genericSet('borderWidth', v); }
    set color(v) { this._genericSet('color', v); }
    set contentDirection(v) { this._genericSet('contentDirection', v); }
    set fontSize(v) { this._genericSet('fontSize', v); }
    set height(v) { this._genericSet('height', v); }
    set justifyContent(v) { this._genericSet('justifyContent', v); }
    set material(v) { return this._genericSet('material', v); }
    set materialColor(v) { return this._genericSet('materialColor', v); }
    set width(v) { this._genericSet('width', v); }
}

export default UIComponent;
