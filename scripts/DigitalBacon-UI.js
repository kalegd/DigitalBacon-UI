/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import GripInteractable from '/scripts/interactables/GripInteractable.js';
import PointerInteractable from '/scripts/interactables/PointerInteractable.js';
import GripInteractableHandler from '/scripts/handlers/GripInteractableHandler.js';
import PointerInteractableHandler from '/scripts/handlers/PointerInteractableHandler.js';
import InputHandler from '/scripts/handlers/InputHandler.js';
import * as TroikaThreeText from '/node_modules/troika-three-text/dist/troika-three-text.esm.js';

const version = '0.0.1';
var deviceType;

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

async function isXR() {
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

const init = async (container, renderer, scene, camera, _deviceType, orbitTarget) => {
    deviceType = _deviceType;
    if(!deviceType) {
        if(await isXR()) {
            deviceType = 'XR';
        } else if(isTouchDevice()) {
            deviceType = 'TOUCH';
        } else {
            deviceType = 'POINTER';
        }
    }
    InputHandler.init(container, renderer, deviceType);
    PointerInteractableHandler.init(deviceType, renderer, scene, camera,
        orbitTarget);
    GripInteractableHandler.init(deviceType, scene);
};

const update = (frame) => {
    if(deviceType == 'XR') {
        InputHandler.update(frame);
        GripInteractableHandler.update();
    }
    PointerInteractableHandler.update();
};

export { GripInteractable };
export { PointerInteractable };
export { GripInteractableHandler };
export { PointerInteractableHandler };
export { InputHandler };
export { TroikaThreeText };
export { addGripInteractable };
export { addPointerInteractable };
export { removeGripInteractable };
export { removePointerInteractable };
export { init };
export { update };
export { version };
