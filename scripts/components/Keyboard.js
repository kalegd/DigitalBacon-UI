/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { numberOr } from '/scripts/utils.js';
import Body from '/scripts/components/Body.js';
import Div from '/scripts/components/Div.js';
import Span from '/scripts/components/Span.js';
import Text from '/scripts/components/Text.js';
import InteractableComponent from '/scripts/components/InteractableComponent.js';
import LayoutComponent from '/scripts/components/LayoutComponent.js';
import KeyboardLayouts from '/scripts/enums/KeyboardLayouts.js';
import * as THREE from 'three';

const DEFAULT_KEY_STYLE = {
    backgroundVisible: true,
    borderRadius: 0.01,
    height: 0.1,
    margin: 0.005,
    paddingLeft: 0.02,
    paddingRight: 0.02,
    width: 0.1,
};
const DEFAULT_FONT_STYLE = {
    fontSize: 0.065,
};
const SHIFT_STATES = {
    UNSHIFTED: 'UNSHIFTED',
    SHIFTED: 'SHIFTED',
    CAPS_LOCK: 'CAPS_LOCK',
};

class Keyboard extends InteractableComponent {
    constructor(...styles) {
        super(...styles);
        this._defaults['backgroundVisible'] = true;
        this._defaults['materialColor'] = 0xc0c5ce;
        this._keyboardPageLayouts = [];
        this._setLayout(KeyboardLayouts.ENGLISH);
        this.updateLayout();
    }

    _createBackground() {
        this._defaults['borderRadius'] = Math.min(this.computedHeight,
            this.computedHeight) / 20;
        super._createBackground();
    }

    _setLayout(keyboardLayout) {
        for(let child of this._content.children) {
            if(child instanceof LayoutComponent) this.remove(child);
        }
        this._keyboardLayout = keyboardLayout;
        this._keyboardPageLayouts = [];
        this._keyboardPage = null;
        this._shiftState = 'UNSHIFTED';
        this._setPage(0);
    }

    _setPage(page) {
        if(this._keyboardPage == page) return;
        for(let child of this._content.children) {
            if(child instanceof LayoutComponent) this.remove(child);
        }
        this._keyboardPage = page;
        if(this._keyboardPageLayouts[page]) {
            this.add(this._keyboardPageLayouts[page]);
            return;
        }
        let div = new Div(this._keyboardLayout.pages[page].style);
        for(let row of this._keyboardLayout.pages[page].rows) {
            let span = new Span(row.style);
            for(let key of row.keys) {
                let keyDiv = new Div(DEFAULT_KEY_STYLE, key.style);
                let content = key;
                if(typeof key != 'string') content = key.text;
                let text = new Text(content, DEFAULT_FONT_STYLE);
                keyDiv.add(text);
                span.add(keyDiv);
                keyDiv.pointerInteractable.setHoveredCallback((hovered) => {
                    text.position.z = (hovered) ? 0.01 : 0.00000001;
                });
                keyDiv.onClick = () => {
                    if(typeof key == 'string') {
                        let eventKey = (this._shiftState == 'UNSHIFTED')
                            ? content
                            : content.toUpperCase();
                        this._registeredComponent.handleKey(eventKey);
                        if(this._shiftState == 'SHIFTED' && eventKey !=content){
                            this._shiftState = 'UNSHIFTED';
                            this._shiftCase(page, false);
                        }
                    } else {
                        if(key.type == 'key') {
                            let eventKey = (this._shiftState == 'UNSHIFTED')
                                ? key.value
                                : key.value.toUpperCase();
                            this._registeredComponent.handleKey(eventKey);
                            if(this._shiftState == 'SHIFTED'
                                    && eventKey != key.value) {
                                this._shiftState = 'UNSHIFTED';
                                this._shiftCase(page, false);
                            }
                        } else if(key.type == 'page') {
                            if(this._shiftState != 'UNSHIFTED'){
                                this._shiftState = 'UNSHIFTED';
                                this._shiftCase(page, false);
                            }
                            this._setPage(key.page);
                        } else if(key.type == 'shift') {
                            if(this._shiftState == 'UNSHIFTED') {
                                this._shiftState = 'SHIFTED';
                                this._shiftCase(page, true);
                            } else if(this._shiftState == 'SHIFTED') {
                                this._shiftState = 'CAPS_LOCK';
                            } else if(this._shiftState == 'CAPS_LOCK') {
                                this._shiftState = 'UNSHIFTED';
                                this._shiftCase(page, false);
                            }
                        }
                    }
                };
            }
            div.add(span);
        }
        this._keyboardPageLayouts[page] = div;
        this.add(div);
    }

    _shiftCase(page, toUpperCase) {
        let shiftCaseFunction = (toUpperCase) ? 'toUpperCase' : 'toLowerCase';
        for(let span of this._keyboardPageLayouts[page]._content.children) {
            for(let div of span._content.children) {
                let text = div._content.children[0];
                if(text.text.length == 1) {
                    text.text = text.text[shiftCaseFunction]();
                }
            }
        }
    }

    register(component) {
        if(this._registeredComponent) this._registeredComponent.blur();
        this._registeredComponent = component;
        let body = getComponentBody(component);
        if(this._onPopup) {
            this._onPopup(component, body);
        } else {
            if(!body) body = component;
            this.position.set(0, (-body.computedHeight - this.computedHeight) / 2, 0);
            body.add(this);
        }
    }

    unregister(component) {
        if(this._registeredComponent == component) {
            this._registeredComponent = null;
            if(this.parent) this.parent.remove(this);
        }
    }

    get onPopup() { return this._onPopup; }
    set onPopup(onPopup) { this._onPopup = onPopup }
}

function getComponentBody(component) {
    while(component && !(component instanceof Body)) {
        component = component.parent;
    }
    return component;

}

let keyboard = new Keyboard();
export default keyboard;
