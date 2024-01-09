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
import GripInteractable from '/scripts/interactables/GripInteractable.js';
import PointerInteractable from '/scripts/interactables/PointerInteractable.js';
import TouchInteractable from '/scripts/interactables/TouchInteractable.js';
import GripInteractableHandler from '/scripts/handlers/GripInteractableHandler.js';
import PointerInteractableHandler from '/scripts/handlers/PointerInteractableHandler.js';
import TouchInteractableHandler from '/scripts/handlers/TouchInteractableHandler.js';
import InputHandler from '/scripts/handlers/InputHandler.js';
import UpdateHandler from '/scripts/handlers/UpdateHandler.js';
import * as utils from '/scripts/utils.js';
import * as TroikaThreeText from '/node_modules/troika-three-text/dist/troika-three-text.esm.js';
import * as ThreeMeshBVH from '/node_modules/three-mesh-bvh/build/index.module.js';
import * as THREE from 'three';

const {computeBoundsTree, disposeBoundsTree, acceleratedRaycast} = ThreeMeshBVH;

THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

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

const addTouchInteractable = (interactable) => {
    TouchInteractableHandler.addInteractable(interactable);
};

const removeTouchInteractable = (interactable) => {
    TouchInteractableHandler.removeInteractable(interactable);
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
    renderer.localClippingEnabled = true;
    InputHandler.init(container, renderer, deviceType);
    PointerInteractableHandler.init(deviceType, renderer, scene, camera,
        orbitTarget);
    GripInteractableHandler.init(deviceType, scene);
    TouchInteractableHandler.init(deviceType, scene);
};

const update = (frame) => {
    if(deviceType == 'XR') {
        InputHandler.update(frame);
        GripInteractableHandler.update();
        TouchInteractableHandler.update();
    }
    PointerInteractableHandler.update();
    UpdateHandler.update();
};

export { Body };
export { Div };
export { Span };
export { Style };
export { Text };
export { GripInteractable };
export { PointerInteractable };
export { TouchInteractable };
export { GripInteractableHandler };
export { PointerInteractableHandler };
export { TouchInteractableHandler };
export { InputHandler };
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
