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
            borderMaterial: this.borderMaterial,
            borderWidth: this.borderWidth,
            overflow: 'scroll',
            width: '100%',
        });
        this._optionsDiv = new Div(this._optionsDivStyle);
        this._optionsStyle = new Style({
            backgroundVisible: this.backgroundVisible,
            width: '90%'
        });
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
        this._text = new Text(' ', this._optionsTextStyle, { maxWidth: '85%' });
        this._text._text.lineHeight = 1 / 0.55;
        this._caret = new Text('⌄');
        this._caret._text.anchorY = '85%';
        this._content.add(this._textSpan);
        this._textSpan.add(this._text);
        this._textSpan.add(this._caret);
        this.onClick = this.onTouch = (owner) => this._select();
        this.updateLayout();
    }

    updateLayout() {
        super.updateLayout();
        if(this._optionsStyle.minHeight != this.computedHeight)
            this._optionsStyle.minHeight = this.computedHeight;
        if(this._optionsTextStyle.fontSize != this.unpaddedHeight * 0.55) {
            this._optionsTextStyle.fontSize = this.unpaddedHeight * 0.55;
            this._caret.fontSize = this.unpaddedHeight * 0.8;
        }
    }

    _select() {
        this.remove(this._textSpan);
        this.add(this._optionsDiv);
        this.onClick = this.onTouch = null;
        this._emptyClickId = PointerInteractableHandler.addEmptyClickListener(
            () => this.hideOptions());
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
            let text = new Text(option, this._optionsTextStyle)
            span.onClick = span.onTouch = () => this._selectOption(text.text);
            span.add(text);
            span.pointerInteractable.setStateCallback((state) => {
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
        this.onClick = this.onTouch = (owner) => this._select();
        if(this._emptyClickId) {
            PointerInteractableHandler.removeEmptyClickListener(
                this._emptyClickId);
            this._emptyClickId = null;
        }
    }

    getMaxDisplayOptions() { return this._maxDisplayOptions; }
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
