/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Div from '/scripts/components/Div.js';
import ScrollableComponent from '/scripts/components/ScrollableComponent.js';
import Span from '/scripts/components/Span.js';
import Style from '/scripts/components/Style.js';
import Text from '/scripts/components/Text.js';
import States from '/scripts/enums/InteractableStates.js';
import PointerInteractableHandler from '/scripts/handlers/PointerInteractableHandler.js';

class Select extends ScrollableComponent {
    constructor(...styles) {
        super(...styles);
        this._defaults['backgroundVisible'] = true;
        this._defaults['borderMaterial'].color.set(0x4f4f4f);
        this._defaults['borderWidth'] = 0.002;
        this._defaults['height'] = 0.1;
        this._defaults['width'] = 0.4;
        this._optionsDivStyle = new Style({
            backgroundVisible: this.backgroundVisible,
            borderMaterial: this.borderMaterial.clone(),
            borderWidth: this.borderWidth,
            overflow: 'scroll',
            paddingBottom: this.borderWidth,
            paddingTop: this.borderWidth,
            width: this.width,
        });
        this._optionsDiv = new Div(this._optionsDivStyle);
        this._optionsDiv._content.position.z *= 3;
        this._optionsStyle = new Style({
            backgroundVisible: this.backgroundVisible,
            width: '90%'
        });
        if(this.pointerInteractableClassOverride)
            this._optionsStyle.pointerInteractableClassOverride =
                this.pointerInteractableClassOverride;
        this._optionsTextStyle = new Style({ maxWidth: '100%' });
        if(this.padding) this._optionsTextStyle.padding = this.padding;
        this._value;
        this._options = [];
        this._textSpan = new Span({
            alignItems: 'start',
            justifyContent: 'spaceBetween',
            height: '100%',
            overflow: 'hidden',
            width: '90%',
        });
        this._text = new Text(' ', this._optionsTextStyle, {
            maxWidth: '85%',
            minWidth: '85%',
        });
        this._text._text.lineHeight = 1 / 0.55;
        this._caret = new Text('⌄');
        this._caret._text.anchorY = '85%';
        this._content.add(this._textSpan);
        this._textSpan.add(this._text);
        this._textSpan.add(this._caret);
        this._downListener = (e) => {
            let object = e.target;
            while(object) {
                if(object == this) return;
                object = object.parent;
            }
            this.hideOptions();
        };
        this.onClick = this.onTouch = () => this._select();
        this.updateLayout();
    }

    updateLayout() {
        super.updateLayout();
        if(this._optionsStyle.minHeight != this.computedHeight)
            this._optionsStyle.minHeight = this.computedHeight;
        if(this._optionsTextStyle.minWidth != this.unpaddedWidth * 0.9)
            this._optionsTextStyle.minWidth = this.unpaddedWidth * 0.9;
        if(this._optionsTextStyle.fontSize != this.unpaddedHeight * 0.55) {
            this._optionsTextStyle.fontSize = this.unpaddedHeight * 0.55;
            this._caret.fontSize = this.unpaddedHeight * 0.8;
        }
    }

    _handleStyleUpdateForWidth() {
        super._handleStyleUpdateForWidth();
        this._optionsDivStyle.width = this.width;
    }

    _select() {
        this.remove(this._textSpan);
        this.add(this._optionsDiv);
        this._optionsDiv._updateMaterialOffset(this._materialOffset + 3);
        this.onClick = this.onTouch = null;
        PointerInteractableHandler.addEventListener('down', this._downListener);
    }

    _selectOption(text) {
        let valueChanged = this._value != text;
        this._value = text;
        this._text.text = text;
        this.hideOptions();
        if(valueChanged && this._onChange) this._onChange(this._value);
    }

    addOptions(...options) {
        for(let option of options) {
            let span = new Span(this._optionsStyle);
            let text = new Text(option, this._optionsTextStyle);
            span.onClick = span.onTouch = () => this._selectOption(text.text);
            span.add(text);
            span.pointerInteractable.addStateCallback((state) => {
                if(state == States.HOVERED) {
                    span.material.color.set(0x0075ff);
                } else if(state == States.IDLE) {
                    span.material.color.set(0xffffff);
                }
            });
            this._optionsDiv.add(span);
        }
    }

    hideOptions() {
        this.remove(this._optionsDiv);
        this.add(this._textSpan);
        this.onClick = this.onTouch = () => this._select();
        PointerInteractableHandler.removeEventListener('down',
            this._downListener);
    }

    get maxDisplayOptions() { return this._maxDisplayOptions; }
    get onChange() { return this._onChange; }
    get value() { return this._value; }

    set maxDisplayOptions(maxDisplayOptions) {
        this._maxDisplayOptions = maxDisplayOptions;
        if(maxDisplayOptions == null) {
            this._optionsDivStyle.maxHeight = null;
        } else {
            this._optionsDivStyle.maxHeight = this._maxDisplayOptions * 100+'%';
        }
    }
    set onChange(onChange) { this._onChange = onChange; }
    set value(value) {
        this._value = value;
        this._text.text = value;
    }
}

export default Select;
