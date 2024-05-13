/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Body from '/scripts/components/Body.js';
import Div from '/scripts/components/Div.js';
import Span from '/scripts/components/Span.js';
import Style from '/scripts/components/Style.js';
import Text from '/scripts/components/Text.js';
import InteractableComponent from '/scripts/components/InteractableComponent.js';
import LayoutComponent from '/scripts/components/LayoutComponent.js';
import DeviceTypes from '/scripts/enums/DeviceTypes.js';
import KeyboardLayouts from '/scripts/enums/KeyboardLayouts.js';
import XRInputDeviceTypes from '/scripts/enums/XRInputDeviceTypes.js';
import InputHandler from '/scripts/handlers/InputHandler.js';
import UpdateHandler from '/scripts/handlers/UpdateHandler.js';
import * as THREE from 'three';

const DEFAULT_KEY_STYLE = new Style({
    backgroundVisible: true,
    borderRadius: 0.01,
    height: 0.1,
    justifyContent: 'center',
    margin: 0.005,
    paddingLeft: 0.02,
    paddingRight: 0.02,
    width: 0.1,
});
const HOVERED_KEY_STYLE = new Style({
    material: new THREE.MeshBasicMaterial({
        color: 0xf0f0f0,
        side: THREE.DoubleSide,
        transparent: true,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
    }),
});
const DEFAULT_FONT_STYLE = {
    fontSize: 0.065,
};
const UNSHIFTED = 'UNSHIFTED';
const SHIFTED = 'SHIFTED';
const CAPS_LOCK = 'CAPS_LOCK';

class Keyboard extends InteractableComponent {
    constructor(...styles) {
        super(...styles);
        this.bypassContentPositioning = true;
        this._defaults['backgroundVisible'] = true;
        this._defaults['materialColor'] = 0xc0c5ce;
        this._layouts = {};
        this._keyboardPageLayouts = [];
        this._timeoutIds = new Map();
        this._updateListeners = new Map();
        this._setupGrabBar();
        this._createOptionsPanel();
        this._addLayout(KeyboardLayouts.ENGLISH);
        this._addLayout(KeyboardLayouts.RUSSIAN);
        this._addLayout(KeyboardLayouts.EMOJIS);
        this._setLayout(KeyboardLayouts.ENGLISH);
        this.types = { NUMBER: 'NUMBER' };
        this.onClick = () => {};
        this.updateLayout();
    }

    _createBackground() {
        this._defaults['borderRadius'] = Math.min(this.computedHeight,
            this.computedHeight) / 20;
        super._createBackground();
    }

    _createOptionsPanel() {
        this._optionsPanelParent = new THREE.Object3D();
        this.add(this._optionsPanelParent);
        this._optionsPanel = new Div({
            backgroundVisible: true,
            borderRadius: 0.06,
            height: 0.12,
            justifyContent: 'center',
            materialColor: 0xc0c5ce,
            width: 0.12,
        });
        let languagesButton = new Div({
            backgroundVisible: true,
            borderRadius: 0.05,
            height: 0.1,
            justifyContent: 'center',
            width: 0.1,
        });
        let languagesText = new Text('🌐', DEFAULT_FONT_STYLE);
        this._optionsPanel.add(languagesButton);
        languagesButton.add(languagesText);
        languagesButton.pointerInteractable.addHoveredCallback((hovered) => {
            if(hovered) {
                languagesButton.addStyle(HOVERED_KEY_STYLE);
            } else {
                languagesButton.removeStyle(HOVERED_KEY_STYLE);
            }
        });
        languagesButton.onClick = languagesButton.onTouch = () => {
            this._setLanguagesPage();
        };
    }

    _addOptionsPanel() {
        this._optionsPanelParent.add(this._optionsPanel);
        this._optionsPanelParent.position.x = this.computedWidth / -2 - 0.1;
    }

    _addLayout(keyboardLayout) {
        this._layouts[keyboardLayout.name] = keyboardLayout;
    }

    _setLayout(keyboardLayout) {
        if(typeof keyboardLayout == 'string') {
            keyboardLayout = this._layouts[keyboardLayout];
            if(!keyboardLayout) return;
        }
        for(let child of this._content.children) {
            if(child instanceof LayoutComponent) this.remove(child);
        }
        this._keyboardLayout = keyboardLayout;
        this._keyboardPageLayouts = [];
        this._keyboardPage = null;
        this._shiftState = UNSHIFTED;
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
            this._addOptionsPanel();
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
                keyDiv.pointerInteractable.addHoveredCallback((hovered) => {
                    if(hovered) {
                        keyDiv.addStyle(HOVERED_KEY_STYLE);
                    } else {
                        keyDiv.removeStyle(HOVERED_KEY_STYLE);
                    }
                });
                if(typeof key != 'string' && key.additionalCharacters) {
                    this._addAdditionalCharacters(keyDiv, key);
                }
                let listener = () => {
                    if(!this._registeredComponent) {
                        return;
                    } else if(typeof key == 'string') {
                        let eventKey = (this._shiftState == UNSHIFTED)
                            ? content
                            : content.toUpperCase();
                        this._registeredComponent.handleKey(eventKey);
                        if(this._shiftState == SHIFTED && eventKey !=content){
                            this._shiftState = UNSHIFTED;
                            this._shiftCase(page, false);
                        }
                    } else {
                        if(key.type == 'key') {
                            let eventKey = (this._shiftState == UNSHIFTED
                                    || key.value.length > 1)
                                ? key.value
                                : key.value.toUpperCase();
                            this._registeredComponent.handleKey(eventKey);
                            if(this._shiftState == SHIFTED
                                    && eventKey != key.value) {
                                this._shiftState = UNSHIFTED;
                                this._shiftCase(page, false);
                            }
                        } else if(key.type == 'page') {
                            if(this._shiftState != UNSHIFTED){
                                this._shiftState = UNSHIFTED;
                                this._shiftCase(page, false);
                            }
                            this._setPage(key.page);
                        } else if(key.type == 'shift') {
                            if(this._shiftState == UNSHIFTED) {
                                this._shiftState = SHIFTED;
                                this._shiftCase(page, true);
                            } else if(this._shiftState == SHIFTED) {
                                this._shiftState = CAPS_LOCK;
                            } else if(this._shiftState == CAPS_LOCK) {
                                this._shiftState = UNSHIFTED;
                                this._shiftCase(page, false);
                            }
                        }
                    }
                };
                keyDiv.pointerInteractable.addEventListener('click', listener);
                keyDiv.touchInteractable.addEventListener('click', listener);
            }
            div.add(span);
        }
        this._keyboardPageLayouts[page] = div;
        this.add(div);
        this._addOptionsPanel();
        this._reposition();
    }

    _addAdditionalCharacters(div, key) {
        div.pointerInteractable.addEventListener('down', (e) => {
            let owner = e.owner;
            if(e.additionalCharactersOwner) return;
            this._timeoutIds.set(owner, setTimeout(() => {
                this._displayAdditionalCharacters(div, key);
                this._timeoutIds.delete(owner);
            }, 500));
            div.additionalCharactersOwner = owner;
            let outCallback = (e2) => {
                if(e2.owner != owner) return;
                if(this._timeoutIds.has(owner)) {
                    clearTimeout(this._timeoutIds.get(owner));
                    this._timeoutIds.delete(owner);
                    UpdateHandler.remove(this._updateListeners.get(owner));
                    delete div.additionalCharactersOwner;
                }
                div.pointerInteractable.removeEventListener('out', outCallback);
            };
            div.pointerInteractable.addEventListener('out', outCallback);
            this._updateListeners.set(owner, () => {
                let isPressed;
                if(DeviceTypes.active == 'XR') {
                    isPressed = this._isXRControllerPressed(owner);
                } else if(DeviceTypes.active == 'POINTER') {
                    isPressed = InputHandler.isPointerPressed();
                } else {
                    isPressed = InputHandler.isScreenTouched();
                }
                if(!isPressed) {
                    if(this._timeoutIds.has(owner)) {
                        clearTimeout(this._timeoutIds.get(owner));
                        this._timeoutIds.delete(owner);
                    }
                    if(div.additionalCharactersSpan)
                        div.remove(div.additionalCharactersSpan);
                    div.pointerInteractable.removeEventListener('out',
                        outCallback);
                    UpdateHandler.remove(this._updateListeners.get(owner));
                    delete div.additionalCharactersOwner;
                }
            });
            UpdateHandler.add(this._updateListeners.get(owner));
        });
    }

    _isXRControllerPressed(owner) {
        let type = owner.object.xrInputDeviceType;
        let handedness = owner.object.handedness;
        if(type == XRInputDeviceTypes.HAND) {
            let model = InputHandler.getXRControllerModel(type, handedness);
            return model?.motionController?.isPinching == true;
        } else {
            let gamepad = InputHandler.getXRGamepad(handedness);
            return gamepad?.buttons != null && gamepad.buttons[0].pressed;
        }
    }

    _displayAdditionalCharacters(div, key) {
        if(div.additionalCharactersSpan) {
            div.additionalCharactersSpan.borderRadius = this.borderRadius;
            div.additionalCharactersSpan._updateMaterialOffset(
                div._materialOffset + 1);
            div.add(div.additionalCharactersSpan);
            return;
        }
        let characters = key.additionalCharacters;
        let span = new Span({
            backgroundVisible: true,
            materialColor: 0xc0c5ce,
        });
        span.bypassContentPositioning = true;
        span.position.y = div.computedHeight;
        for(let content of characters) {
            let keyDiv = new Div(DEFAULT_KEY_STYLE, key.style);

            let text = new Text(content, DEFAULT_FONT_STYLE);
            if(this._shiftState != UNSHIFTED)
                text.text = text.text.toUpperCase();
            keyDiv.add(text);
            span.add(keyDiv);
            keyDiv.pointerInteractable.addEventListener('over', () => {
                keyDiv.addStyle(HOVERED_KEY_STYLE);
            });
            keyDiv.pointerInteractable.addEventListener('out', () => {
                keyDiv.removeStyle(HOVERED_KEY_STYLE);
            });
            keyDiv.pointerInteractable.addEventListener('up', () => {
                let eventKey = (this._shiftState == UNSHIFTED)
                    ? content
                    : content.toUpperCase();
                this._registeredComponent.handleKey(eventKey);
                if(this._shiftState == SHIFTED) {
                    this._shiftState = UNSHIFTED;
                    this._shiftCase(this._keyboardPage, false);
                }
            });
        }
        span.borderRadius = this.borderRadius;
        let padding = div?.parentComponent?.parentComponent?.padding;
        if(padding) {
            span.padding = padding;
            span.position.y += padding;
        }
        span._updateMaterialOffset(div._materialOffset + 1);
        div.additionalCharactersSpan = span;
        div.add(span);
    }

    _setLanguagesPage() {
        for(let child of this._content.children) {
            if(child instanceof LayoutComponent) this.remove(child);
        }
        let span;
        let index = 0;
        let div = new Div({ padding: 0.01 });
        for(let language in this._layouts) {
            if(index % 2 == 0) {
                span = new Span();
                div.add(span);
            }
            index++;
            let keyDiv = new Div(DEFAULT_KEY_STYLE, { width: 0.3 });
            let text = new Text(language, DEFAULT_FONT_STYLE);
            keyDiv.add(text);
            span.add(keyDiv);
            keyDiv.pointerInteractable.addHoveredCallback((hovered) => {
                if(hovered) {
                    keyDiv.addStyle(HOVERED_KEY_STYLE);
                } else {
                    keyDiv.removeStyle(HOVERED_KEY_STYLE);
                }
            });
            keyDiv.onClick = keyDiv.onTouch = () => {
                this._setLayout(language);
            };
        }
        this.add(div);
        this._optionsPanelParent.remove(this._optionsPanel);
        this._reposition();
    }

    _setNumberPage() {
        if(!this._lastKeyboardLayout)
            this._lastKeyboardLayout = this._keyboardLayout;
        this._setLayout(KeyboardLayouts.NUMBERS);
        this._optionsPanelParent.remove(this._optionsPanel);
    }

    _shiftCase(page, toUpperCase) {
        let shiftCaseFunction = (toUpperCase) ? 'toUpperCase' : 'toLowerCase';
        for(let span of this._keyboardPageLayouts[page]._content.children) {
            for(let div of span._content.children) {
                let text = div._content.children[0];
                if(text.text.length == 1) {
                    text.text = text.text[shiftCaseFunction]();
                }
                if(div.additionalCharactersSpan) {
                    let extras = div.additionalCharactersSpan._content.children;
                    for(let div2 of extras) {
                        let text = div2._content.children[0];
                        text.text = text.text[shiftCaseFunction]();
                    }
                }
            }
        }
    }

    _reposition() {
        this._placeGrabBar();
        if(!this._onPopup && this._registeredComponent) {
            let body = getComponentBody(this._registeredComponent);
            if(!body) body = this._registeredComponent;
            if(this.parent != body) return;
            this.position.set(0,
                (-body.computedHeight - this.computedHeight * this.scale.y) / 2
                - 0.025, 0);
        }
    }

    register(component, type) {
        if(this._registeredComponent) this._registeredComponent.blur();
        this._registeredComponent = component;
        let body = getComponentBody(component);
        if(type == this.types.NUMBER) {
            this._setNumberPage();
        }
        this._placeGrabBar();
        if(this._onPopup) {
            this._onPopup(component, body);
        } else {
            if(!body) body = component;
            this.position.set(0,
                (-body.computedHeight - this.computedHeight * this.scale.y) / 2
                - 0.025, 0);
            this.rotation.set(0, 0, 0);
            body.add(this);
            this._updateMaterialOffset(component._materialOffset);
        }
    }

    unregister(component) {
        if(this._registeredComponent == component) {
            this._registeredComponent = null;
            if(this.parent) this.parent.remove(this);
            this._grabBarOwner = this._priorParent = null;
        }
        if(this._lastKeyboardLayout) {
            this._setLayout(this._lastKeyboardLayout);
            this._lastKeyboardLayout = null;
        }
    }

    _placeGrabBar() {
        this._grabBar.position.y = -this.computedHeight / 2 - 0.025;
    }

    _setupGrabBar() {
        this._grabBar = new Body({
            backgroundVisible: false,
            borderRadius: 0.025,
            height: 0.05,
            justifyContent: 'center',
            width: 0.21,
        });
        let div = new Div({
            backgroundVisible: true,
            borderRadius: 0.01,
            height: 0.02,
            materialColor: 0xc0c5ce,
            width: 0.2,
        });
        this._grabBar.pointerInteractable.addHoveredCallback((hovered) => {
            div.material.color.set((hovered) ? 0xffffff : 0xc0c5ce);
        });
        this._grabBar.pointerInteractable.addEventListener('down', (e) => {
            if(!this._grabBarOwner) this._priorParent = this.parent;
            this._grabBarOwner = e.owner;
            e.owner.object.attach(this);
            this._grabBar.pointerInteractable.capture(e.owner);
        });
        this._grabBar.pointerInteractable.addEventListener('click', (e) => {
            if(this.parent != e.owner.object) return;
            this._priorParent.attach(this);
            this._grabBarOwner = this._priorParent = null;
        });
        this._grabBar.add(div);
        this.add(this._grabBar);
    }

    get onPopup() { return this._onPopup; }
    set onPopup(onPopup) { this._onPopup = onPopup; }
}

function getComponentBody(component) {
    while(component && !(component instanceof Body)) {
        component = component.parent;
    }
    return component;

}

let keyboard = new Keyboard();
export default keyboard;
