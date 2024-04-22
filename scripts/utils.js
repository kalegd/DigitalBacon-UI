/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { MeshBVHHelper, StaticGeometryGenerator } from '/node_modules/three-mesh-bvh/build/index.module.js';
import * as THREE from 'three';

export const numberOr = (number, defaultValue) =>
    (typeof number == 'number')
        ? number
        : defaultValue;

export const capitalizeFirstLetter = (string) =>
    string.charAt(0).toUpperCase() + string.slice(1);

export const isDescendant = (ancestor, child) => {
    while(child?.parent) {
        if(child.parent == ancestor) return true;
        child = child.parent;
    }
    return false;
};

export const cartesianToPolar = (x, y) => {
    let r = Math.sqrt(x*x + y*y);
    let phi = Math.atan2(y, x);
    return [r, phi];
};

export const polarToCartesian = (r, phi) => [r * Math.cos(phi),r*Math.sin(phi)];

export const radiansToDegrees = (r) => ((r + Math.PI) / (2 * Math.PI)) * 360;

//https://stackoverflow.com/questions/36721830/convert-hsl-to-rgb-and-hex/44134328#44134328
function hueToRGB(p, q, t){
    if(t < 0) t += 1;
    if(t > 1) t -= 1;
    if(t < 1/6) return p + (q - p) * 6 * t;
    if(t < 1/2) return q;
    if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
}

export const hslToRGB = (h, s, l) => {
    h /= 360;
    let r, g, b;
    if(s == 0) {
        r = g = b = l; // achromatic
    } else {
        let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        let p = 2 * l - q;
        r = hueToRGB(p, q, h + 1/3);
        g = hueToRGB(p, q, h);
        b = hueToRGB(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
};

export const rgbToHex = (r, g, b) => r << 16 ^ g << 8 ^ b << 0;

function containsGeometry(object) {
    if(object.geometry) return true;
    for(let child of object.children) {
        if(containsGeometry(child)) return true;
    }
    return false;
}

export const setupBVHForComplexObject = (object) => {
    if(!containsGeometry(object)) return false;
    if(object.parent) {
        let p = object.parent;
        p.remove(object);
        object.updateMatrixWorld(true);
        p.add(object);
    }
    if(!object.children?.length) {
        object.bvhGeometry = object.geometry;
    } else {
        object.staticGeometryGenerator = new StaticGeometryGenerator([object]);
        try {
            object.bvhGeometry = object.staticGeometryGenerator.generate();
        } catch(error) {
            console.error(error);
            return false;
        }
    }
    object.bvhGeometry.computeBoundsTree();
    if(object.parent) object.updateMatrixWorld(true);
    //addBVHHelper(object);
    return true;
};

export const updateBVHForComplexObject = (object) => {
    if(!object.staticGeometryGenerator) return setupBVHForComplexObject(object);
    if(object.parent) {
        let p = object.parent;
        p.remove(object);
        object.updateMatrixWorld(true);
        p.add(object);
    }
    object.staticGeometryGenerator.generate(object.bvhGeometry);
    object.bvhGeometry.boundsTree.refit();
    if(object.parent) object.updateMatrixWorld(true);
    //if(object.bvhHelper) object.bvhHelper.update();
};

export const addBVHHelper = (object) => {
    if(object.bvhGeometry && object.geomtry == object.bvhGeometry) {
        object.parent.add(new MeshBVHHelper(object));
        return;
    }
    let material = new THREE.MeshBasicMaterial( {
        wireframe: true,
        transparent: true,
        opacity: 0.05,
        depthWrite: false,
    });
    let meshHelper = new THREE.Mesh(object.bvhGeometry, material);
    object.parent.add(meshHelper);
    let bvhHelper = new MeshBVHHelper(meshHelper, 10);
    object.parent.add(bvhHelper);
    object.bvhHelper = bvhHelper;
};
