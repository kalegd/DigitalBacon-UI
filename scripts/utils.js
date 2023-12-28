/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { MeshBVHVisualizer, StaticGeometryGenerator } from '/node_modules/three-mesh-bvh/build/index.module.js';
import * as THREE from 'three';

export const uuidv4 = () => ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,
    c => (c^crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4)
        .toString(16));

export const numberOr = (number, defaultValue) =>
    (typeof number == 'number')
        ? number
        : defaultValue;

export const isDescendant = (ancestor, child) => {
    while(child?.parent) {
        if(child.parent == ancestor) return true;
        child = child.parent;
    }
    return false;
};

export const setupBVHForComplexObject = (object) => {
    if(object.parent) {
        let p = object.parent;
        p.remove(object);
        object.updateMatrixWorld(true);
        p.add(object);
    }
    object.staticGeometryGenerator = new StaticGeometryGenerator([object]);
    object.bvhGeometry = object.staticGeometryGenerator.generate();
    object.bvhGeometry.computeBoundsTree();
    if(object.parent) object.updateMatrixWorld(true);
    //addBVHVisualizer(object);
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

export const addBVHVisualizer = (object) => {
    if(object.bvhGeometry && object.geomtry == object.bvhGeometry) {
        object.parent.add(new MeshBVHVisualizer(object));
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
    let bvhHelper = new MeshBVHVisualizer(meshHelper, 10);
    object.parent.add(bvhHelper);
    object.bvhHelper = bvhHelper;
}
