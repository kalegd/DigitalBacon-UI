/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import {
    radiansToDegrees,
    cartesianToPolar,
    polarToCartesian,
    hslToRGB,
    rgbToHex } from '/scripts/utils.js';
import HueSaturationWheel from '/scripts/components/HueSaturationWheel.js';
import Image from '/scripts/components/Image.js';
import States from '/scripts/enums/InteractableStates.js';
import * as THREE from 'three';

const PLANE = new THREE.Plane();
const VEC3 = new THREE.Vector3();
const LIGHTNESS_WIDTH = 1;
const LIGHTNESS_HEIGHT = 256;
const RADIUS = 128;
const R_SQUARED = RADIUS * RADIUS;
const PIXEL_BYTES = 4;

export default class HSLColor {
    constructor(radius, ...styles) {
        this._hue = 171;
        this._saturation = 1;
        this._lightness = 0.5;
        this._radius = radius || 0.1;
        this._createTextures(styles);
        this._createCursors();
    }

    _createTextures(styles) {
        let diameter = this._radius * 2;
        let colorCanvas = document.createElement('canvas');
        let lightnessCanvas = document.createElement('canvas');
        colorCanvas.width = RADIUS * 2;
        colorCanvas.height = RADIUS * 2;
        lightnessCanvas.width = LIGHTNESS_WIDTH;
        lightnessCanvas.height = LIGHTNESS_HEIGHT;
        this._colorContext = colorCanvas.getContext("2d");
        this._lightnessContext = lightnessCanvas.getContext("2d");
        this._updateColorWheel();
        this._updateLightnessBar();
        this._colorTexture = new THREE.CanvasTexture(colorCanvas);
        this._colorTexture.colorSpace = THREE.SRGBColorSpace;
        this._colorTexture.bypassCloning = true;
        this._lightnessTexture = new THREE.CanvasTexture(lightnessCanvas);
        this._lightnessTexture.colorSpace = THREE.SRGBColorSpace;
        this._lightnessTexture.bypassCloning = true;
        this.hueSaturationWheel = new HueSaturationWheel(this._colorTexture,
            { height: diameter, width: diameter }, ...styles);
        this.lightnessBar = new Image(this._lightnessTexture, {
            borderRadius: diameter / 20,
            height: diameter,
            width: diameter / 10,
        }, ...styles);
        this.hueSaturationWheel.pointerInteractable.addEventListener('down',
            (e) =>this.hueSaturationWheel.pointerInteractable.capture(e.owner));
        this.hueSaturationWheel.onClick = (e) => {
            this._handleColorCursorDrag(e);
            if(this._onBlur) this._onBlur(this.getColor());
        };
        this.hueSaturationWheel.onDrag = (e) => {
            this._handleColorCursorDrag(e);
        };
        this.lightnessBar.pointerInteractable.addEventListener('down',
            (e) => this.lightnessBar.pointerInteractable.capture(e.owner));
        this.lightnessBar.onClick = (e) => {
            this._handleLightnessCursorDrag(e);
            if(this._onBlur) this._onBlur(this.getColor());
        };
        this.lightnessBar.onDrag = (e) => {
            this._handleLightnessCursorDrag(e);
        };
    }

    _updateColorWheel() {
        let image = this._colorContext.getImageData(0, 0, 2 * RADIUS, 2*RADIUS);
        let data = image.data;
        this._drawColorWheel(data);
        //this._drawSelectCircle(data);
        this._colorContext.putImageData(image, 0, 0);
    }

    _drawColorWheel(data) {
        let lightness = this._lightness;
        for(let x = -RADIUS; x <= RADIUS; x++) {
            let xSquared = x * x;
            let yMax = Math.ceil(Math.sqrt(R_SQUARED - xSquared));
            for(let y = -yMax; y <= yMax; y++) {
                let [r, phi] = cartesianToPolar(x, y);
                if(r > RADIUS) continue;

                // Need to convert coordinates from [-RADIUS,RADIUS] to
                // [0,RADIUS] for getting index of Image Data Array
                let rowLength = 2 * RADIUS;
                let adjustedX = x + RADIUS;
                let adjustedY = y + RADIUS;
                let index = (adjustedX + (adjustedY * rowLength)) * PIXEL_BYTES;

                let hue = radiansToDegrees(phi);
                let saturation = r / RADIUS;
                let [red, green, blue] = hslToRGB(hue, saturation, lightness);
                data[index] = red;
                data[index+1] = green;
                data[index+2] = blue;
                data[index+3] = 255;
            }
        }
    }

    _updateLightnessBar() {
        let image = this._lightnessContext.getImageData(0, 0, LIGHTNESS_WIDTH,
            LIGHTNESS_HEIGHT);
        let data = image.data;
        for(let x = 0; x < LIGHTNESS_WIDTH; x++) {
            for(let y = 0; y < LIGHTNESS_HEIGHT; y++) {
                let index = (x + (y * LIGHTNESS_WIDTH)) * PIXEL_BYTES;

                let hue = this._hue;
                let saturation = this._saturation;
                let lightness = 1 - y / LIGHTNESS_HEIGHT;
                let [red, green, blue] = hslToRGB(hue, saturation, lightness);

                data[index] = red;
                data[index+1] = green;
                data[index+2] = blue;
                data[index+3] = 255;
            }
        }

        this._lightnessContext.putImageData(image, 0, 0);
    }

    _handleColorCursorDrag(e) {
        let { owner, point } = e;
        if(!point) {
            PLANE.set(VEC3.set(0, 0, 1), 0);
            PLANE.applyMatrix4(this.hueSaturationWheel.matrixWorld);
            point = owner.raycaster.ray.intersectPlane(PLANE, VEC3);
        }
        VEC3.copy(point);
        this.hueSaturationWheel.worldToLocal(VEC3);
        let color = this.selectColorFromXY(VEC3.x, VEC3.y);
        if(color != null && this._onChange) {
            this._onChange(color);
            this._updateColorCursor();
            if(!this._colorCursor.visible) {
                this._colorCursor.visible = true;
            }
        }
    }

    _handleLightnessCursorDrag(e) {
        let { owner, point } = e;
        if(!point) {
            PLANE.set(VEC3.set(0, 0, 1), 0);
            PLANE.applyMatrix4(this.lightnessBar.matrixWorld);
            point = owner.raycaster.ray.intersectPlane(PLANE, VEC3);
        }
        VEC3.copy(point);
        this.lightnessBar.worldToLocal(VEC3);
        let color = this.selectLightnessFromXY(VEC3.x, VEC3.y);
        if(color != null && this._onChange) {
            this._onChange(color);
            this._updateLightnessCursor();
            if(!this._lightnessCursor.visible) {
                this._lightnessCursor.visible = true;
            }
        }
    }

    _createCursors() {
        let geometry = new THREE.RingGeometry(this._radius / 12,
            this._radius / 10, 16);
        let material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            side: THREE.FrontSide,
            transparent: true,
            polygonOffset: true,
            polygonOffsetFactor: -10,
            polygonOffsetUnits: -10,
        });
        this._colorCursor = new THREE.Mesh(geometry, material);
        this._colorCursor.position.setZ(0.00000002);
        this.hueSaturationWheel.add(this._colorCursor);
        this._colorCursor.visible = false;

        geometry = new THREE.RingGeometry(this._radius / 9, this._radius / 7.5,
            4, 1, Math.PI / 4);
        let positions = geometry.getAttribute("position");
        for(let i = 0; i < positions.count; i++) {
            let y = positions.getY(i);
            if(y > 0) positions.setY(i, y - this._radius / 20);
            if(y < 0) positions.setY(i, y + this._radius / 20);
        }
        this._lightnessCursor = new THREE.Mesh(geometry, material);
        this._lightnessCursor.position.setZ(0.00000002);
        this.lightnessBar.add(this._lightnessCursor);
        this._lightnessCursor.visible = false;
    }

    _updateColorCursor() {
        let [x, y] = this.getXY(this._radius);
        VEC3.set(x, -y, 0);
        this._colorCursor.position.setX(VEC3.x);
        this._colorCursor.position.setY(VEC3.y);
        let material = this._colorCursor.material;
        let materialOffset = this.hueSaturationWheel._materialOffset + 1;
        if(material.polygonOffsetFactor != -1 * materialOffset) {
            material.polygonOffsetFactor = -1 * materialOffset;
            material.polygonOffsetUnits = -1 * materialOffset;
            this._colorCursor.renderOrder = materialOffset;
        }
    }

    _updateLightnessCursor() {
        let lightness = this.getLightness(this._radius);
        VEC3.set(0, (lightness - 0.5) * this._radius * 2, 0);
        this._lightnessCursor.position.setX(VEC3.x);
        this._lightnessCursor.position.setY(VEC3.y);
    }

    getColorTexture() {
        return this._colorTexture;
    }

    getLightnessTexture() {
        return this._lightnessTexture;
    }

    getXY(radius) {
        return polarToCartesian(this._saturation * radius,
            THREE.MathUtils.degToRad(this._hue + 180));
    }

    getLightness() {
        return this._lightness;
    }

    setFromHSL(hsl) {
        this._hue = hsl.h * 360;
        this._saturation = hsl.s;
        this._lightness = hsl.l;
        this._updateColorWheel();
        this._updateColorCursor();
        this._updateLightnessBar();
        this._updateLightnessCursor();
        this._colorTexture.needsUpdate = true;
        this._lightnessTexture.needsUpdate = true;
    }

    selectColorFromXY(x, y) {
        let [r, phi] = cartesianToPolar(x, y);
        if(r > this._radius) r = this._radius;

        let hue = radiansToDegrees(-phi);
        let saturation = r / this._radius;
        this._hue = hue;
        this._saturation = saturation;
        this._updateLightnessBar();
        this._lightnessTexture.needsUpdate = true;
        return this.getColor();
    }

    selectLightnessFromXY(x, y) {
        let height = this._radius * 2;
        let lightness = y / height + 0.5;
        if(lightness < 0) lightness = 0;
        if(lightness > 1) lightness = 1;
        this._lightness = lightness;
        this._updateColorWheel();
        this._colorTexture.needsUpdate = true;
        return this.getColor();
    }

    getColor() {
        let [red, green, blue] = hslToRGB(this._hue, this._saturation,
            this._lightness);
        return rgbToHex(red, green, blue);
    }

    isDragging() {
        return this.hueSaturationWheel.pointerInteractable.state
            == States.SELECTED || States.SELECTED
            == this.lightnessBar.pointerInteractable.state;
    }

    get onBlur() { return this._onBlur; }
    get onChange() { return this._onChange; }
    get radius() { return this._radius; }

    set onBlur(onBlur) { this._onBlur = onBlur; }
    set onChange(onChange) { this._onChange = onChange; }
    set radius(radius) { this._radius = radius; }
}
