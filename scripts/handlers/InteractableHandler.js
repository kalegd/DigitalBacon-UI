/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import InteractionTool from '/scripts/handlers/InteractionTool.js';

export default class InteractableHandler {
    constructor() {
        this._interactables = new Set();
        this._hoveredInteractables = new Map();
        this._selectedInteractables = new Map();
        this._tool = null;
        this._toolHandlers = {};
    }

    _setupXRSubscription() {
        InteractionTool.addUpdateListener((tool) => {
            for(let [option, interactable] of this._hoveredInteractables) {
                if(interactable) interactable.removeHoveredBy(option);
                this._hoveredInteractables.delete(option);
            }
            for(let [option, interactable] of this._selectedInteractables) {
                if(!interactable) continue;
                let count = 0;
                if(tool) count += interactable.getActionsLength(tool);
                if(this._tool) count += interactable.getActionsLength(
                    this._tool);
                if(count) {
                    interactable.removeSelectedBy(option);
                    this._selectedInteractables.delete(option);
                }
            }
            this._tool = tool;
        });
    }

    init(deviceType) {
        if(deviceType == "XR") {
            this.update = this._updateForXR;
            this._setupXRSubscription();
        } else if(deviceType == "POINTER") {
            this.update = this._updateForPointer;
        } else if(deviceType == "TOUCH") {
            this.update = this._updateForMobile;
        }
    }

    registerToolHandler(tool, handler) {
        this._toolHandlers[tool] = handler;
    }

    addInteractable(interactable) {
        this._interactables.add(interactable);
    }

    addInteractables(interactables) {
        interactables.forEach((interactable) => {
            this._interactables.add(interactable);
        });
    }

    removeInteractable(interactable) {
        this._interactables.delete(interactable);
        interactable.reset();
    }

    removeInteractables(interactables) {
        interactables.forEach((interactable) => {
            this._interactables.delete(interactable);
            interactable.reset();
        });
    }

    reset() {
        this._interactables.forEach(interactable => { interactable.reset(); });
        this._interactables = new Set();
        this._hoveredInteractables = new Map();
        this._selectedInteractables = new Map();
    }

    update() {}

}
