import PointerInteractable from '/scripts/interactables/PointerInteractable.js';
import TouchInteractable from '/scripts/interactables/TouchInteractable.js';
import * as THREE from 'three';

let workingColor = new THREE.Color();
let workingMatrix = new THREE.Matrix4();
let nextId = 1;
const emptyFunc = () => {};

class InstancedBackgroundManager {
    constructor() {
        this._idMap = {};
        this._geometries = {};
        this._clippedParents = new Map();
        this._pendingUpdates = new Set();
    }

    registerLayoutComponentClass(layoutComponentClass) {
        this._layoutComponentClass = layoutComponentClass;
    }

    createBackground(component, height, width, topLeftRadius, topRightRadius,
                     bottomLeftRadius, bottomRightRadius, materialOffset,color){
        let params = [height, width, topLeftRadius, topRightRadius,
            bottomLeftRadius, bottomRightRadius];
        let geometryKey = params.join(':');
        params.push(materialOffset);
        let key = params.join(':');
        let ancestor = this._getClosestAncestorWithHiddenOverflow(component);
        if(!ancestor) return;
        if(!this._clippedParents.has(ancestor))
            this._clippedParents.set(ancestor, {});
        let backgroundsMap = this._clippedParents.get(ancestor);
        let instancedMesh = backgroundsMap[key];
        if(!instancedMesh) {
            let geometry = this._geometries[geometryKey];;
            if(!geometry) {
                let shape = component.createShape(width, height, topLeftRadius,
                    topRightRadius, bottomLeftRadius, bottomRightRadius);
                geometry = new THREE.ShapeGeometry(shape);
                this._geometries[geometryKey] = geometry;
                geometry.computeBoundsTree();
            }
            let material = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                side: THREE.DoubleSide,
                transparent: true,
                polygonOffset: true,
                polygonOffsetFactor: materialOffset * -1,
                polygonOffsetUnits: materialOffset * -1,
            });
            material.clippingPlanes = ancestor.material.clippingPlanes;
            instancedMesh = new THREE.InstancedMesh(geometry, material, 16);
            backgroundsMap[key] = instancedMesh;
            instancedMesh.isUIManagedInstancedMesh = true;
            instancedMesh.maxCount = 16;
            instancedMesh.count = 0;
            instancedMesh.ids = [];
            this._createInteractables(instancedMesh, component, ancestor);
            ancestor.add(instancedMesh);
        }
        if(instancedMesh.count == instancedMesh.maxCount) {
            let oldInstancedMesh = instancedMesh;
            let newCount = oldInstancedMesh.maxCount
                + Math.min(oldInstancedMesh.maxCount, 64);
            instancedMesh = new THREE.InstancedMesh(oldInstancedMesh.geometry,
                oldInstancedMesh.material, newCount);
            instancedMesh.isUIManagedInstancedMesh = true;
            instancedMesh.maxCount = newCount;
            instancedMesh.count = oldInstancedMesh.count;
            instancedMesh.ids = oldInstancedMesh.ids;
            oldInstancedMesh.pointerInteractable.object = instancedMesh;
            oldInstancedMesh.touchInteractable.object = instancedMesh;
            for(let i = 0; i < instancedMesh.count; i++) {
                oldInstancedMesh.getColorAt(i, workingColor);
                oldInstancedMesh.getMatrixAt(i, workingMatrix);
                instancedMesh.setColorAt(i, workingColor);
                instancedMesh.setMatrixAt(i, workingMatrix);
                instancedMesh.instanceColor.needsUpdate = true;
                instancedMesh.instanceMatrix.needsUpdate = true;
            }
            for(let id of instancedMesh.ids) {
                this._idMap[id].instancedMesh = instancedMesh;
            }
            if(oldInstancedMesh.parent) {
                oldInstancedMesh.parent.add(instancedMesh);
                oldInstancedMesh.parent.remove(oldInstancedMesh);
                //instancedMesh.matrix.copy(oldInstancedMesh.matrix);
            }
            oldInstancedMesh.dispose();
            backgroundsMap[key] = instancedMesh;
        }
        let id = nextId;
        let index = instancedMesh.count;
        instancedMesh.ids.push(id);
        this._idMap[id] = {
            ancestor: ancestor,
            component: component,
            instancedMesh: instancedMesh,
            index: index,
        };
        instancedMesh.count++;
        nextId++;
        this.setPositionFrom(id);
        this.setColorFrom(id);
        return id;
    }

    _createInteractables(instancedMesh, component, ancestor) {
        let pointerInteractable = new PointerInteractable(instancedMesh);
        let touchInteractable = new TouchInteractable(instancedMesh);
        pointerInteractable.addEventListener('click', emptyFunc);
        touchInteractable.addEventListener('click', emptyFunc);
        ancestor.pointerInteractable.addChild(pointerInteractable);
        ancestor.touchInteractable.addChild(touchInteractable);
    }

    setPositionFrom(id) {
        this._pendingUpdates.add(id);
    }

    _setPositionFrom(id) {
        let details = this._idMap[id];
        if(!details) return;
        let object = details.component;
        object.updateWorldMatrix(true, false);
        workingMatrix.copy(details.ancestor._content.matrixWorld).invert();
        workingMatrix.multiply(object.matrixWorld);
        details.instancedMesh.setMatrixAt(details.index, workingMatrix);
        details.instancedMesh.instanceMatrix.needsUpdate = true;
    }

    setColorFrom(id) {
        let details = this._idMap[id];
        if(!details) return;
        workingColor.set(details.component.materialColor || '#ffffff');
        details.instancedMesh.setColorAt(details.index, workingColor);
        details.instancedMesh.instanceMatrix.needsUpdate = true;
    }

    _getClosestAncestorWithHiddenOverflow(object) {
        while(object instanceof this._layoutComponentClass) {
            if(object.overflow != 'visible' || object.constructor.name =='Body')
                return object;
            object = object.parentComponent;
        }
        return null;
    }

    getComponent(id) {
        return this._idMap[id]?.component;
    }

    update() {
        let updatedInstancedMeshes = new Set();
        for(let id of this._pendingUpdates) {
            this._setPositionFrom(id);
            let instancedMesh = this._idMap[id]?.instancedMesh;
            if(instancedMesh) updatedInstancedMeshes.add(instancedMesh);
        }
        this._pendingUpdates.clear();
        for(let instancedMesh of updatedInstancedMeshes) {
            instancedMesh.geometry.computeBoundsTree();
            instancedMesh.computeBoundingSphere();
            instancedMesh.computeBoundingBox();
        }
    }
}

let instancedBackgroundManager = new InstancedBackgroundManager();
export default instancedBackgroundManager;
