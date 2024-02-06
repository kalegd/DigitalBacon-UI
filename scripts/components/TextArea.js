/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Div from '/scripts/components/Div.js';
import Keyboard from '/scripts/components/Keyboard.js';
import ScrollableComponent from '/scripts/components/ScrollableComponent.js';
import Style from '/scripts/components/Style.js';
import Text from '/scripts/components/Text.js';
import DeviceTypes from '/scripts/enums/DeviceTypes.js';
import InputHandler from '/scripts/handlers/InputHandler.js';
import PointerInteractableHandler from '/scripts/handlers/PointerInteractableHandler.js';
import { getCaretAtPoint, Text as TroikaText } from '/node_modules/troika-three-text/dist/troika-three-text.esm.js';
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
            minHeight: 0,
        });
        this._text = new Text('', this._textStyle);
        this._content.add(this._text);
        this._createCaret();
        this.onClick = this.onTouch =
            (owner, closestPoint) => this._select(owner, closestPoint);
        this._keyListener = (event) => this.handleKey(event.key);
        this._pasteListener = (event) => this._handlePaste(event);
        this._syncCompleteListener = () => {
            this._updateCaret();
            this._checkForCaretScroll();
        }
        this.updateLayout();
        if(this.overflow != 'visible' && !this.clippingPlanes)
            this._createClippingPlanes();
    }

    _createCaret() {
        this._caretParent = new THREE.Object3D();
        this._caret = new Text('|', this._textStyle);
        this._caret._text.fillOpacity = 0.75;
        this._caretParent.add(this._caret);
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

    _select(owner, closestPoint) {
        if(!closestPoint) return;
        if(this._textStyle.minHeight != this._caret.computedHeight)
            this._textStyle.minHeight = this._caret.computedHeight;
        this._text._content.add(this._caretParent);
        let troikaText = this._text._text;
        troikaText.worldToLocal(VEC3.copy(closestPoint));
        let caret = getCaretAtPoint(troikaText.textRenderInfo, VEC3.x, VEC3.y);
        this._caretIndex = caret.charIndex || 0;
        this._updateCaret();
        if(!this._emptyClickId) this._addListeners();
    }

    _addListeners() {
        this._emptyClickId = PointerInteractableHandler
            .addEmptyClickListener(() => this.blur());
        if(DeviceTypes.active == 'POINTER') {
            Keyboard.register(this);
        } else if(DeviceTypes.active == 'TOUCH_SCREEN') {

        } else {
            document.addEventListener("keydown", this._keyListener);
            document.addEventListener("paste", this._pasteListener);
        }
        this._text._text.addEventListener('synccomplete',
            this._syncCompleteListener);
        if(this._onFocus) this._onFocus();
    }

    _removeListeners() {
        PointerInteractableHandler.removeEmptyClickListener(
            this._emptyClickId);
        this._emptyClickId = null;
        if(DeviceTypes.active == 'POINTER') {
            Keyboard.unregister(this);
        } else if(DeviceTypes.active == 'TOUCH_SCREEN') {

        } else {
            document.removeEventListener("keydown", this._keyListener);
            document.removeEventListener("paste", this._pasteListener);
        }
        this._text._text.removeEventListener('synccomplete',
            this._syncCompleteListener);
        this._text._content.remove(this._caretParent);
        if(this._onBlur) this._onBlur(this._value);
    }

    _updateCaret() {
        let index = this._caretIndex * 4;
        let xIndexOffset = 0;
        if(this._caretIndex == this._text.text.length) {
            if(this._caretIndex == 0) {
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
            (this._submitOnEnter) ? this.blur() : this.insertContent('\n');
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
            if(this._caretIndex < this._text.text.length) {
                this._caretIndex++;
                this._updateCaret();
            }
        } else {
            let text = this._text.text;
            let sign = (key == 'ArrowUp') ? 1 : -1;
            let index = this._caretIndex * 4;
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
            this._caretIndex = caret.charIndex;
            this._updateCaret();
        }
        this._checkForCaretScroll();
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

    _checkForCaretScroll(isSync) {
        if(!this._pointerInteractableAction.dragAction
                && this._content.position.y != 0) {
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

    blur() {
        if(this._emptyClickId) this._removeListeners();
    }

    insertContent(content) {
        let text = this._text.text;
        text = text.slice(0, this._caretIndex) + content
            + text.slice(this._caretIndex);
        this._text.text = text;
        this._value = this._value.slice(0, this._caretIndex) + content
            + this._value.slice(this._caretIndex);
        this._caretIndex += content.length;
        if(this._onChange) this._onChange(this._value);
    }

    get onBlur() { return this._onBlur; }
    get onChange() { return this._onChange; }
    get onFocus() { return this._onFocus; }
    get value() { return this._value; }

    set onBlur(onBlur) { this._onBlur = onBlur; }
    set onChange(onChange) { this._onChange = onChange; }
    set onFocus(onFocus) { this._onFocus = onFocus; }
    set value(value) {
        this._value = value;
        this._text.text = value;
    }
}

export default TextArea;
