/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Keyboard from '/scripts/components/Keyboard.js';
import ScrollableComponent from '/scripts/components/ScrollableComponent.js';
import Style from '/scripts/components/Style.js';
import Text from '/scripts/components/Text.js';
import DeviceTypes from '/scripts/enums/DeviceTypes.js';
import DelayedClickHandler from '/scripts/handlers/DelayedClickHandler.js';
import InputHandler from '/scripts/handlers/InputHandler.js';
import PointerInteractableHandler from '/scripts/handlers/PointerInteractableHandler.js';
import { getCaretAtPoint } from '/node_modules/troika-three-text/dist/troika-three-text.esm.js';
import { runes } from '/node_modules/runes2/dist/index.esm.mjs';
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
        this._defaults['color'] = 0x000000;
        this._defaults['contentDirection'] = 'row';
        this._defaults['justifyContent'] = 'start';
        this._defaults['fontSize'] = 0.06;
        this._defaults['overflow'] = 'scroll';
        this._defaults['paddingLeft'] = 0.01;
        this._defaults['height'] = 0.1;
        this._defaults['width'] = 0.4;
        this._latestValue['overflow'] = null;
        this._value = [];
        this._runeLengths = [];
        this._textStyle = new Style({
            color: this.color,
            fontSize: this.fontSize,
            textAlign: 'left',
            maxWidth: 0,
            minHeight: 0,
        });
        this._text = new Text('', this._textStyle);
        this._placeholder = new Text('', this._textStyle, { color: 0x808080 });
        this._placeholder.troikaText.material.opacity = 0.75;
        this._content.add(this._text);
        this._content.add(this._placeholder);
        this._createCaret();
        this.onClick = (e) => this._select(e);
        this.onTouch = (e) => this._selectTouch(e);
        this._keyListener = (event) => this.handleKey(event.key);
        this._pasteListener = (event) => this._handlePaste(event);
        this._downListener = (e) => {
            let object = e.target;
            while(object) {
                if(object == Keyboard || object == this) return;
                object = object.parent;
            }
            this.blur();
        };
        this._syncCompleteListener = () => {
            this._updateCaret();
            this._checkForCaretScroll();
        };
        this.updateLayout();
        if(this.overflow != 'visible' && !this.clippingPlanes)
            this._createClippingPlanes();
    }

    _handleStyleUpdateForColor() {
        this._textStyle.color = this.color;
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

    _updateMaterialOffset(parentOffset) {
        super._updateMaterialOffset(parentOffset);
        this._caret._updateMaterialOffset(this._materialOffset + 1);
    }

    _selectTouch(e) {
        let details = this.touchInteractable.getClosestPointTo(e.owner.object);
        let object = details[1].object;
        let vertex = object.bvhGeometry.index.array[details[1].faceIndex * 3];
        let positionAttribute = object.bvhGeometry.getAttribute('position');
        VEC3.fromBufferAttribute(positionAttribute, vertex);
        object.localToWorld(VEC3);
        this._select({ point: VEC3 });
    }

    _select(e) {
        let { point } = e;
        if(!point) return;
        if(this._textStyle.minHeight != this._caret.computedHeight)
            this._textStyle.minHeight = this._caret.computedHeight;
        this._text._content.add(this._caretParent);
        let troikaText = this._text._text;
        troikaText.worldToLocal(VEC3.copy(point));
        let caret = getCaretAtPoint(troikaText.textRenderInfo, VEC3.x, VEC3.y);
        this._setCaretIndexFromCharIndex(caret.charIndex);
        this._updateCaret();
        if(!this._hasListeners) this._addListeners();
    }

    _addListeners() {
        this._hasListeners = true;
        if(DeviceTypes.active == 'XR') {
            Keyboard.register(this);
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

    _removeListeners() {
        this._hasListeners = false;
        if(DeviceTypes.active == 'XR') {
            Keyboard.unregister(this);
            PointerInteractableHandler.removeEventListener("down",
                this._downListener);
        } else if(DeviceTypes.active == 'TOUCH_SCREEN') {
            document.body.removeChild(this._mobileTextAreaParent);
        } else {
            document.removeEventListener("keydown", this._keyListener);
            document.removeEventListener("paste", this._pasteListener);
            PointerInteractableHandler.removeEventListener("down",
                this._downListener);
        }
        this._text._text.removeEventListener('synccomplete',
            this._syncCompleteListener);
        this._text._content.remove(this._caretParent);
        this._triggerBlurCallback();
    }

    _triggerBlurCallback() {
        if(this._onBlur) this._onBlur(this._text.text);
    }

    _triggerChangeCallback() {
        if(this._onChange) this._onChange(this._text.text);
    }

    _displayMobileTextArea() {
        if(!this._mobileTextArea) {
            let div = document.createElement('div');
            let textArea = document.createElement('textarea');
            textArea.rows = 5;
            textArea.style.fontSize = '16px';
            textArea.style.minWidth = '250px';
            textArea.style.width = '33%';
            div.style.width = '100%';
            div.style.height = '100%';
            div.style.position = 'fixed';
            div.style.top = '0px';
            div.style.left = '0px';
            div.style.display = 'flex';
            div.style.justifyContent = 'center';
            div.style.alignItems = 'center';
            div.style.backgroundColor = '#00000069';
            div.appendChild(textArea);
            div.onclick = (e) => {
                if(e.target != div) return;
                this._text.text = textArea.value;
                this.blur();
            };
            textArea.onblur = () => {
                this._text.text = textArea.value;
                this.blur();
            };
            textArea.addEventListener("compositionend", () => {
                if(this._text.text == textArea.value) return;
                this._text.text = textArea.value;
                this._triggerChangeCallback();
            });
            textArea.onkeyup = () => {
                if(this._text.text == textArea.value) return;
                this._text.text = textArea.value;
                this._triggerChangeCallback();
            };
            this._mobileTextAreaParent = div;
            this._mobileTextArea = textArea;
        }
        document.body.appendChild(this._mobileTextAreaParent);
        DelayedClickHandler.trigger(() => this._mobileTextArea.click());
    }

    _createCaret() {
        this._caretParent = new THREE.Object3D();
        this._caret = new Text('|', this._textStyle);
        this._caret._text.fillOpacity = 0.75;
        this._caretParent.add(this._caret);
    }

    _getCharIndex(caretIndex = this._caretIndex) {
        let charIndex = 0;
        for(let i = 0; i < caretIndex; i++) {
            charIndex += this._runeLengths[i];
        }
        return charIndex;
    }

    _setCaretIndexFromCharIndex(charIndex = 0) {
        let i;
        let currentCharIndex = 0;
        let previousCharIndex = 0;
        for(i = 0; i < this._runeLengths.length
                && currentCharIndex < charIndex; i++) {
            previousCharIndex = currentCharIndex;
            currentCharIndex += this._runeLengths[i];
        }
        let currentDiff = Math.abs(charIndex - currentCharIndex);
        let previousDiff = Math.abs(charIndex - previousCharIndex);
        if(currentCharIndex == charIndex || currentDiff < previousDiff) {
            this._caretIndex = i;
        } else {
            this._caretIndex = i - 1;
        }
    }

    _updateCaret() {
        let charIndex = this._getCharIndex();
        let index = charIndex * 4;
        let xIndexOffset = 0;
        if(charIndex == this._text.text.length) {
            if(charIndex == 0) {
                this._caretParent.position.set(0, 0, 0);
                return;
            } else {
                index -= 4;
                xIndexOffset = 1;
            }
        }
        let troikaText = this._text._text;
        let caretPositions = troikaText.textRenderInfo.caretPositions;
        let x = caretPositions[index + xIndexOffset];
        let y = (caretPositions[index + 2] + caretPositions[index + 3]) / 2;
        if(!isNaN(y)) this._caretParent.position.set(x, y, 0);
    }

    handleKey(key) {
        if(InputHandler.isKeyPressed("Control")) {
            return;
        } else if(InputHandler.isKeyPressed("Meta")) {
            return;
        } else if(key == "Backspace") {
            this._deleteChar();
        } else if(key == "Enter") {
            this.insertContent('\n');
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
        this.insertContent(data);
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
        } else {
            let charIndex = this._getCharIndex();
            let text = this._text.text;
            let sign = (key == 'ArrowUp') ? 1 : -1;
            let index = charIndex * 4;
            let xIndexOffset = 0;
            if(this._caretIndex == text.length && this._caretIndex != 0) {
                index -= 4;
                xIndexOffset = 1;
            }
            let troikaText = this._text._text;
            let caretPositions = troikaText.textRenderInfo.caretPositions;
            let x = caretPositions[index + xIndexOffset];
            let y = (caretPositions[index + 2] + caretPositions[index + 3]) / 2;
            let height = Math.abs(caretPositions[index + 2]
                - caretPositions[index + 3]);
            let caret = getCaretAtPoint(troikaText.textRenderInfo, x,
                y + (sign * height));
            this._setCaretIndexFromCharIndex(caret.charIndex);
            this._updateCaret();
        }
        this._checkForCaretScroll();
    }

    _deleteChar() {
        if(this._caretIndex == 0) return;
        this._value.splice(this._caretIndex - 1, 1);
        this._runeLengths.splice(this._caretIndex - 1, 1);
        this._text.text = this._value.join('');
        this._caretIndex--;
        this._updateCaret();
        if(this._value.length == 0 && !this._placeholder.parentComponent)
            this._content.add(this._placeholder);
        this._triggerChangeCallback();
    }

    _checkForCaretScroll() {
        if(!this._scrollable && this._content.position.y != 0) {
            this._content.position.y = 0;
            return;
        }
        VEC3.copy(this._caretParent.position);
        this._caretParent.parent.localToWorld(VEC3);
        this.worldToLocal(VEC3);
        let bounds = this.computedHeight / 2;
        let caretBounds = this._caret.computedHeight / 2;
        if(VEC3.y + caretBounds > bounds) {
            this._content.position.y += bounds - VEC3.y - caretBounds;
        } else if(VEC3.y - caretBounds < this.computedHeight / -2) {
            this._content.position.y += -bounds - VEC3.y + caretBounds;
        }
    }

    _sanitizeText() {}

    blur() {
        if(this._hasListeners) this._removeListeners();
    }

    insertContent(content) {
        let newRunes = runes(content);
        this._value.splice(this._caretIndex, 0, ...newRunes);
        this._text.text = this._value.join('');
        for(let i = 0; i < newRunes.length; i++) {
            this._runeLengths.splice(this._caretIndex, 0, newRunes[i].length);
            this._caretIndex++;
        }
        this._sanitizeText();
        if(this._placeholder.parentComponent)
            this._content.remove(this._placeholder);
        this._triggerChangeCallback();
    }

    get onBlur() { return this._onBlur; }
    get onChange() { return this._onChange; }
    get onFocus() { return this._onFocus; }
    get placeholder() { return this._placeholder.text; }
    get value() { return this._text.text; }

    set onBlur(onBlur) { this._onBlur = onBlur; }
    set onChange(onChange) { this._onChange = onChange; }
    set onFocus(onFocus) { this._onFocus = onFocus; }
    set placeholder(placeholder) { this._placeholder.text = placeholder; }
    set value(value) {
        if(!value) value = '';
        this._value = runes(value);
        this._text.text = value;
        this._runeLengths = [];
        for(let i = 0; i < this._value.length; i++) {
            this._runeLengths.push(this._value[i].length);
        }
        if(this._value.length == 0) {
            if(!this._placeholder.parentComponent)
                this._content.add(this._placeholder);
        } else if(this._placeholder.parentComponent) {
            this._content.remove(this._placeholder);
        }
    }
}

export default TextArea;
