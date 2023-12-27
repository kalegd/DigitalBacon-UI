import { setupBVHForComplexObject } from '/scripts/utils.js';
import { GLTFLoader } from '/node_modules/three/examples/jsm/loaders/GLTFLoader.js';

const DEFAULT_HAND_PROFILE_PATH = 'https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets@1.0/dist/profiles/generic-hand/';
const CONTACT_DISTANCE = 0.015;
const SEPARATE_DISTANCE = 0.025;
import { Triangle, Vector3 } from 'three';

class XRHandMeshModel {

    constructor( handModel, xrInputSource, path, handedness, loader = null ) {

        this.xrInputSource = xrInputSource;
        this.handModel = handModel;

        this.bones = [];
        this._fingertips = [];
        this._phalanxProximals = [];
        this._palmTriangleVectors = [new Vector3(),new Vector3(),new Vector3()];
        this._palmTriangleBones = [];
        this._palmTriangle = new Triangle();
        this.isPinching = false;
        this.isGrabbing = false;
        this.palmDirection = new Vector3();

        if ( loader === null ) {

            loader = new GLTFLoader();
            loader.setPath( path || DEFAULT_HAND_PROFILE_PATH );

        }

        loader.load( `${handedness}.glb`, gltf => {

            const object = gltf.scene.children[ 0 ];
            this.handModel.add( object );
            this.assetUrl = DEFAULT_HAND_PROFILE_PATH + `${handedness}.glb`;

            const mesh = object.getObjectByProperty( 'type', 'SkinnedMesh' );
            mesh.frustumCulled = false;
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            const joints = [
                'wrist',
                'thumb-metacarpal',
                'thumb-phalanx-proximal',
                'thumb-phalanx-distal',
                'thumb-tip',
                'index-finger-metacarpal',
                'index-finger-phalanx-proximal',
                'index-finger-phalanx-intermediate',
                'index-finger-phalanx-distal',
                'index-finger-tip',
                'middle-finger-metacarpal',
                'middle-finger-phalanx-proximal',
                'middle-finger-phalanx-intermediate',
                'middle-finger-phalanx-distal',
                'middle-finger-tip',
                'ring-finger-metacarpal',
                'ring-finger-phalanx-proximal',
                'ring-finger-phalanx-intermediate',
                'ring-finger-phalanx-distal',
                'ring-finger-tip',
                'pinky-finger-metacarpal',
                'pinky-finger-phalanx-proximal',
                'pinky-finger-phalanx-intermediate',
                'pinky-finger-phalanx-distal',
                'pinky-finger-tip',
            ];

            joints.forEach( jointName => {

                const bone = object.getObjectByName( jointName );

                if ( bone !== undefined ) {

                    bone.jointName = jointName;

                } else {

                    console.warn( `Couldn't find ${jointName} in ${handedness} hand mesh` );

                }

                this.bones.push( bone );

            } );
            for(let i of [4, 9, 14, 19, 24]) {
                this._fingertips.push(this.bones[i]);
            }
            for(let i of [2, 6, 11, 16, 21]) {
                this._phalanxProximals.push(this.bones[i]);
            }
            this._palmTriangleBones.push(this.bones[5]);
            this._palmTriangleBones.push(this.bones[6]);
            this._palmTriangleBones.push(this.bones[10]);
            if(handedness == 'left') this._palmTriangleBones.reverse();
            setupBVHForComplexObject(handModel);
        } );

    }

    _updateGestures() {
        let wrist = this.bones[0];
        if(!wrist) return;
        let grabbing = true;
        let wristPosition = wrist.position;
        for(let i = 2; i < 5; i++) {
            let fingertipPosition = this._fingertips[i].position;
            let knucklePosition = this._phalanxProximals[i].position;
            let tipDist = fingertipPosition.distanceTo(wristPosition);
            let knuckleDist = knucklePosition.distanceTo(wristPosition);
            if(tipDist > knuckleDist) {
                grabbing = false;
                break;
            }
        }
        this.isGrabbing = grabbing;
        let thumbTip = this.bones[4];
        let indexTip = this.bones[9];
        let thumbIndexDist = thumbTip.position.distanceTo(indexTip.position);
        if(this.isPinching) {
            if(thumbIndexDist > SEPARATE_DISTANCE)
                this.isPinching = false;
        } else if(thumbIndexDist < CONTACT_DISTANCE) {
            this.isPinching = true;
        }
        for(let i = 0; i < 3; i++) {
            this._palmTriangleBones[i].getWorldPosition(
                this._palmTriangleVectors[i]);
        }
        this._palmTriangle.setFromPointsAndIndices(this._palmTriangleVectors, 0,
            1, 2);
        this._palmTriangle.getNormal(this.palmDirection);
    }

    updateMesh(frame, referenceSpace, parentMatrix) {
        if(!parentMatrix) return;
        parentMatrix = parentMatrix.clone().invert();
        let i = 0;
        for(let joint of this.xrInputSource.hand.values()) {
            let bone = this.bones[i];
            let jointPose = frame.getJointPose(joint, referenceSpace);
            if(bone && jointPose) {
                bone.matrix.fromArray(jointPose.transform.matrix)
                    .premultiply(parentMatrix);
                bone.matrix.decompose(bone.position, bone.rotation, bone.scale);
            }
            i++;
        }
        this._updateGestures();
    }

}

export { XRHandMeshModel };
