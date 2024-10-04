/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Keyboard from '/scripts/components/Keyboard.js';
import TextInput from '/scripts/components/TextInput.js';
import DeviceTypes from '/scripts/enums/DeviceTypes.js';
import DelayedClickHandler from '/scripts/handlers/DelayedClickHandler.js';
import InputHandler from '/scripts/handlers/InputHandler.js';
import PointerInteractableHandler from '/scripts/handlers/PointerInteractableHandler.js';
import * as THREE from 'three';

const VEC3 = new THREE.Vector3();
const ARROW_KEYS = new Set();
const INVALID_NUMBER_KEYS = new Set();
ARROW_KEYS.add('ArrowLeft');
ARROW_KEYS.add('ArrowRight');
INVALID_NUMBER_KEYS.add('e');
INVALID_NUMBER_KEYS.add('E');
INVALID_NUMBER_KEYS.add('+');

class NumberInput extends TextInput {
    constructor(...styles) {
        super(...styles);
        this._defaults['alignItems'] = 'center';
        this._latestValue['alignItems'] = null;
        this._text._overrideStyle.maxWidth = null;
        this._text._text.whiteSpace = 'nowrap';
        this._minValue = -Infinity;
        this._maxValue = Infinity;
        this._lastValidValue = '';
        this.updateLayout();
    }

    _addListeners() {
        this._hasListeners = true;
        if(DeviceTypes.active == 'XR') {
            Keyboard.register(this, Keyboard.types.NUMBER);
            PointerInteractableHandler.addEventListener("down",
                this._downListener);
        } else if(DeviceTypes.active == 'TOUCH_SCREEN') {
            this._displayMobileTextArea();
        } else {
            document.addEventListener("keydown", this._keyListener);
            document.addEventListener("paste", this._pasteListener);
            PointerInteractableHandler.addEventListener("down",
                this._downListener);
        }
        this._text._text.addEventListener('synccomplete',
            this._syncCompleteListener);
        if(this._onFocus) this._onFocus();
    }

    _displayMobileTextArea() {
        if(!this._mobileTextArea) {
            let div = document.createElement('div');
            let input = document.createElement('input');
            input.type = 'text';
            input.inputMode = 'decimal';
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
            input.onkeydown = (e) => {
                if(INVALID_NUMBER_KEYS.has(e.key)
                        || (input.value.includes('.') && e.key == '.')
                        || (!e.key.match(/^[0-9.-]*$/) && e.key != 'Backspace'
                            && e.key != 'Enter'))
                    e.preventDefault();
            };
            input.onkeyup = (e) => {
                if(e.key == 'Enter') {
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
        } else if(key == "±") {
            this._negate();
        } else if(ARROW_KEYS.has(key)) {
            this._moveCaret(key);
        } else if(key.match(/^[0-9.-]*$/)) {
            this.insertContent(key);
        }
    }

    _handlePaste(e) {
        if(e.clipboardData.types.indexOf('text/plain') < 0) return;
        let data = e.clipboardData.getData('text/plain');
        this.insertContent(data);
        e.preventDefault();
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

    _triggerBlurCallback() {
        let value = Number.parseFloat(this._text.text);
        if(isNaN(value)) {
            this.value = this._lastValidValue;
        } else if(typeof this._minValue == 'number' && value < this._minValue) {
            this.value = this._minValue;
        } else if(typeof this._maxValue == 'number' && value > this._maxValue) {
            this.value = this._maxValue;
        }
        this._lastValidValue = this._text.text;
        if(this._onBlur) this._onBlur(this._text.text);
    }

    _triggerChangeCallback() {
        let value = Number.parseFloat(this._text.text);
        if(isNaN(value)
            || (typeof this._minValue == 'number' && value < this._minValue)
            || (typeof this._maxValue == 'number' && value > this._maxValue)) {
            return;
        }
        this._lastValidValue = this._text.text;
        if(this._onChange) this._onChange(this._text.text);
    }

    _sanitizeIncomingText(incoming, existing) {
        let hasDot = false;
        let isNegative = false;
        incoming = incoming.replaceAll(/[^0-9.-]/g, '');
        if(existing) {
            if(existing.indexOf('.') != -1) hasDot = true;
            if(existing.indexOf('-') != -1) isNegative = true;
        }
        if(hasDot) {
            incoming = incoming.replaceAll('.', '');
        } else if(incoming.indexOf('.') != -1) {
            incoming = incoming.split(".")[0] + "." + incoming.split(".")
                .slice(1).join("");
        }
        if(isNegative) {
            incoming = incoming.replaceAll('-', '');
        } else if(incoming.indexOf('-') != -1) {
            incoming = '-' + incoming.replaceAll('-', '');
        }
        return incoming;
    }

    _negate() {
        if(this._text.text.indexOf('-') >= 0) {
            this.value = this._text.text.replaceAll('-', '');
            this._moveCaret('ArrowLeft');
        } else {
            this.value = '-' + this.value;
            this._moveCaret('ArrowRight');
        }
    }

    _sanitizeScientificNotation(number) {
        let numChunks = number.toString().split('e');
        let coefficient = numChunks[0].replaceAll('.', '');
        let zeroCount = Math.abs(numChunks[1]) - 1;
        let zeroes = '0'.repeat(zeroCount);
        let value = '0.' + zeroes + coefficient;
        if(value.indexOf('-') > -1) value = '-' + value.replace('-','');
        return value;
        
    }

    _sanitizeText() {
        if(this._text.text.indexOf('-') > 0) {
            this.value = '-' + this._text.text.replaceAll('-', '');
        }
    }

    insertContent(content) {
        content = this._sanitizeIncomingText(content, this._text.text);
        super.insertContent(content);
    }

    get maxValue() { return this._maxValue; }
    get minValue() { return this._minValue; }
    get onEnter() { return this._onEnter; }
    get value() { return super.value; }

    set maxValue(maxValue) { this._maxValue = maxValue; }
    set minValue(minValue) { this._minValue = minValue; }
    set onEnter(onEnter) { this._onEnter = onEnter; }
    set value(value) {
        if(value == null) value = Math.max(this._minValue, 0);
        if(value == 0) {
            value = '0';
        } else if(Math.abs(value) <= 0.0000001) {
            value = this._sanitizeScientificNotation(value);
        } else {
            value = this._sanitizeIncomingText(String(value));
        }
        super.value = value;
        this._lastValidValue = this._text.text;
    }
}

export default NumberInput;
