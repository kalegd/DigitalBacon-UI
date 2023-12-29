/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { uuidv4 } from '/scripts/utils.js';

class Style {
    constructor(style = {}) {
        this._listeners = {};
        for(let property of Style.PROPERTIES) {
            if(property in style) this['_' + property] = style[property];
        }
    }

    addUpdateListener(callback) {
        let id = uuidv4();
        this._listeners[id] = callback;
        return id;
    }

    removeUpdateListener(id) {
        delete this._lisreners[id];
    }

    _genericGet(param, value) {
        return this['_' + param];
    }

    _genericSet(param, value) {
        this['_' + param] = value;
        for(let id in this._listeners) {
            this._listeners[id](param);
        }
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
    get height() { return this._genericGet('height'); }
    get material() { return this._genericGet('material'); }
    get width() { return this._genericGet('width'); }

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
    set height(v) { this._genericSet('height', v); }
    set material(v) { this._genericSet('material', v); }
    set width(v) { this._genericSet('width', v); }

    static PROPERTIES = [
        'borderMaterial',
        'borderRadius',
        'borderBottomLeftRadius',
        'borderBottomRightRadius',
        'borderTopLeftRadius',
        'borderTopRightRadius',
        'borderWidth',
        'height',
        'material',
        'width'
    ];
}

export default Style;
