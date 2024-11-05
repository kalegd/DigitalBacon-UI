/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Body from '/scripts/components/Body.js';
import Checkbox from '/scripts/components/Checkbox.js';
import Div from '/scripts/components/Div.js';
import HSLColor from '/scripts/components/HSLColor.js';
import Image from '/scripts/components/Image.js';
import Keyboard from '/scripts/components/Keyboard.js';
import NumberInput from '/scripts/components/NumberInput.js';
import Radio from '/scripts/components/Radio.js';
import Range from '/scripts/components/Range.js';
import Select from '/scripts/components/Select.js';
import Span from '/scripts/components/Span.js';
import Style from '/scripts/components/Style.js';
import Text from '/scripts/components/Text.js';
import TextArea from '/scripts/components/TextArea.js';
import TextInput from '/scripts/components/TextInput.js';
import Toggle from '/scripts/components/Toggle.js';
import DeviceTypes from '/scripts/enums/DeviceTypes.js';
import Handedness from '/scripts/enums/Handedness.js';
import InteractableStates from '/scripts/enums/InteractableStates.js';
import XRInputDeviceTypes from '/scripts/enums/XRInputDeviceTypes.js';
import Interactable from '/scripts/interactables/Interactable.js';
import GripInteractable from '/scripts/interactables/GripInteractable.js';
import PointerInteractable from '/scripts/interactables/PointerInteractable.js';
import TouchInteractable from '/scripts/interactables/TouchInteractable.js';
import GripInteractableHandler from '/scripts/handlers/GripInteractableHandler.js';
import PointerInteractableHandler from '/scripts/handlers/PointerInteractableHandler.js';
import TouchInteractableHandler from '/scripts/handlers/TouchInteractableHandler.js';
import DelayedClickHandler from '/scripts/handlers/DelayedClickHandler.js';
import InputHandler from '/scripts/handlers/InputHandler.js';
import InteractionToolHandler from '/scripts/handlers/InteractionToolHandler.js';
import UpdateHandler from '/scripts/handlers/UpdateHandler.js';
import * as utils from '/scripts/utils.js';
import * as TroikaThreeText from '/node_modules/troika-three-text/dist/troika-three-text.esm.js';
import * as ThreeMeshBVH from '/node_modules/three-mesh-bvh/build/index.module.js';
import * as THREE from 'three';
import '/node_modules/nipplejs/dist/nipplejs.js';

const {computeBoundsTree, disposeBoundsTree, acceleratedRaycast} = ThreeMeshBVH;

THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

const version = '0.1.8';

const addGripInteractable = (interactable) => {
    GripInteractableHandler.addInteractable(interactable);
};

const removeGripInteractable = (interactable) => {
    GripInteractableHandler.removeInteractable(interactable);
};

const addPointerInteractable = (interactable) => {
    PointerInteractableHandler.addInteractable(interactable);
};

const removePointerInteractable = (interactable) => {
    PointerInteractableHandler.removeInteractable(interactable);
};

const addTouchInteractable = (interactable) => {
    TouchInteractableHandler.addInteractable(interactable);
};

const removeTouchInteractable = (interactable) => {
    TouchInteractableHandler.removeInteractable(interactable);
};

async function isXR() {
    if(navigator.userAgent) {
        let userAgent = navigator.userAgent.toLowerCase();
        if(userAgent.indexOf('iphone') >= 0 || userAgent.indexOf('ipad') >= 0)
            return false;
    }
    return 'xr' in navigator
        && (await navigator.xr.isSessionSupported('immersive-vr')
            || await navigator.xr.isSessionSupported('immersive-ar'));
}

//https://stackoverflow.com/a/4819886/11626958
function isTouchDevice() {
    return (('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0) ||
        (navigator.msMaxTouchPoints > 0));
}

const init = async (container, renderer, scene, camera, deviceType, orbitTarget) => {
    if(!deviceType) {
        if(await isXR()) {
            deviceType = 'XR';
            if(!renderer.xr.enabled) renderer.xr.enabled = true;
        } else if(isTouchDevice()) {
            deviceType = 'TOUCH_SCREEN';
        } else {
            deviceType = 'POINTER';
        }
    }
    DeviceTypes.active = deviceType;
    renderer.localClippingEnabled = true;
    InputHandler.init(container, renderer);
    PointerInteractableHandler.init(renderer, scene, camera, orbitTarget);
    GripInteractableHandler.init(scene);
    TouchInteractableHandler.init(scene);
    if(deviceType != 'XR') {
        DelayedClickHandler.setup();
    }
};

const update = (frame) => {
    if(DeviceTypes.active == 'XR') {
        InputHandler.update(frame);
        GripInteractableHandler.update();
        TouchInteractableHandler.update();
    }
    PointerInteractableHandler.update();
    UpdateHandler.update();
};

export { Body };
export { Checkbox };
export { Div };
export { HSLColor };
export { Image };
export { Keyboard };
export { NumberInput };
export { Radio };
export { Range };
export { Select };
export { Span };
export { Style };
export { Text };
export { TextArea };
export { TextInput };
export { Toggle };
export { Interactable };
export { GripInteractable };
export { PointerInteractable };
export { TouchInteractable };
export { GripInteractableHandler };
export { PointerInteractableHandler };
export { TouchInteractableHandler };
export { DelayedClickHandler };
export { InputHandler };
export { InteractionToolHandler };
export { UpdateHandler };
export { DeviceTypes };
export { Handedness };
export { InteractableStates };
export { XRInputDeviceTypes };
export { ThreeMeshBVH };
export { TroikaThreeText };
export { addGripInteractable };
export { addPointerInteractable };
export { addTouchInteractable };
export { removeGripInteractable };
export { removePointerInteractable };
export { removeTouchInteractable };
export { init };
export { update };
export { utils };
export { version };
