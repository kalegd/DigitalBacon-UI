import { Object3D } from 'three';

import { XRHandMeshModel } from './XRHandMeshModel.js';

class XRHandModel extends Object3D {

    constructor( controller ) {

        super();

        this.controller = controller;
        this.motionController = null;
        this.envMap = null;

        this.mesh = null;

    }

}

class XRHandModelFactory {

    constructor() {

        this.path = null;

    }

    setPath( path ) {

        this.path = path;

        return this;

    }

    createHandModel( xrInputDevice ) {

        let xrInputSource = xrInputDevice;

        const handModel = new XRHandModel();

        if ( xrInputSource.hand && ! handModel.motionController ) {

            handModel.xrInputSource = xrInputSource;

            handModel.motionController = new XRHandMeshModel(handModel,
                xrInputSource, this.path, xrInputSource.handedness);

        }

        return handModel;

    }

}

export { XRHandModelFactory };
