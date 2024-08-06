/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import TextArea from '/scripts/components/TextArea.js';
import DelayedClickHandler from '/scripts/handlers/DelayedClickHandler.js';
import InputHandler from '/scripts/handlers/InputHandler.js';
import * as THREE from 'three';

const VEC3 = new THREE.Vector3();
const ARROW_KEYS = new Set();
const IGNORED_KEYS = new Set();
ARROW_KEYS.add('ArrowLeft');
ARROW_KEYS.add('ArrowRight');
IGNORED_KEYS.add('ArrowUp');
IGNORED_KEYS.add('ArrowDown');
IGNORED_KEYS.add('Alt');
IGNORED_KEYS.add('Backspace');
IGNORED_KEYS.add('CapsLock');
IGNORED_KEYS.add('Control');
IGNORED_KEYS.add('Enter');
IGNORED_KEYS.add('Escape');
IGNORED_KEYS.add('Meta');
IGNORED_KEYS.add('Shift');
IGNORED_KEYS.add('Tab');

class TextInput extends TextArea {
    constructor(...styles) {
        super(...styles);
        this._defaults['alignItems'] = 'center';
        this._latestValue['alignItems'] = null;
        this._text._overrideStyle.maxWidth = null;
        this._text._text.whiteSpace = 'nowrap';
        this.updateLayout();
    }

    _displayMobileTextArea() {
        if(!this._mobileTextArea) {
            let div = document.createElement('div');
            let input = document.createElement('input');
            input.type = 'text';
            input.style.fontSize = '16px';
            input.style.minWidth = '250px';
            input.style.width = '33%';
            div.style.width = '100%';
            div.style.height = '100%';
            div.style.position = 'fixed';
            div.style.top = '0px';
            div.style.left = '0px';
            div.style.display = 'flex';
            div.style.justifyContent = 'center';
            div.style.alignItems = 'center';
            div.style.backgroundColor = '#00000069';
            div.appendChild(input);
            div.onclick = (e) => {
                if(e.target != div) return;
                this._text.text = input.value;
                this.blur();
            };
            input.onblur = () => {
                this._text.text = input.value;
                this.blur();
            };
            input.addEventListener("compositionend", () => {
                if(this._text.text == input.value) return;
                this._text.text = input.value;
                this._triggerChangeCallback();
            });
            input.onkeyup = (e) => {
                if(e.code == 'Enter') {
                    if(this._onEnter) this._onEnter(this._text.text);
                    return;
                }
                if(this._text.text == input.value) return;
                this._text.text = input.value;
                this._triggerChangeCallback();
            };
            this._mobileTextAreaParent = div;
            this._mobileTextArea = input;
        }
        document.body.appendChild(this._mobileTextAreaParent);
        DelayedClickHandler.trigger(() => this._mobileTextArea.click());
    }

    handleKey(key) {
        if(InputHandler.isKeyPressed("Control")) {
            return;
        } else if(InputHandler.isKeyPressed("Meta")) {
            return;
        } else if(key == "Backspace") {
            this._deleteChar();
        } else if(key == "Enter") {
            if(this._onEnter) this._onEnter(this._text.text);
        } else if(key == "Escape") {
            this.blur();
        } else if(ARROW_KEYS.has(key)) {
            this._moveCaret(key);
        } else if(!IGNORED_KEYS.has(key)) {
            this.insertContent(key);
        }
    }

    _handlePaste(e) {
        if(e.clipboardData.types.indexOf('text/plain') < 0) return;
        let data = e.clipboardData.getData('text/plain');
        this.insertContent(data.replaceAll('\n', ' '));
        e.preventDefault();
    }
    
    _moveCaret(key) {
        if(key == 'ArrowLeft') {
            if(this._caretIndex > 0) {
                this._caretIndex--;
                this._updateCaret();
            }
        } else if(key == 'ArrowRight') {
            if(this._caretIndex < this._value.length) {
                this._caretIndex++;
                this._updateCaret();
            }
        }
        this._checkForCaretScroll();
    }

    _checkForCaretScroll() {
        if(!this._scrollable && this._content.position.x != 0) {
            this._content.position.x = 0;
            return;
        }
        VEC3.copy(this._caretParent.position);
        this._caretParent.parent.localToWorld(VEC3);
        this.worldToLocal(VEC3);
        let bounds = this.computedWidth / 2;
        let caretBounds = this._caret.computedWidth / 2;
        if(VEC3.x + caretBounds > bounds) {
            this._content.position.x += bounds - VEC3.x - caretBounds;
        } else if(VEC3.x - caretBounds < this.computedWidth / -2) {
            this._content.position.x += -bounds - VEC3.x + caretBounds;
        }
    }

    get onEnter() { return this._onEnter; }
    get value() { return super.value; }

    set onEnter(onEnter) { this._onEnter = onEnter; }
    set value(value) {
        if(!value) value = '';
        value = value.replaceAll('\n', ' ');
        super.value = value;
    }
}

export default TextInput;
