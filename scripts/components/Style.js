/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

class Style {
    constructor(style = {}) {
        this._listeners = new Set();
        for(let property of Style.PROPERTIES) {
            if(property in style) this['_' + property] = style[property];
        }
    }

    addUpdateListener(callback) {
        this._listeners.add(callback);
    }

    removeUpdateListener(callback) {
        this._listeners.delete(callback);
    }

    _genericGet(param) {
        return this['_' + param];
    }

    _genericSet(param, value) {
        this['_' + param] = value;
        for(let callback of this._listeners) {
            callback(param);
        }
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

    static PROPERTIES = [
        'alignItems',
        'backgroundVisible',
        'borderMaterial',
        'borderRadius',
        'borderBottomLeftRadius',
        'borderBottomRightRadius',
        'borderTopLeftRadius',
        'borderTopRightRadius',
        'borderWidth',
        'color',
        'contentDirection',
        'font',
        'fontSize',
        'glassmorphism',
        'height',
        'justifyContent',
        'margin',
        'marginBottom',
        'marginLeft',
        'marginRight',
        'marginTop',
        'material',
        'materialColor',
        'maxHeight',
        'maxWidth',
        'minHeight',
        'minWidth',
        'padding',
        'paddingBottom',
        'paddingLeft',
        'paddingRight',
        'paddingTop',
        'pointerInteractableClassOverride',
        'opacity',
        'overflow',
        'textAlign',
        'textureFit',
        'width'
    ];
}

export default Style;
