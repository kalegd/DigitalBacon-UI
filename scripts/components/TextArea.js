/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Div from '/scripts/components/Div.js';
import ScrollableComponent from '/scripts/components/ScrollableComponent.js';
import Style from '/scripts/components/Style.js';
import Text from '/scripts/components/Text.js';
import PointerInteractableHandler from '/scripts/handlers/PointerInteractableHandler.js';
import { getCaretAtPoint } from '/node_modules/troika-three-text/dist/troika-three-text.esm.js';
import * as THREE from 'three';

const VEC3 = new THREE.Vector3();
const ARROW_KEYS = new Set();
const IGNORED_KEYS = new Set();
ARROW_KEYS.add('ArrowLeft');
ARROW_KEYS.add('ArrowRight');
ARROW_KEYS.add('ArrowUp');
ARROW_KEYS.add('ArrowDown');
IGNORED_KEYS.add('Alt');
IGNORED_KEYS.add('Backspace');
IGNORED_KEYS.add('CapsLock');
IGNORED_KEYS.add('Control');
IGNORED_KEYS.add('Enter');
IGNORED_KEYS.add('Escape');
IGNORED_KEYS.add('Meta');
IGNORED_KEYS.add('Shift');
IGNORED_KEYS.add('Tab');

class TextArea extends ScrollableComponent {
    constructor(...styles) {
        super(...styles);
        this._defaults['alignItems'] = 'start';
        this._defaults['backgroundVisible'] = true;
        this._defaults['borderMaterial'].color.set(0x4f4f4f);
        this._defaults['borderWidth'] = 0.002;
        this._defaults['justifyContent'] = 'start';
        this._defaults['fontSize'] = 0.06;
        this._defaults['overflow'] = 'scroll';
        this._defaults['paddingLeft'] = 0.01;
        this._defaults['height'] = 0.1;
        this._defaults['width'] = 0.4;
        this._latestValue['overflow'] = null;
        this._value = '';
        this._textStyle = new Style({
            fontSize: this.fontSize,
            textAlign: 'left',
            maxWidth: 0,
        });
        this._text = new Text('', this._textStyle);
        this._content.add(this._text);
        this.onClick = this.onTouch =
            (owner, closestPoint) => this._select(owner, closestPoint);
        this._keyListener = (event) => { this._handleKey(event.key); };
        this.updateLayout();
        if(this.overflow != 'visible' && !this.clippingPlanes)
            this._createClippingPlanes();
    }

    _handleStyleUpdateForFontSize() {
        this._textStyle.fontSize = this.fontSize;
    }

    _computeUnpaddedAndMarginedDimensions(dimensionName, computed) {
        super._computeUnpaddedAndMarginedDimensions(dimensionName, computed);
        if(dimensionName == 'width'
                && this._textStyle.maxWidth != this.unpaddedWidth) {
            this._textStyle.maxWidth = this.unpaddedWidth;
        }
    }

    _select(owner, closestPoint) {
        if(!closestPoint) return;
        let troikaText = this._text._text;
        troikaText.worldToLocal(VEC3.copy(closestPoint));
        let caret = getCaretAtPoint(troikaText.textRenderInfo, VEC3.x, VEC3.y);
        this._placeCaret(caret.charIndex);
        if(!this._emptyClickId) {
            this._emptyClickId = PointerInteractableHandler
                .addEmptyClickListener(() => this.blur());
            document.addEventListener("keydown", this._keyListener);
        }
    }

    _placeCaret(charIndex) {
        let text = this._text.text;
        if(this._caretActive) {
            text = text.slice(0, this._caretIndex)
                + text.slice(this._caretIndex + 1);
            this._caretIndex = (this._caretIndex < charIndex)
                ? charIndex - 1
                : charIndex;
        } else {
            this._caretActive = true;
            this._caretIndex = charIndex;
        }
        text = text.slice(0, this._caretIndex) + '|'
            + text.slice(this._caretIndex);
        this._text.text = text;
    }

    _handleKey(key) {
        if(key == "Backspace") {
            this._deleteChar();
        } else if(key == "Enter") {
            (this._submitOnEnter) ? this.blur() : this.insertContent('\n');
        } else if(ARROW_KEYS.has(key)) {
            this._moveCaret(key);
        } else if(!IGNORED_KEYS.has(key)) {
            this.insertContent(key);
        }
    }
    
    _moveCaret(key) {
        if(key == 'ArrowLeft') {
            if(this._caretIndex > 0) {
                this._caretIndex--;
                this._setCaret();
            }
        } else if(key == 'ArrowRight') {
            if(this._caretIndex < this._text.text.length - 1) {
                this._caretIndex++;
                this._setCaret();
            }
        } else {
            let sign = (key == 'ArrowUp') ? 1 : -1;
            let index = this._caretIndex * 4;
            let troikaText = this._text._text;
            let caretPositions = troikaText.textRenderInfo.caretPositions;
            let x = caretPositions[index];
            let y = (caretPositions[index + 2] + caretPositions[index + 3]) / 2;
            let height = Math.abs(caretPositions[index + 2]
                - caretPositions[index + 3]);
            let caret = getCaretAtPoint(troikaText.textRenderInfo, x,
                y + (sign * height));
            this._placeCaret(caret.charIndex);
        }
    }

    _setCaret() {
        let text = this._value;
        this._text.text = this._value.slice(0, this._caretIndex) + '|'
            + this._value.slice(this._caretIndex);
    }

    _deleteChar() {
        let text = this._text.text;
        let newCaretIndex = Math.max(0, this._caretIndex - 1);
        text = text.slice(0, newCaretIndex)
            + text.slice(this._caretIndex);
        this._text.text = text;
        this._value = this._value.slice(0, newCaretIndex)
            + this._value.slice(this._caretIndex);
        this._caretIndex = newCaretIndex;
        if(this._onChange) this._onChange(this._value);
    }

    blur() {
        if(this._caretActive) {
            let text = this._text.text;
            text = text.slice(0, this._caretIndex)
                + text.slice(this._caretIndex + 1);
            this._text.text = text;
            this._caretActive = false;
        }
        if(this._emptyClickId) {
            PointerInteractableHandler.removeEmptyClickListener(
                this._emptyClickId);
            this._emptyClickId = null;
            document.removeEventListener("keydown", this._keyListener);
        }
        if(this._onBlur) this._onBlur(this._value);
    }

    insertContent(content) {
        let text = this._text.text;
        text = text.slice(0, this._caretIndex) + content
            + text.slice(this._caretIndex);
        this._text.text = text;
        this._value = this._value.slice(0, this._caretIndex) + content
            + this._value.slice(this._caretIndex);
        this._caretIndex++;
        if(this._onChange) this._onChange(this._value);
    }

    get onBlur() { return this._onBlur; }
    get onChange() { return this._onChange; }
    get value() { return this._value; }

    set onBlur(onBlur) { this._onBlur = onBlur; }
    set onChange(onChange) { this._onChange = onChange; }
    set value(value) {
        this._value = value;
        this._text.text = value;
    }
}

export default TextArea;
