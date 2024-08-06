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
        this._styleListener = (property) => this._onStyleChange(property);
        for(let style of styles) {
            if(!style) continue;
            if(!(style instanceof Style)) style = new Style(style);
            this._styles.push(style);
            style.addUpdateListener(this._styleListener);
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
        for(let property of Style.PROPERTIES) {
            if(style[property] != null) this._onStyleChange(property);
        }
        if(!alreadyUsed) style.addUpdateListener(this._styleListener);
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
            for(let property of Style.PROPERTIES) {
                if(style[property] != null) this._onStyleChange(property);
            }
            style.removeUpdateListener(this._styleListener);
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
    get backgroundVisible() {
        return this._genericGet('backgroundVisible');
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
    get font() { return this._genericGet('font'); }
    get fontSize() { return this._genericGet('fontSize'); }
    get glassmorphism() { return this._genericGet('glassmorphism'); }
    get height() { return this._genericGet('height'); }
    get justifyContent() { return this._genericGet('justifyContent'); }
    get margin() { return this._genericGet('margin'); }
    get marginBottom() { return this._genericGet('marginBottom'); }
    get marginLeft() { return this._genericGet('marginLeft'); }
    get marginRight() { return this._genericGet('marginRight'); }
    get marginTop() { return this._genericGet('marginTop'); }
    get material() { return this._genericGet('material'); }
    get materialColor() { return this._genericGet('materialColor'); }
    get maxHeight() { return this._genericGet('maxHeight'); }
    get maxWidth() { return this._genericGet('maxWidth'); }
    get minHeight() { return this._genericGet('minHeight'); }
    get minWidth() { return this._genericGet('minWidth'); }
    get opacity() { return this._genericGet('opacity'); }
    get overflow() { return this._genericGet('overflow'); }
    get padding() { return this._genericGet('padding'); }
    get paddingBottom() { return this._genericGet('paddingBottom'); }
    get paddingLeft() { return this._genericGet('paddingLeft'); }
    get paddingRight() { return this._genericGet('paddingRight'); }
    get paddingTop() { return this._genericGet('paddingTop'); }
    get pointerInteractableClassOverride() {
        return this._genericGet('pointerInteractableClassOverride');
    }
    get textAlign() { return this._genericGet('textAlign'); }
    get textureFit() { return this._genericGet('textureFit'); }
    get width() { return this._genericGet('width'); }

    set alignItems(v) { this._genericSet('alignItems', v); }
    set backgroundVisible(v) { this._genericSet('backgroundVisible', v); }
    set borderMaterial(v) { this._genericSet('borderMaterial', v); }
    set borderRadius(v) { this._genericSet('borderRadius', v); }
    set borderBottomLeftRadius(v) {
        this._genericSet('borderBottomLeftRadius', v);
    }
    set borderBottomRightRadius(v) {
        this._genericSet('borderBottomRightRadius', v);
    }
    set borderTopLeftRadius(v) { this._genericSet('borderTopLeftRadius', v); }
    set borderTopRightRadius(v) { this._genericSet('borderTopRightRadius', v); }
    set borderWidth(v) { this._genericSet('borderWidth', v); }
    set color(v) { this._genericSet('color', v); }
    set contentDirection(v) { this._genericSet('contentDirection', v); }
    set font(v) { this._genericSet('font', v); }
    set fontSize(v) { this._genericSet('fontSize', v); }
    set glassmorphism(v) { this._genericSet('glassmorphism', v); }
    set height(v) { this._genericSet('height', v); }
    set justifyContent(v) { this._genericSet('justifyContent', v); }
    set margin(v) { this._genericSet('margin', v); }
    set marginBottom(v) { this._genericSet('marginBottom', v); }
    set marginLeft(v) { this._genericSet('marginLeft', v); }
    set marginRight(v) { this._genericSet('marginRight', v); }
    set marginTop(v) { this._genericSet('marginTop', v); }
    set material(v) { this._genericSet('material', v); }
    set materialColor(v) { this._genericSet('materialColor', v); }
    set maxHeight(v) { this._genericSet('maxHeight', v); }
    set maxWidth(v) { this._genericSet('maxWidth', v); }
    set minHeight(v) { this._genericSet('minHeight', v); }
    set minWidth(v) { this._genericSet('minWidth', v); }
    set opacity(v) { this._genericSet('opacity', v); }
    set overflow(v) { this._genericSet('overflow', v); }
    set padding(v) { this._genericSet('padding', v); }
    set paddingBottom(v) { this._genericSet('paddingBottom', v); }
    set paddingLeft(v) { this._genericSet('paddingLeft', v); }
    set paddingRight(v) { this._genericSet('paddingRight', v); }
    set paddingTop(v) { this._genericSet('paddingTop', v); }
    set pointerInteractableClassOverride(v) {
        this._genericSet('pointerInteractableClassOverride', v);
    }
    set textAlign(v) { this._genericSet('textAlign', v); }
    set textureFit(v) { this._genericSet('textureFit', v); }
    set width(v) { this._genericSet('width', v); }
}

export default UIComponent;
