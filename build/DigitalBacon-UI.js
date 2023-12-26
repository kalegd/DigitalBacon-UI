import * as THREE from 'three';
import { TrianglesDrawMode, TriangleFanDrawMode, TriangleStripDrawMode, Quaternion, Matrix4, Loader, LoaderUtils, FileLoader, Color, LinearSRGBColorSpace, SpotLight, PointLight, DirectionalLight, MeshBasicMaterial, SRGBColorSpace, MeshPhysicalMaterial, Vector2, Vector3, InstancedMesh, InstancedBufferAttribute, Object3D, TextureLoader, ImageBitmapLoader, BufferAttribute, InterleavedBuffer, InterleavedBufferAttribute, LinearFilter, LinearMipmapLinearFilter, RepeatWrapping, PointsMaterial, Material, LineBasicMaterial, MeshStandardMaterial, DoubleSide, PropertyBinding, BufferGeometry, SkinnedMesh, Mesh, LineSegments, Line, LineLoop, Points, Group, PerspectiveCamera, MathUtils, OrthographicCamera, Skeleton, AnimationClip, Bone, InterpolateLinear, ColorManagement, NearestFilter, NearestMipmapNearestFilter, LinearMipmapNearestFilter, NearestMipmapLinearFilter, ClampToEdgeWrapping, MirroredRepeatWrapping, InterpolateDiscrete, FrontSide, Texture, VectorKeyframeTrack, NumberKeyframeTrack, QuaternionKeyframeTrack, Box3, Sphere, Interpolant, SphereGeometry, Triangle, UniformsUtils, MeshDepthMaterial, RGBADepthPacking, MeshDistanceMaterial, ShaderChunk, InstancedBufferGeometry, BackSide, Vector4, Matrix3, PlaneGeometry, Float32BufferAttribute } from 'three';

const InteractableStates = {
    IDLE: "IDLE",
    HOVERED: "HOVERED",
    SELECTED: "SELECTED"
};

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const uuidv4 = () => ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,
    c => (c^crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4)
        .toString(16));

const isDescendant = (ancestor, child) => {
    while(child?.parent) {
        if(child.parent == ancestor) return true;
        child = child.parent;
    }
    return false;
};

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */


class InteractionTool {
    constructor() {
        this._tool = null;
        this._listeners = {};
    }

    getTool() {
        return this._tool;
    }

    setTool(tool) {
        this._tool = tool;
        for(let id in this._listeners) {
            this._listeners[id](tool);
        }
    }

    addUpdateListener(callback) {
        let id = uuidv4();
        this._listeners[id] = callback;
        return id;
    }

    removeUpdateListener(id) {
        delete this._lisreners[id];
    }
}

let interactionTool = new InteractionTool();

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */


class Interactable {
    constructor(threeObj) {
        this._threeObj = threeObj;
        this._state = InteractableStates.IDLE;
        this.children = new Set();
        this._hoveredOwners = new Set();
        this._selectedOwners = new Set();
        this._actions = {};
        this._actionsLength = 0;
        this._toolCounts = {};
    }

    addAction(tool) {
        let id = uuidv4();
        let action = {
            id: id,
            tool: tool,
        };
        this._actions[id] = action;
        this._actionsLength = Object.keys(this._actions).length;
        tool = tool || 'none';
        if(!this._toolCounts[tool]) this._toolCounts[tool] = 0;
        this._toolCounts[tool]++;
        return action;
    }

    removeAction(id) {
        let action = this._actions[id];
        delete this._actions[id];
        this._actionsLength = Object.keys(this._actions).length;
        if(action) this._toolCounts[action.tool || 'none']--;
        return action;
    }

    getActionsLength(tool) {
        return (tool) ? this._toolCounts[tool] : this._actionsLength;
    }

    supportsTool() {
        let tool = interactionTool.getTool();
        return this._toolCounts['none'] || this._toolCounts[tool];
    }

    isOnlyGroup() {
        return !this.supportsTool();
    }

    getObject() {
        return this._threeObj;
    }

    getState() {
        return this._state;
    }

    setState(newState) {
        if(this._state != newState) {
            this._state = newState;
            if(this._stateCallback) this._stateCallback(newState);
        }
    }

    setStateCallback(callback) {
        this._stateCallback = callback;
    }

    setHoveredCallback(callback) {
        this._hoveredCallback = callback;
    }

    _determineAndSetState() {
        if(this._selectedOwners.size > 0) {
            this.setState(InteractableStates.SELECTED);
        } else if(this._hoveredOwners.size > 0) {
            this.setState(InteractableStates.HOVERED);
        } else {
            this.setState(InteractableStates.IDLE);
        }
    }

    addHoveredBy(owner) {
        if(this._hoveredOwners.has(owner)) return;
        this._hoveredOwners.add(owner);
        if(this._hoveredOwners.size == 1 && this._hoveredCallback)
            this._hoveredCallback(true);
        if(this._selectedOwners.size == 0)
            this.setState(InteractableStates.HOVERED);
    }

    removeHoveredBy(owner) {
        this._hoveredOwners.delete(owner);
        if(this._hoveredOwners.size == 0 && this._hoveredCallback) {
            this._hoveredCallback(false);
        }
        this._determineAndSetState();
    }

    addSelectedBy(_owner) {
        console.error("Interactable.addSelectedBy(owner) must be overridden");
    }

    removeSelectedBy(_owner) {
        console.error(
            "Interactable.removeSelectedBy(owner) must be overridden");
    }

    reset() {
        this._hoveredOwners.clear();
        this._selectedOwners.clear();
        this.setState(InteractableStates.IDLE);
        this.children.forEach((interactable) => {
            interactable.reset();
        });
    }

    addChild(interactable) {
        if(interactable.parent == this) return;
        if(interactable.parent) interactable.parent.removeChild(interactable);
        this.children.add(interactable);
        interactable.parent = this;
    }

    addChildren(interactables) {
        interactables.forEach((interactable) => {
            this.addChild(interactable);
        });
    }

    removeChild(interactable) {
        this.children.delete(interactable);
        interactable.parent = null;
    }

    removeChildren(interactables) {
        interactables.forEach((interactable) => {
            this.removeChild(interactable);
        });
    }
}

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */


const vector3$1 = new THREE.Vector3();

class GripInteractable extends Interactable {
    constructor(threeObj) {
        super(threeObj);
        if(threeObj) threeObj.gripInteractable = this;
        this._createBoundingObject();
    }

    addAction(selectedAction, releasedAction, tool) {
        if(selectedAction && typeof selectedAction == 'object') {
            if(!this._actions[selectedAction.id]) {
                this._toolCounts[selectedAction.tool || 'none']++;
            }
            this._actions[selectedAction.id] = selectedAction;
            this._actionsLength = Object.keys(this._actions).length;
            return selectedAction;
        }
        let action = super.addAction(tool);
        action['selectedAction'] = selectedAction;
        action['releasedAction'] = releasedAction;
        action['selectedBy'] = new Set();
        action['type'] = 'GRIP';
        return action;
    }

    _createBoundingObject() {
        this._boundingBox = new THREE.Box3();
    }

    _getBoundingObject() {
        this._boundingBox.setFromObject(this._threeObj);
        return this._boundingBox;
    }

    intersectsSphere(sphere) {
        let boundingBox = this._getBoundingObject();
        let intersects;
        if(boundingBox) {
            intersects = sphere.intersectsBox(boundingBox);
        } else {
            intersects = false;
        }
        return intersects;
    }

    // Assumes intersectsSphere(sphere) is called first so we don't update the
    // bounding box by calling _getBoundingObject()
    distanceToSphere(sphere) {
        return sphere.distanceToPoint(this._boundingBox.getCenter(vector3$1));
    }

    addSelectedBy(owner) {
        this._triggerSelected(owner);
        this._selectedOwners.add(owner);
        this.setState(InteractableStates.SELECTED);
    }

    removeSelectedBy(owner) {
        this._triggerReleased(owner);
        this._selectedOwners.delete(owner);
        this._determineAndSetState();
    }
    
    _triggerSelected(owner) {
        let tool = interactionTool.getTool();
        let currentIds = Object.keys(this._actions);
        for(let id of currentIds) {
            let action = this._actions[id];
            if(!action) continue;
            if(!action.tool || action.tool == tool) {
                if(action.selectedAction) action.selectedAction(owner);
                action.selectedBy.add(owner);
            }
        }
    }

    _triggerReleased(owner) {
        let currentIds = Object.keys(this._actions);
        for(let id of currentIds) {
            let action = this._actions[id];
            if(!action) continue;
            if(action.selectedBy.has(owner)) {
                if(action.releasedAction) action.releasedAction(owner);
                action.selectedBy.delete(owner);
            }
        }
    }

    static emptyGroup() {
        return new GripInteractable();
    }
}

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */


class PointerInteractable extends Interactable {
    constructor(threeObj) {
        super(threeObj);
        if(threeObj) threeObj.pointerInteractable = this;
        this._maxDistance = -Infinity;
    }

    addAction(clickAction, draggableAction, maxDistance, tool, option) {
        if(clickAction && typeof clickAction == 'object') {
            if(!this._actions[clickAction.id]) {
                this._toolCounts[clickAction.tool || 'none']++;
            }
            this._actions[clickAction.id] = clickAction;
            this._actionsLength = Object.keys(this._actions).length;
            return clickAction;
        }
        if(!maxDistance) maxDistance = Infinity;
        if(maxDistance > this._maxDistance) this._maxDistance = maxDistance;
        let action = super.addAction(tool, option);
        action['clickAction'] = clickAction;
        action['draggableAction'] = draggableAction;
        action['draggingOwners'] = new Set();
        action['maxDistance'] = maxDistance;
        action['type'] = 'POINTER';
        return action;
    }

    removeAction(id) {
        let action = super.removeAction(id);
        if(action && action.maxDistance == this._maxDistance) {
            this._maxDistance = -Infinity;
            for(let id in this._actions) {
                if(this._actions[id].maxDistance > this._maxDistance)
                    this._maxDistance = this._actions[id].maxDistance;
            }
        }
        return action;
    }

    isWithinReach(distance) {
        return distance < this._maxDistance;
    }

    addHoveredBy(owner, closestPoint, distance) {
        if(this._hoveredOwners.has(owner)) {
            return;
        } else if(this._selectedOwners.has(owner)) {
            this.triggerActions(owner, closestPoint, distance);
        }
        this._hoveredOwners.add(owner);
        if(this._hoveredOwners.size == 1 && this._hoveredCallback) {
            this._hoveredCallback(true);
        }
        if(this._selectedOwners.size == 0) {
            this.setState(InteractableStates.HOVERED);
        }
    }

    addSelectedBy(owner, closestPoint, distance) {
        this._selectedOwners.add(owner);
        this.setState(InteractableStates.SELECTED);
        this.triggerDraggableActions(owner, closestPoint, distance);
    }

    removeSelectedBy(owner) {
        if(!this._hoveredOwners.has(owner)) {
            this.releaseDraggedActions(owner);
        }
        this._selectedOwners.delete(owner);
        this._determineAndSetState();
    }

    triggerActions(owner, closestPoint, distance) {
        let ids = Object.keys(this._actions);
        let tool = interactionTool.getTool();
        for(let id of ids) {
            let action = this._actions[id];
            if(!action) continue;
            if(action.clickAction && (!action.tool || action.tool == tool)
                && (action.maxDistance >= distance
                    || action.draggingOwners.has(owner)))
            {
                action.clickAction(owner, closestPoint);
            }
            if(action.draggingOwners.has(owner))
                action.draggingOwners.delete(owner);
        }
    }

    triggerDraggableActions(owner, closestPoint, distance) {
        let ids = Object.keys(this._actions);
        let tool = interactionTool.getTool();
        for(let id of ids) {
            let action = this._actions[id];
            if(!action) continue;
            if(action.draggableAction && (!action.tool || action.tool == tool)
                && (action.draggingOwners.has(owner)
                    || action.maxDistance >= distance))
            {
                action.draggableAction(owner, closestPoint);
                action.isDragging = true;
                if(!action.draggingOwners.has(owner))
                    action.draggingOwners.add(owner);
            }
        }
    }

    releaseDraggedActions(owner) {
        let ids = Object.keys(this._actions);
        for(let id of ids) {
            let action = this._actions[id];
            if(!action) continue;
            if(action.draggingOwners.has(owner)) {
                if(action.clickAction) action.clickAction(owner);
                action.draggingOwners.delete(owner);
            }
        }
    }

    static emptyGroup() {
        return new PointerInteractable();
    }

    static createDraggable(threeObj, actionFunc, draggableActionFunc) {
        let interactable = new PointerInteractable(threeObj, true, null);
        interactable.addAction(actionFunc, draggableActionFunc);
        return interactable;
    }
}

const Handedness = {
    LEFT: "LEFT",
    RIGHT: "RIGHT",
};

Handedness.otherHand = (hand) => {
    if(hand == Handedness.LEFT) return Handedness.RIGHT;
    if(hand == Handedness.RIGHT) return Handedness.LEFT;
    console.error('ERROR: Unexpected hand provided to Handedness.otherHand');
};

const XRInputDeviceTypes = {
    CONTROLLER: "CONTROLLER",
    HAND: "HAND",
    OTHER: "OTHER",
};

/**
 * @param {BufferGeometry} geometry
 * @param {number} drawMode
 * @return {BufferGeometry}
 */
function toTrianglesDrawMode( geometry, drawMode ) {

	if ( drawMode === TrianglesDrawMode ) {

		console.warn( 'THREE.BufferGeometryUtils.toTrianglesDrawMode(): Geometry already defined as triangles.' );
		return geometry;

	}

	if ( drawMode === TriangleFanDrawMode || drawMode === TriangleStripDrawMode ) {

		let index = geometry.getIndex();

		// generate index if not present

		if ( index === null ) {

			const indices = [];

			const position = geometry.getAttribute( 'position' );

			if ( position !== undefined ) {

				for ( let i = 0; i < position.count; i ++ ) {

					indices.push( i );

				}

				geometry.setIndex( indices );
				index = geometry.getIndex();

			} else {

				console.error( 'THREE.BufferGeometryUtils.toTrianglesDrawMode(): Undefined position attribute. Processing not possible.' );
				return geometry;

			}

		}

		//

		const numberOfTriangles = index.count - 2;
		const newIndices = [];

		if ( drawMode === TriangleFanDrawMode ) {

			// gl.TRIANGLE_FAN

			for ( let i = 1; i <= numberOfTriangles; i ++ ) {

				newIndices.push( index.getX( 0 ) );
				newIndices.push( index.getX( i ) );
				newIndices.push( index.getX( i + 1 ) );

			}

		} else {

			// gl.TRIANGLE_STRIP

			for ( let i = 0; i < numberOfTriangles; i ++ ) {

				if ( i % 2 === 0 ) {

					newIndices.push( index.getX( i ) );
					newIndices.push( index.getX( i + 1 ) );
					newIndices.push( index.getX( i + 2 ) );

				} else {

					newIndices.push( index.getX( i + 2 ) );
					newIndices.push( index.getX( i + 1 ) );
					newIndices.push( index.getX( i ) );

				}

			}

		}

		if ( ( newIndices.length / 3 ) !== numberOfTriangles ) {

			console.error( 'THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unable to generate correct amount of triangles.' );

		}

		// build final geometry

		const newGeometry = geometry.clone();
		newGeometry.setIndex( newIndices );
		newGeometry.clearGroups();

		return newGeometry;

	} else {

		console.error( 'THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unknown draw mode:', drawMode );
		return geometry;

	}

}

class GLTFLoader extends Loader {

	constructor( manager ) {

		super( manager );

		this.dracoLoader = null;
		this.ktx2Loader = null;
		this.meshoptDecoder = null;

		this.pluginCallbacks = [];

		this.register( function ( parser ) {

			return new GLTFMaterialsClearcoatExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFTextureBasisUExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFTextureWebPExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFTextureAVIFExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFMaterialsSheenExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFMaterialsTransmissionExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFMaterialsVolumeExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFMaterialsIorExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFMaterialsEmissiveStrengthExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFMaterialsSpecularExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFMaterialsIridescenceExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFMaterialsAnisotropyExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFMaterialsBumpExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFLightsExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFMeshoptCompression( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFMeshGpuInstancing( parser );

		} );

	}

	load( url, onLoad, onProgress, onError ) {

		const scope = this;

		let resourcePath;

		if ( this.resourcePath !== '' ) {

			resourcePath = this.resourcePath;

		} else if ( this.path !== '' ) {

			// If a base path is set, resources will be relative paths from that plus the relative path of the gltf file
			// Example  path = 'https://my-cnd-server.com/', url = 'assets/models/model.gltf'
			// resourcePath = 'https://my-cnd-server.com/assets/models/'
			// referenced resource 'model.bin' will be loaded from 'https://my-cnd-server.com/assets/models/model.bin'
			// referenced resource '../textures/texture.png' will be loaded from 'https://my-cnd-server.com/assets/textures/texture.png'
			const relativeUrl = LoaderUtils.extractUrlBase( url );
			resourcePath = LoaderUtils.resolveURL( relativeUrl, this.path );

		} else {

			resourcePath = LoaderUtils.extractUrlBase( url );

		}

		// Tells the LoadingManager to track an extra item, which resolves after
		// the model is fully loaded. This means the count of items loaded will
		// be incorrect, but ensures manager.onLoad() does not fire early.
		this.manager.itemStart( url );

		const _onError = function ( e ) {

			if ( onError ) {

				onError( e );

			} else {

				console.error( e );

			}

			scope.manager.itemError( url );
			scope.manager.itemEnd( url );

		};

		const loader = new FileLoader( this.manager );

		loader.setPath( this.path );
		loader.setResponseType( 'arraybuffer' );
		loader.setRequestHeader( this.requestHeader );
		loader.setWithCredentials( this.withCredentials );

		loader.load( url, function ( data ) {

			try {

				scope.parse( data, resourcePath, function ( gltf ) {

					onLoad( gltf );

					scope.manager.itemEnd( url );

				}, _onError );

			} catch ( e ) {

				_onError( e );

			}

		}, onProgress, _onError );

	}

	setDRACOLoader( dracoLoader ) {

		this.dracoLoader = dracoLoader;
		return this;

	}

	setDDSLoader() {

		throw new Error(

			'THREE.GLTFLoader: "MSFT_texture_dds" no longer supported. Please update to "KHR_texture_basisu".'

		);

	}

	setKTX2Loader( ktx2Loader ) {

		this.ktx2Loader = ktx2Loader;
		return this;

	}

	setMeshoptDecoder( meshoptDecoder ) {

		this.meshoptDecoder = meshoptDecoder;
		return this;

	}

	register( callback ) {

		if ( this.pluginCallbacks.indexOf( callback ) === - 1 ) {

			this.pluginCallbacks.push( callback );

		}

		return this;

	}

	unregister( callback ) {

		if ( this.pluginCallbacks.indexOf( callback ) !== - 1 ) {

			this.pluginCallbacks.splice( this.pluginCallbacks.indexOf( callback ), 1 );

		}

		return this;

	}

	parse( data, path, onLoad, onError ) {

		let json;
		const extensions = {};
		const plugins = {};
		const textDecoder = new TextDecoder();

		if ( typeof data === 'string' ) {

			json = JSON.parse( data );

		} else if ( data instanceof ArrayBuffer ) {

			const magic = textDecoder.decode( new Uint8Array( data, 0, 4 ) );

			if ( magic === BINARY_EXTENSION_HEADER_MAGIC ) {

				try {

					extensions[ EXTENSIONS.KHR_BINARY_GLTF ] = new GLTFBinaryExtension( data );

				} catch ( error ) {

					if ( onError ) onError( error );
					return;

				}

				json = JSON.parse( extensions[ EXTENSIONS.KHR_BINARY_GLTF ].content );

			} else {

				json = JSON.parse( textDecoder.decode( data ) );

			}

		} else {

			json = data;

		}

		if ( json.asset === undefined || json.asset.version[ 0 ] < 2 ) {

			if ( onError ) onError( new Error( 'THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported.' ) );
			return;

		}

		const parser = new GLTFParser( json, {

			path: path || this.resourcePath || '',
			crossOrigin: this.crossOrigin,
			requestHeader: this.requestHeader,
			manager: this.manager,
			ktx2Loader: this.ktx2Loader,
			meshoptDecoder: this.meshoptDecoder

		} );

		parser.fileLoader.setRequestHeader( this.requestHeader );

		for ( let i = 0; i < this.pluginCallbacks.length; i ++ ) {

			const plugin = this.pluginCallbacks[ i ]( parser );

			if ( ! plugin.name ) console.error( 'THREE.GLTFLoader: Invalid plugin found: missing name' );

			plugins[ plugin.name ] = plugin;

			// Workaround to avoid determining as unknown extension
			// in addUnknownExtensionsToUserData().
			// Remove this workaround if we move all the existing
			// extension handlers to plugin system
			extensions[ plugin.name ] = true;

		}

		if ( json.extensionsUsed ) {

			for ( let i = 0; i < json.extensionsUsed.length; ++ i ) {

				const extensionName = json.extensionsUsed[ i ];
				const extensionsRequired = json.extensionsRequired || [];

				switch ( extensionName ) {

					case EXTENSIONS.KHR_MATERIALS_UNLIT:
						extensions[ extensionName ] = new GLTFMaterialsUnlitExtension();
						break;

					case EXTENSIONS.KHR_DRACO_MESH_COMPRESSION:
						extensions[ extensionName ] = new GLTFDracoMeshCompressionExtension( json, this.dracoLoader );
						break;

					case EXTENSIONS.KHR_TEXTURE_TRANSFORM:
						extensions[ extensionName ] = new GLTFTextureTransformExtension();
						break;

					case EXTENSIONS.KHR_MESH_QUANTIZATION:
						extensions[ extensionName ] = new GLTFMeshQuantizationExtension();
						break;

					default:

						if ( extensionsRequired.indexOf( extensionName ) >= 0 && plugins[ extensionName ] === undefined ) {

							console.warn( 'THREE.GLTFLoader: Unknown extension "' + extensionName + '".' );

						}

				}

			}

		}

		parser.setExtensions( extensions );
		parser.setPlugins( plugins );
		parser.parse( onLoad, onError );

	}

	parseAsync( data, path ) {

		const scope = this;

		return new Promise( function ( resolve, reject ) {

			scope.parse( data, path, resolve, reject );

		} );

	}

}

/* GLTFREGISTRY */

function GLTFRegistry() {

	let objects = {};

	return	{

		get: function ( key ) {

			return objects[ key ];

		},

		add: function ( key, object ) {

			objects[ key ] = object;

		},

		remove: function ( key ) {

			delete objects[ key ];

		},

		removeAll: function () {

			objects = {};

		}

	};

}

/*********************************/
/********** EXTENSIONS ***********/
/*********************************/

const EXTENSIONS = {
	KHR_BINARY_GLTF: 'KHR_binary_glTF',
	KHR_DRACO_MESH_COMPRESSION: 'KHR_draco_mesh_compression',
	KHR_LIGHTS_PUNCTUAL: 'KHR_lights_punctual',
	KHR_MATERIALS_CLEARCOAT: 'KHR_materials_clearcoat',
	KHR_MATERIALS_IOR: 'KHR_materials_ior',
	KHR_MATERIALS_SHEEN: 'KHR_materials_sheen',
	KHR_MATERIALS_SPECULAR: 'KHR_materials_specular',
	KHR_MATERIALS_TRANSMISSION: 'KHR_materials_transmission',
	KHR_MATERIALS_IRIDESCENCE: 'KHR_materials_iridescence',
	KHR_MATERIALS_ANISOTROPY: 'KHR_materials_anisotropy',
	KHR_MATERIALS_UNLIT: 'KHR_materials_unlit',
	KHR_MATERIALS_VOLUME: 'KHR_materials_volume',
	KHR_TEXTURE_BASISU: 'KHR_texture_basisu',
	KHR_TEXTURE_TRANSFORM: 'KHR_texture_transform',
	KHR_MESH_QUANTIZATION: 'KHR_mesh_quantization',
	KHR_MATERIALS_EMISSIVE_STRENGTH: 'KHR_materials_emissive_strength',
	EXT_MATERIALS_BUMP: 'EXT_materials_bump',
	EXT_TEXTURE_WEBP: 'EXT_texture_webp',
	EXT_TEXTURE_AVIF: 'EXT_texture_avif',
	EXT_MESHOPT_COMPRESSION: 'EXT_meshopt_compression',
	EXT_MESH_GPU_INSTANCING: 'EXT_mesh_gpu_instancing'
};

/**
 * Punctual Lights Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_lights_punctual
 */
class GLTFLightsExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.KHR_LIGHTS_PUNCTUAL;

		// Object3D instance caches
		this.cache = { refs: {}, uses: {} };

	}

	_markDefs() {

		const parser = this.parser;
		const nodeDefs = this.parser.json.nodes || [];

		for ( let nodeIndex = 0, nodeLength = nodeDefs.length; nodeIndex < nodeLength; nodeIndex ++ ) {

			const nodeDef = nodeDefs[ nodeIndex ];

			if ( nodeDef.extensions
					&& nodeDef.extensions[ this.name ]
					&& nodeDef.extensions[ this.name ].light !== undefined ) {

				parser._addNodeRef( this.cache, nodeDef.extensions[ this.name ].light );

			}

		}

	}

	_loadLight( lightIndex ) {

		const parser = this.parser;
		const cacheKey = 'light:' + lightIndex;
		let dependency = parser.cache.get( cacheKey );

		if ( dependency ) return dependency;

		const json = parser.json;
		const extensions = ( json.extensions && json.extensions[ this.name ] ) || {};
		const lightDefs = extensions.lights || [];
		const lightDef = lightDefs[ lightIndex ];
		let lightNode;

		const color = new Color( 0xffffff );

		if ( lightDef.color !== undefined ) color.setRGB( lightDef.color[ 0 ], lightDef.color[ 1 ], lightDef.color[ 2 ], LinearSRGBColorSpace );

		const range = lightDef.range !== undefined ? lightDef.range : 0;

		switch ( lightDef.type ) {

			case 'directional':
				lightNode = new DirectionalLight( color );
				lightNode.target.position.set( 0, 0, - 1 );
				lightNode.add( lightNode.target );
				break;

			case 'point':
				lightNode = new PointLight( color );
				lightNode.distance = range;
				break;

			case 'spot':
				lightNode = new SpotLight( color );
				lightNode.distance = range;
				// Handle spotlight properties.
				lightDef.spot = lightDef.spot || {};
				lightDef.spot.innerConeAngle = lightDef.spot.innerConeAngle !== undefined ? lightDef.spot.innerConeAngle : 0;
				lightDef.spot.outerConeAngle = lightDef.spot.outerConeAngle !== undefined ? lightDef.spot.outerConeAngle : Math.PI / 4.0;
				lightNode.angle = lightDef.spot.outerConeAngle;
				lightNode.penumbra = 1.0 - lightDef.spot.innerConeAngle / lightDef.spot.outerConeAngle;
				lightNode.target.position.set( 0, 0, - 1 );
				lightNode.add( lightNode.target );
				break;

			default:
				throw new Error( 'THREE.GLTFLoader: Unexpected light type: ' + lightDef.type );

		}

		// Some lights (e.g. spot) default to a position other than the origin. Reset the position
		// here, because node-level parsing will only override position if explicitly specified.
		lightNode.position.set( 0, 0, 0 );

		lightNode.decay = 2;

		assignExtrasToUserData( lightNode, lightDef );

		if ( lightDef.intensity !== undefined ) lightNode.intensity = lightDef.intensity;

		lightNode.name = parser.createUniqueName( lightDef.name || ( 'light_' + lightIndex ) );

		dependency = Promise.resolve( lightNode );

		parser.cache.add( cacheKey, dependency );

		return dependency;

	}

	getDependency( type, index ) {

		if ( type !== 'light' ) return;

		return this._loadLight( index );

	}

	createNodeAttachment( nodeIndex ) {

		const self = this;
		const parser = this.parser;
		const json = parser.json;
		const nodeDef = json.nodes[ nodeIndex ];
		const lightDef = ( nodeDef.extensions && nodeDef.extensions[ this.name ] ) || {};
		const lightIndex = lightDef.light;

		if ( lightIndex === undefined ) return null;

		return this._loadLight( lightIndex ).then( function ( light ) {

			return parser._getNodeRef( self.cache, lightIndex, light );

		} );

	}

}

/**
 * Unlit Materials Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_unlit
 */
class GLTFMaterialsUnlitExtension {

	constructor() {

		this.name = EXTENSIONS.KHR_MATERIALS_UNLIT;

	}

	getMaterialType() {

		return MeshBasicMaterial;

	}

	extendParams( materialParams, materialDef, parser ) {

		const pending = [];

		materialParams.color = new Color( 1.0, 1.0, 1.0 );
		materialParams.opacity = 1.0;

		const metallicRoughness = materialDef.pbrMetallicRoughness;

		if ( metallicRoughness ) {

			if ( Array.isArray( metallicRoughness.baseColorFactor ) ) {

				const array = metallicRoughness.baseColorFactor;

				materialParams.color.setRGB( array[ 0 ], array[ 1 ], array[ 2 ], LinearSRGBColorSpace );
				materialParams.opacity = array[ 3 ];

			}

			if ( metallicRoughness.baseColorTexture !== undefined ) {

				pending.push( parser.assignTexture( materialParams, 'map', metallicRoughness.baseColorTexture, SRGBColorSpace ) );

			}

		}

		return Promise.all( pending );

	}

}

/**
 * Materials Emissive Strength Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/blob/5768b3ce0ef32bc39cdf1bef10b948586635ead3/extensions/2.0/Khronos/KHR_materials_emissive_strength/README.md
 */
class GLTFMaterialsEmissiveStrengthExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.KHR_MATERIALS_EMISSIVE_STRENGTH;

	}

	extendMaterialParams( materialIndex, materialParams ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) {

			return Promise.resolve();

		}

		const emissiveStrength = materialDef.extensions[ this.name ].emissiveStrength;

		if ( emissiveStrength !== undefined ) {

			materialParams.emissiveIntensity = emissiveStrength;

		}

		return Promise.resolve();

	}

}

/**
 * Clearcoat Materials Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_clearcoat
 */
class GLTFMaterialsClearcoatExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.KHR_MATERIALS_CLEARCOAT;

	}

	getMaterialType( materialIndex ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) return null;

		return MeshPhysicalMaterial;

	}

	extendMaterialParams( materialIndex, materialParams ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) {

			return Promise.resolve();

		}

		const pending = [];

		const extension = materialDef.extensions[ this.name ];

		if ( extension.clearcoatFactor !== undefined ) {

			materialParams.clearcoat = extension.clearcoatFactor;

		}

		if ( extension.clearcoatTexture !== undefined ) {

			pending.push( parser.assignTexture( materialParams, 'clearcoatMap', extension.clearcoatTexture ) );

		}

		if ( extension.clearcoatRoughnessFactor !== undefined ) {

			materialParams.clearcoatRoughness = extension.clearcoatRoughnessFactor;

		}

		if ( extension.clearcoatRoughnessTexture !== undefined ) {

			pending.push( parser.assignTexture( materialParams, 'clearcoatRoughnessMap', extension.clearcoatRoughnessTexture ) );

		}

		if ( extension.clearcoatNormalTexture !== undefined ) {

			pending.push( parser.assignTexture( materialParams, 'clearcoatNormalMap', extension.clearcoatNormalTexture ) );

			if ( extension.clearcoatNormalTexture.scale !== undefined ) {

				const scale = extension.clearcoatNormalTexture.scale;

				materialParams.clearcoatNormalScale = new Vector2( scale, scale );

			}

		}

		return Promise.all( pending );

	}

}

/**
 * Iridescence Materials Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_iridescence
 */
class GLTFMaterialsIridescenceExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.KHR_MATERIALS_IRIDESCENCE;

	}

	getMaterialType( materialIndex ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) return null;

		return MeshPhysicalMaterial;

	}

	extendMaterialParams( materialIndex, materialParams ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) {

			return Promise.resolve();

		}

		const pending = [];

		const extension = materialDef.extensions[ this.name ];

		if ( extension.iridescenceFactor !== undefined ) {

			materialParams.iridescence = extension.iridescenceFactor;

		}

		if ( extension.iridescenceTexture !== undefined ) {

			pending.push( parser.assignTexture( materialParams, 'iridescenceMap', extension.iridescenceTexture ) );

		}

		if ( extension.iridescenceIor !== undefined ) {

			materialParams.iridescenceIOR = extension.iridescenceIor;

		}

		if ( materialParams.iridescenceThicknessRange === undefined ) {

			materialParams.iridescenceThicknessRange = [ 100, 400 ];

		}

		if ( extension.iridescenceThicknessMinimum !== undefined ) {

			materialParams.iridescenceThicknessRange[ 0 ] = extension.iridescenceThicknessMinimum;

		}

		if ( extension.iridescenceThicknessMaximum !== undefined ) {

			materialParams.iridescenceThicknessRange[ 1 ] = extension.iridescenceThicknessMaximum;

		}

		if ( extension.iridescenceThicknessTexture !== undefined ) {

			pending.push( parser.assignTexture( materialParams, 'iridescenceThicknessMap', extension.iridescenceThicknessTexture ) );

		}

		return Promise.all( pending );

	}

}

/**
 * Sheen Materials Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_sheen
 */
class GLTFMaterialsSheenExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.KHR_MATERIALS_SHEEN;

	}

	getMaterialType( materialIndex ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) return null;

		return MeshPhysicalMaterial;

	}

	extendMaterialParams( materialIndex, materialParams ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) {

			return Promise.resolve();

		}

		const pending = [];

		materialParams.sheenColor = new Color( 0, 0, 0 );
		materialParams.sheenRoughness = 0;
		materialParams.sheen = 1;

		const extension = materialDef.extensions[ this.name ];

		if ( extension.sheenColorFactor !== undefined ) {

			const colorFactor = extension.sheenColorFactor;
			materialParams.sheenColor.setRGB( colorFactor[ 0 ], colorFactor[ 1 ], colorFactor[ 2 ], LinearSRGBColorSpace );

		}

		if ( extension.sheenRoughnessFactor !== undefined ) {

			materialParams.sheenRoughness = extension.sheenRoughnessFactor;

		}

		if ( extension.sheenColorTexture !== undefined ) {

			pending.push( parser.assignTexture( materialParams, 'sheenColorMap', extension.sheenColorTexture, SRGBColorSpace ) );

		}

		if ( extension.sheenRoughnessTexture !== undefined ) {

			pending.push( parser.assignTexture( materialParams, 'sheenRoughnessMap', extension.sheenRoughnessTexture ) );

		}

		return Promise.all( pending );

	}

}

/**
 * Transmission Materials Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_transmission
 * Draft: https://github.com/KhronosGroup/glTF/pull/1698
 */
class GLTFMaterialsTransmissionExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.KHR_MATERIALS_TRANSMISSION;

	}

	getMaterialType( materialIndex ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) return null;

		return MeshPhysicalMaterial;

	}

	extendMaterialParams( materialIndex, materialParams ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) {

			return Promise.resolve();

		}

		const pending = [];

		const extension = materialDef.extensions[ this.name ];

		if ( extension.transmissionFactor !== undefined ) {

			materialParams.transmission = extension.transmissionFactor;

		}

		if ( extension.transmissionTexture !== undefined ) {

			pending.push( parser.assignTexture( materialParams, 'transmissionMap', extension.transmissionTexture ) );

		}

		return Promise.all( pending );

	}

}

/**
 * Materials Volume Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_volume
 */
class GLTFMaterialsVolumeExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.KHR_MATERIALS_VOLUME;

	}

	getMaterialType( materialIndex ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) return null;

		return MeshPhysicalMaterial;

	}

	extendMaterialParams( materialIndex, materialParams ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) {

			return Promise.resolve();

		}

		const pending = [];

		const extension = materialDef.extensions[ this.name ];

		materialParams.thickness = extension.thicknessFactor !== undefined ? extension.thicknessFactor : 0;

		if ( extension.thicknessTexture !== undefined ) {

			pending.push( parser.assignTexture( materialParams, 'thicknessMap', extension.thicknessTexture ) );

		}

		materialParams.attenuationDistance = extension.attenuationDistance || Infinity;

		const colorArray = extension.attenuationColor || [ 1, 1, 1 ];
		materialParams.attenuationColor = new Color().setRGB( colorArray[ 0 ], colorArray[ 1 ], colorArray[ 2 ], LinearSRGBColorSpace );

		return Promise.all( pending );

	}

}

/**
 * Materials ior Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_ior
 */
class GLTFMaterialsIorExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.KHR_MATERIALS_IOR;

	}

	getMaterialType( materialIndex ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) return null;

		return MeshPhysicalMaterial;

	}

	extendMaterialParams( materialIndex, materialParams ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) {

			return Promise.resolve();

		}

		const extension = materialDef.extensions[ this.name ];

		materialParams.ior = extension.ior !== undefined ? extension.ior : 1.5;

		return Promise.resolve();

	}

}

/**
 * Materials specular Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_specular
 */
class GLTFMaterialsSpecularExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.KHR_MATERIALS_SPECULAR;

	}

	getMaterialType( materialIndex ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) return null;

		return MeshPhysicalMaterial;

	}

	extendMaterialParams( materialIndex, materialParams ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) {

			return Promise.resolve();

		}

		const pending = [];

		const extension = materialDef.extensions[ this.name ];

		materialParams.specularIntensity = extension.specularFactor !== undefined ? extension.specularFactor : 1.0;

		if ( extension.specularTexture !== undefined ) {

			pending.push( parser.assignTexture( materialParams, 'specularIntensityMap', extension.specularTexture ) );

		}

		const colorArray = extension.specularColorFactor || [ 1, 1, 1 ];
		materialParams.specularColor = new Color().setRGB( colorArray[ 0 ], colorArray[ 1 ], colorArray[ 2 ], LinearSRGBColorSpace );

		if ( extension.specularColorTexture !== undefined ) {

			pending.push( parser.assignTexture( materialParams, 'specularColorMap', extension.specularColorTexture, SRGBColorSpace ) );

		}

		return Promise.all( pending );

	}

}


/**
 * Materials bump Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/EXT_materials_bump
 */
class GLTFMaterialsBumpExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.EXT_MATERIALS_BUMP;

	}

	getMaterialType( materialIndex ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) return null;

		return MeshPhysicalMaterial;

	}

	extendMaterialParams( materialIndex, materialParams ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) {

			return Promise.resolve();

		}

		const pending = [];

		const extension = materialDef.extensions[ this.name ];

		materialParams.bumpScale = extension.bumpFactor !== undefined ? extension.bumpFactor : 1.0;

		if ( extension.bumpTexture !== undefined ) {

			pending.push( parser.assignTexture( materialParams, 'bumpMap', extension.bumpTexture ) );

		}

		return Promise.all( pending );

	}

}

/**
 * Materials anisotropy Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_anisotropy
 */
class GLTFMaterialsAnisotropyExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.KHR_MATERIALS_ANISOTROPY;

	}

	getMaterialType( materialIndex ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) return null;

		return MeshPhysicalMaterial;

	}

	extendMaterialParams( materialIndex, materialParams ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) {

			return Promise.resolve();

		}

		const pending = [];

		const extension = materialDef.extensions[ this.name ];

		if ( extension.anisotropyStrength !== undefined ) {

			materialParams.anisotropy = extension.anisotropyStrength;

		}

		if ( extension.anisotropyRotation !== undefined ) {

			materialParams.anisotropyRotation = extension.anisotropyRotation;

		}

		if ( extension.anisotropyTexture !== undefined ) {

			pending.push( parser.assignTexture( materialParams, 'anisotropyMap', extension.anisotropyTexture ) );

		}

		return Promise.all( pending );

	}

}

/**
 * BasisU Texture Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_texture_basisu
 */
class GLTFTextureBasisUExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.KHR_TEXTURE_BASISU;

	}

	loadTexture( textureIndex ) {

		const parser = this.parser;
		const json = parser.json;

		const textureDef = json.textures[ textureIndex ];

		if ( ! textureDef.extensions || ! textureDef.extensions[ this.name ] ) {

			return null;

		}

		const extension = textureDef.extensions[ this.name ];
		const loader = parser.options.ktx2Loader;

		if ( ! loader ) {

			if ( json.extensionsRequired && json.extensionsRequired.indexOf( this.name ) >= 0 ) {

				throw new Error( 'THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures' );

			} else {

				// Assumes that the extension is optional and that a fallback texture is present
				return null;

			}

		}

		return parser.loadTextureImage( textureIndex, extension.source, loader );

	}

}

/**
 * WebP Texture Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/EXT_texture_webp
 */
class GLTFTextureWebPExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.EXT_TEXTURE_WEBP;
		this.isSupported = null;

	}

	loadTexture( textureIndex ) {

		const name = this.name;
		const parser = this.parser;
		const json = parser.json;

		const textureDef = json.textures[ textureIndex ];

		if ( ! textureDef.extensions || ! textureDef.extensions[ name ] ) {

			return null;

		}

		const extension = textureDef.extensions[ name ];
		const source = json.images[ extension.source ];

		let loader = parser.textureLoader;
		if ( source.uri ) {

			const handler = parser.options.manager.getHandler( source.uri );
			if ( handler !== null ) loader = handler;

		}

		return this.detectSupport().then( function ( isSupported ) {

			if ( isSupported ) return parser.loadTextureImage( textureIndex, extension.source, loader );

			if ( json.extensionsRequired && json.extensionsRequired.indexOf( name ) >= 0 ) {

				throw new Error( 'THREE.GLTFLoader: WebP required by asset but unsupported.' );

			}

			// Fall back to PNG or JPEG.
			return parser.loadTexture( textureIndex );

		} );

	}

	detectSupport() {

		if ( ! this.isSupported ) {

			this.isSupported = new Promise( function ( resolve ) {

				const image = new Image();

				// Lossy test image. Support for lossy images doesn't guarantee support for all
				// WebP images, unfortunately.
				image.src = 'data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA';

				image.onload = image.onerror = function () {

					resolve( image.height === 1 );

				};

			} );

		}

		return this.isSupported;

	}

}

/**
 * AVIF Texture Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/EXT_texture_avif
 */
class GLTFTextureAVIFExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.EXT_TEXTURE_AVIF;
		this.isSupported = null;

	}

	loadTexture( textureIndex ) {

		const name = this.name;
		const parser = this.parser;
		const json = parser.json;

		const textureDef = json.textures[ textureIndex ];

		if ( ! textureDef.extensions || ! textureDef.extensions[ name ] ) {

			return null;

		}

		const extension = textureDef.extensions[ name ];
		const source = json.images[ extension.source ];

		let loader = parser.textureLoader;
		if ( source.uri ) {

			const handler = parser.options.manager.getHandler( source.uri );
			if ( handler !== null ) loader = handler;

		}

		return this.detectSupport().then( function ( isSupported ) {

			if ( isSupported ) return parser.loadTextureImage( textureIndex, extension.source, loader );

			if ( json.extensionsRequired && json.extensionsRequired.indexOf( name ) >= 0 ) {

				throw new Error( 'THREE.GLTFLoader: AVIF required by asset but unsupported.' );

			}

			// Fall back to PNG or JPEG.
			return parser.loadTexture( textureIndex );

		} );

	}

	detectSupport() {

		if ( ! this.isSupported ) {

			this.isSupported = new Promise( function ( resolve ) {

				const image = new Image();

				// Lossy test image.
				image.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAABcAAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQAMAAAAABNjb2xybmNseAACAAIABoAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAAB9tZGF0EgAKCBgABogQEDQgMgkQAAAAB8dSLfI=';
				image.onload = image.onerror = function () {

					resolve( image.height === 1 );

				};

			} );

		}

		return this.isSupported;

	}

}

/**
 * meshopt BufferView Compression Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/EXT_meshopt_compression
 */
class GLTFMeshoptCompression {

	constructor( parser ) {

		this.name = EXTENSIONS.EXT_MESHOPT_COMPRESSION;
		this.parser = parser;

	}

	loadBufferView( index ) {

		const json = this.parser.json;
		const bufferView = json.bufferViews[ index ];

		if ( bufferView.extensions && bufferView.extensions[ this.name ] ) {

			const extensionDef = bufferView.extensions[ this.name ];

			const buffer = this.parser.getDependency( 'buffer', extensionDef.buffer );
			const decoder = this.parser.options.meshoptDecoder;

			if ( ! decoder || ! decoder.supported ) {

				if ( json.extensionsRequired && json.extensionsRequired.indexOf( this.name ) >= 0 ) {

					throw new Error( 'THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files' );

				} else {

					// Assumes that the extension is optional and that fallback buffer data is present
					return null;

				}

			}

			return buffer.then( function ( res ) {

				const byteOffset = extensionDef.byteOffset || 0;
				const byteLength = extensionDef.byteLength || 0;

				const count = extensionDef.count;
				const stride = extensionDef.byteStride;

				const source = new Uint8Array( res, byteOffset, byteLength );

				if ( decoder.decodeGltfBufferAsync ) {

					return decoder.decodeGltfBufferAsync( count, stride, source, extensionDef.mode, extensionDef.filter ).then( function ( res ) {

						return res.buffer;

					} );

				} else {

					// Support for MeshoptDecoder 0.18 or earlier, without decodeGltfBufferAsync
					return decoder.ready.then( function () {

						const result = new ArrayBuffer( count * stride );
						decoder.decodeGltfBuffer( new Uint8Array( result ), count, stride, source, extensionDef.mode, extensionDef.filter );
						return result;

					} );

				}

			} );

		} else {

			return null;

		}

	}

}

/**
 * GPU Instancing Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/EXT_mesh_gpu_instancing
 *
 */
class GLTFMeshGpuInstancing {

	constructor( parser ) {

		this.name = EXTENSIONS.EXT_MESH_GPU_INSTANCING;
		this.parser = parser;

	}

	createNodeMesh( nodeIndex ) {

		const json = this.parser.json;
		const nodeDef = json.nodes[ nodeIndex ];

		if ( ! nodeDef.extensions || ! nodeDef.extensions[ this.name ] ||
			nodeDef.mesh === undefined ) {

			return null;

		}

		const meshDef = json.meshes[ nodeDef.mesh ];

		// No Points or Lines + Instancing support yet

		for ( const primitive of meshDef.primitives ) {

			if ( primitive.mode !== WEBGL_CONSTANTS.TRIANGLES &&
				 primitive.mode !== WEBGL_CONSTANTS.TRIANGLE_STRIP &&
				 primitive.mode !== WEBGL_CONSTANTS.TRIANGLE_FAN &&
				 primitive.mode !== undefined ) {

				return null;

			}

		}

		const extensionDef = nodeDef.extensions[ this.name ];
		const attributesDef = extensionDef.attributes;

		// @TODO: Can we support InstancedMesh + SkinnedMesh?

		const pending = [];
		const attributes = {};

		for ( const key in attributesDef ) {

			pending.push( this.parser.getDependency( 'accessor', attributesDef[ key ] ).then( accessor => {

				attributes[ key ] = accessor;
				return attributes[ key ];

			} ) );

		}

		if ( pending.length < 1 ) {

			return null;

		}

		pending.push( this.parser.createNodeMesh( nodeIndex ) );

		return Promise.all( pending ).then( results => {

			const nodeObject = results.pop();
			const meshes = nodeObject.isGroup ? nodeObject.children : [ nodeObject ];
			const count = results[ 0 ].count; // All attribute counts should be same
			const instancedMeshes = [];

			for ( const mesh of meshes ) {

				// Temporal variables
				const m = new Matrix4();
				const p = new Vector3();
				const q = new Quaternion();
				const s = new Vector3( 1, 1, 1 );

				const instancedMesh = new InstancedMesh( mesh.geometry, mesh.material, count );

				for ( let i = 0; i < count; i ++ ) {

					if ( attributes.TRANSLATION ) {

						p.fromBufferAttribute( attributes.TRANSLATION, i );

					}

					if ( attributes.ROTATION ) {

						q.fromBufferAttribute( attributes.ROTATION, i );

					}

					if ( attributes.SCALE ) {

						s.fromBufferAttribute( attributes.SCALE, i );

					}

					instancedMesh.setMatrixAt( i, m.compose( p, q, s ) );

				}

				// Add instance attributes to the geometry, excluding TRS.
				for ( const attributeName in attributes ) {

					if ( attributeName === '_COLOR_0' ) {

						const attr = attributes[ attributeName ];
						instancedMesh.instanceColor = new InstancedBufferAttribute( attr.array, attr.itemSize, attr.normalized );

					} else if ( attributeName !== 'TRANSLATION' &&
						 attributeName !== 'ROTATION' &&
						 attributeName !== 'SCALE' ) {

						mesh.geometry.setAttribute( attributeName, attributes[ attributeName ] );

					}

				}

				// Just in case
				Object3D.prototype.copy.call( instancedMesh, mesh );

				this.parser.assignFinalMaterial( instancedMesh );

				instancedMeshes.push( instancedMesh );

			}

			if ( nodeObject.isGroup ) {

				nodeObject.clear();

				nodeObject.add( ... instancedMeshes );

				return nodeObject;

			}

			return instancedMeshes[ 0 ];

		} );

	}

}

/* BINARY EXTENSION */
const BINARY_EXTENSION_HEADER_MAGIC = 'glTF';
const BINARY_EXTENSION_HEADER_LENGTH = 12;
const BINARY_EXTENSION_CHUNK_TYPES = { JSON: 0x4E4F534A, BIN: 0x004E4942 };

class GLTFBinaryExtension {

	constructor( data ) {

		this.name = EXTENSIONS.KHR_BINARY_GLTF;
		this.content = null;
		this.body = null;

		const headerView = new DataView( data, 0, BINARY_EXTENSION_HEADER_LENGTH );
		const textDecoder = new TextDecoder();

		this.header = {
			magic: textDecoder.decode( new Uint8Array( data.slice( 0, 4 ) ) ),
			version: headerView.getUint32( 4, true ),
			length: headerView.getUint32( 8, true )
		};

		if ( this.header.magic !== BINARY_EXTENSION_HEADER_MAGIC ) {

			throw new Error( 'THREE.GLTFLoader: Unsupported glTF-Binary header.' );

		} else if ( this.header.version < 2.0 ) {

			throw new Error( 'THREE.GLTFLoader: Legacy binary file detected.' );

		}

		const chunkContentsLength = this.header.length - BINARY_EXTENSION_HEADER_LENGTH;
		const chunkView = new DataView( data, BINARY_EXTENSION_HEADER_LENGTH );
		let chunkIndex = 0;

		while ( chunkIndex < chunkContentsLength ) {

			const chunkLength = chunkView.getUint32( chunkIndex, true );
			chunkIndex += 4;

			const chunkType = chunkView.getUint32( chunkIndex, true );
			chunkIndex += 4;

			if ( chunkType === BINARY_EXTENSION_CHUNK_TYPES.JSON ) {

				const contentArray = new Uint8Array( data, BINARY_EXTENSION_HEADER_LENGTH + chunkIndex, chunkLength );
				this.content = textDecoder.decode( contentArray );

			} else if ( chunkType === BINARY_EXTENSION_CHUNK_TYPES.BIN ) {

				const byteOffset = BINARY_EXTENSION_HEADER_LENGTH + chunkIndex;
				this.body = data.slice( byteOffset, byteOffset + chunkLength );

			}

			// Clients must ignore chunks with unknown types.

			chunkIndex += chunkLength;

		}

		if ( this.content === null ) {

			throw new Error( 'THREE.GLTFLoader: JSON content not found.' );

		}

	}

}

/**
 * DRACO Mesh Compression Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_draco_mesh_compression
 */
class GLTFDracoMeshCompressionExtension {

	constructor( json, dracoLoader ) {

		if ( ! dracoLoader ) {

			throw new Error( 'THREE.GLTFLoader: No DRACOLoader instance provided.' );

		}

		this.name = EXTENSIONS.KHR_DRACO_MESH_COMPRESSION;
		this.json = json;
		this.dracoLoader = dracoLoader;
		this.dracoLoader.preload();

	}

	decodePrimitive( primitive, parser ) {

		const json = this.json;
		const dracoLoader = this.dracoLoader;
		const bufferViewIndex = primitive.extensions[ this.name ].bufferView;
		const gltfAttributeMap = primitive.extensions[ this.name ].attributes;
		const threeAttributeMap = {};
		const attributeNormalizedMap = {};
		const attributeTypeMap = {};

		for ( const attributeName in gltfAttributeMap ) {

			const threeAttributeName = ATTRIBUTES[ attributeName ] || attributeName.toLowerCase();

			threeAttributeMap[ threeAttributeName ] = gltfAttributeMap[ attributeName ];

		}

		for ( const attributeName in primitive.attributes ) {

			const threeAttributeName = ATTRIBUTES[ attributeName ] || attributeName.toLowerCase();

			if ( gltfAttributeMap[ attributeName ] !== undefined ) {

				const accessorDef = json.accessors[ primitive.attributes[ attributeName ] ];
				const componentType = WEBGL_COMPONENT_TYPES[ accessorDef.componentType ];

				attributeTypeMap[ threeAttributeName ] = componentType.name;
				attributeNormalizedMap[ threeAttributeName ] = accessorDef.normalized === true;

			}

		}

		return parser.getDependency( 'bufferView', bufferViewIndex ).then( function ( bufferView ) {

			return new Promise( function ( resolve, reject ) {

				dracoLoader.decodeDracoFile( bufferView, function ( geometry ) {

					for ( const attributeName in geometry.attributes ) {

						const attribute = geometry.attributes[ attributeName ];
						const normalized = attributeNormalizedMap[ attributeName ];

						if ( normalized !== undefined ) attribute.normalized = normalized;

					}

					resolve( geometry );

				}, threeAttributeMap, attributeTypeMap, LinearSRGBColorSpace, reject );

			} );

		} );

	}

}

/**
 * Texture Transform Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_texture_transform
 */
class GLTFTextureTransformExtension {

	constructor() {

		this.name = EXTENSIONS.KHR_TEXTURE_TRANSFORM;

	}

	extendTexture( texture, transform ) {

		if ( ( transform.texCoord === undefined || transform.texCoord === texture.channel )
			&& transform.offset === undefined
			&& transform.rotation === undefined
			&& transform.scale === undefined ) {

			// See https://github.com/mrdoob/three.js/issues/21819.
			return texture;

		}

		texture = texture.clone();

		if ( transform.texCoord !== undefined ) {

			texture.channel = transform.texCoord;

		}

		if ( transform.offset !== undefined ) {

			texture.offset.fromArray( transform.offset );

		}

		if ( transform.rotation !== undefined ) {

			texture.rotation = transform.rotation;

		}

		if ( transform.scale !== undefined ) {

			texture.repeat.fromArray( transform.scale );

		}

		texture.needsUpdate = true;

		return texture;

	}

}

/**
 * Mesh Quantization Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_mesh_quantization
 */
class GLTFMeshQuantizationExtension {

	constructor() {

		this.name = EXTENSIONS.KHR_MESH_QUANTIZATION;

	}

}

/*********************************/
/********** INTERPOLATION ********/
/*********************************/

// Spline Interpolation
// Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#appendix-c-spline-interpolation
class GLTFCubicSplineInterpolant extends Interpolant {

	constructor( parameterPositions, sampleValues, sampleSize, resultBuffer ) {

		super( parameterPositions, sampleValues, sampleSize, resultBuffer );

	}

	copySampleValue_( index ) {

		// Copies a sample value to the result buffer. See description of glTF
		// CUBICSPLINE values layout in interpolate_() function below.

		const result = this.resultBuffer,
			values = this.sampleValues,
			valueSize = this.valueSize,
			offset = index * valueSize * 3 + valueSize;

		for ( let i = 0; i !== valueSize; i ++ ) {

			result[ i ] = values[ offset + i ];

		}

		return result;

	}

	interpolate_( i1, t0, t, t1 ) {

		const result = this.resultBuffer;
		const values = this.sampleValues;
		const stride = this.valueSize;

		const stride2 = stride * 2;
		const stride3 = stride * 3;

		const td = t1 - t0;

		const p = ( t - t0 ) / td;
		const pp = p * p;
		const ppp = pp * p;

		const offset1 = i1 * stride3;
		const offset0 = offset1 - stride3;

		const s2 = - 2 * ppp + 3 * pp;
		const s3 = ppp - pp;
		const s0 = 1 - s2;
		const s1 = s3 - pp + p;

		// Layout of keyframe output values for CUBICSPLINE animations:
		//   [ inTangent_1, splineVertex_1, outTangent_1, inTangent_2, splineVertex_2, ... ]
		for ( let i = 0; i !== stride; i ++ ) {

			const p0 = values[ offset0 + i + stride ]; // splineVertex_k
			const m0 = values[ offset0 + i + stride2 ] * td; // outTangent_k * (t_k+1 - t_k)
			const p1 = values[ offset1 + i + stride ]; // splineVertex_k+1
			const m1 = values[ offset1 + i ] * td; // inTangent_k+1 * (t_k+1 - t_k)

			result[ i ] = s0 * p0 + s1 * m0 + s2 * p1 + s3 * m1;

		}

		return result;

	}

}

const _q = new Quaternion();

class GLTFCubicSplineQuaternionInterpolant extends GLTFCubicSplineInterpolant {

	interpolate_( i1, t0, t, t1 ) {

		const result = super.interpolate_( i1, t0, t, t1 );

		_q.fromArray( result ).normalize().toArray( result );

		return result;

	}

}


/*********************************/
/********** INTERNALS ************/
/*********************************/

/* CONSTANTS */

const WEBGL_CONSTANTS = {
	FLOAT: 5126,
	//FLOAT_MAT2: 35674,
	FLOAT_MAT3: 35675,
	FLOAT_MAT4: 35676,
	FLOAT_VEC2: 35664,
	FLOAT_VEC3: 35665,
	FLOAT_VEC4: 35666,
	LINEAR: 9729,
	REPEAT: 10497,
	SAMPLER_2D: 35678,
	POINTS: 0,
	LINES: 1,
	LINE_LOOP: 2,
	LINE_STRIP: 3,
	TRIANGLES: 4,
	TRIANGLE_STRIP: 5,
	TRIANGLE_FAN: 6,
	UNSIGNED_BYTE: 5121,
	UNSIGNED_SHORT: 5123
};

const WEBGL_COMPONENT_TYPES = {
	5120: Int8Array,
	5121: Uint8Array,
	5122: Int16Array,
	5123: Uint16Array,
	5125: Uint32Array,
	5126: Float32Array
};

const WEBGL_FILTERS = {
	9728: NearestFilter,
	9729: LinearFilter,
	9984: NearestMipmapNearestFilter,
	9985: LinearMipmapNearestFilter,
	9986: NearestMipmapLinearFilter,
	9987: LinearMipmapLinearFilter
};

const WEBGL_WRAPPINGS = {
	33071: ClampToEdgeWrapping,
	33648: MirroredRepeatWrapping,
	10497: RepeatWrapping
};

const WEBGL_TYPE_SIZES = {
	'SCALAR': 1,
	'VEC2': 2,
	'VEC3': 3,
	'VEC4': 4,
	'MAT2': 4,
	'MAT3': 9,
	'MAT4': 16
};

const ATTRIBUTES = {
	POSITION: 'position',
	NORMAL: 'normal',
	TANGENT: 'tangent',
	TEXCOORD_0: 'uv',
	TEXCOORD_1: 'uv1',
	TEXCOORD_2: 'uv2',
	TEXCOORD_3: 'uv3',
	COLOR_0: 'color',
	WEIGHTS_0: 'skinWeight',
	JOINTS_0: 'skinIndex',
};

const PATH_PROPERTIES = {
	scale: 'scale',
	translation: 'position',
	rotation: 'quaternion',
	weights: 'morphTargetInfluences'
};

const INTERPOLATION = {
	CUBICSPLINE: undefined, // We use a custom interpolant (GLTFCubicSplineInterpolation) for CUBICSPLINE tracks. Each
		                        // keyframe track will be initialized with a default interpolation type, then modified.
	LINEAR: InterpolateLinear,
	STEP: InterpolateDiscrete
};

const ALPHA_MODES = {
	OPAQUE: 'OPAQUE',
	MASK: 'MASK',
	BLEND: 'BLEND'
};

/**
 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#default-material
 */
function createDefaultMaterial( cache ) {

	if ( cache[ 'DefaultMaterial' ] === undefined ) {

		cache[ 'DefaultMaterial' ] = new MeshStandardMaterial( {
			color: 0xFFFFFF,
			emissive: 0x000000,
			metalness: 1,
			roughness: 1,
			transparent: false,
			depthTest: true,
			side: FrontSide
		} );

	}

	return cache[ 'DefaultMaterial' ];

}

function addUnknownExtensionsToUserData( knownExtensions, object, objectDef ) {

	// Add unknown glTF extensions to an object's userData.

	for ( const name in objectDef.extensions ) {

		if ( knownExtensions[ name ] === undefined ) {

			object.userData.gltfExtensions = object.userData.gltfExtensions || {};
			object.userData.gltfExtensions[ name ] = objectDef.extensions[ name ];

		}

	}

}

/**
 * @param {Object3D|Material|BufferGeometry} object
 * @param {GLTF.definition} gltfDef
 */
function assignExtrasToUserData( object, gltfDef ) {

	if ( gltfDef.extras !== undefined ) {

		if ( typeof gltfDef.extras === 'object' ) {

			Object.assign( object.userData, gltfDef.extras );

		} else {

			console.warn( 'THREE.GLTFLoader: Ignoring primitive type .extras, ' + gltfDef.extras );

		}

	}

}

/**
 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#morph-targets
 *
 * @param {BufferGeometry} geometry
 * @param {Array<GLTF.Target>} targets
 * @param {GLTFParser} parser
 * @return {Promise<BufferGeometry>}
 */
function addMorphTargets( geometry, targets, parser ) {

	let hasMorphPosition = false;
	let hasMorphNormal = false;
	let hasMorphColor = false;

	for ( let i = 0, il = targets.length; i < il; i ++ ) {

		const target = targets[ i ];

		if ( target.POSITION !== undefined ) hasMorphPosition = true;
		if ( target.NORMAL !== undefined ) hasMorphNormal = true;
		if ( target.COLOR_0 !== undefined ) hasMorphColor = true;

		if ( hasMorphPosition && hasMorphNormal && hasMorphColor ) break;

	}

	if ( ! hasMorphPosition && ! hasMorphNormal && ! hasMorphColor ) return Promise.resolve( geometry );

	const pendingPositionAccessors = [];
	const pendingNormalAccessors = [];
	const pendingColorAccessors = [];

	for ( let i = 0, il = targets.length; i < il; i ++ ) {

		const target = targets[ i ];

		if ( hasMorphPosition ) {

			const pendingAccessor = target.POSITION !== undefined
				? parser.getDependency( 'accessor', target.POSITION )
				: geometry.attributes.position;

			pendingPositionAccessors.push( pendingAccessor );

		}

		if ( hasMorphNormal ) {

			const pendingAccessor = target.NORMAL !== undefined
				? parser.getDependency( 'accessor', target.NORMAL )
				: geometry.attributes.normal;

			pendingNormalAccessors.push( pendingAccessor );

		}

		if ( hasMorphColor ) {

			const pendingAccessor = target.COLOR_0 !== undefined
				? parser.getDependency( 'accessor', target.COLOR_0 )
				: geometry.attributes.color;

			pendingColorAccessors.push( pendingAccessor );

		}

	}

	return Promise.all( [
		Promise.all( pendingPositionAccessors ),
		Promise.all( pendingNormalAccessors ),
		Promise.all( pendingColorAccessors )
	] ).then( function ( accessors ) {

		const morphPositions = accessors[ 0 ];
		const morphNormals = accessors[ 1 ];
		const morphColors = accessors[ 2 ];

		if ( hasMorphPosition ) geometry.morphAttributes.position = morphPositions;
		if ( hasMorphNormal ) geometry.morphAttributes.normal = morphNormals;
		if ( hasMorphColor ) geometry.morphAttributes.color = morphColors;
		geometry.morphTargetsRelative = true;

		return geometry;

	} );

}

/**
 * @param {Mesh} mesh
 * @param {GLTF.Mesh} meshDef
 */
function updateMorphTargets( mesh, meshDef ) {

	mesh.updateMorphTargets();

	if ( meshDef.weights !== undefined ) {

		for ( let i = 0, il = meshDef.weights.length; i < il; i ++ ) {

			mesh.morphTargetInfluences[ i ] = meshDef.weights[ i ];

		}

	}

	// .extras has user-defined data, so check that .extras.targetNames is an array.
	if ( meshDef.extras && Array.isArray( meshDef.extras.targetNames ) ) {

		const targetNames = meshDef.extras.targetNames;

		if ( mesh.morphTargetInfluences.length === targetNames.length ) {

			mesh.morphTargetDictionary = {};

			for ( let i = 0, il = targetNames.length; i < il; i ++ ) {

				mesh.morphTargetDictionary[ targetNames[ i ] ] = i;

			}

		} else {

			console.warn( 'THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.' );

		}

	}

}

function createPrimitiveKey( primitiveDef ) {

	let geometryKey;

	const dracoExtension = primitiveDef.extensions && primitiveDef.extensions[ EXTENSIONS.KHR_DRACO_MESH_COMPRESSION ];

	if ( dracoExtension ) {

		geometryKey = 'draco:' + dracoExtension.bufferView
				+ ':' + dracoExtension.indices
				+ ':' + createAttributesKey( dracoExtension.attributes );

	} else {

		geometryKey = primitiveDef.indices + ':' + createAttributesKey( primitiveDef.attributes ) + ':' + primitiveDef.mode;

	}

	if ( primitiveDef.targets !== undefined ) {

		for ( let i = 0, il = primitiveDef.targets.length; i < il; i ++ ) {

			geometryKey += ':' + createAttributesKey( primitiveDef.targets[ i ] );

		}

	}

	return geometryKey;

}

function createAttributesKey( attributes ) {

	let attributesKey = '';

	const keys = Object.keys( attributes ).sort();

	for ( let i = 0, il = keys.length; i < il; i ++ ) {

		attributesKey += keys[ i ] + ':' + attributes[ keys[ i ] ] + ';';

	}

	return attributesKey;

}

function getNormalizedComponentScale( constructor ) {

	// Reference:
	// https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_mesh_quantization#encoding-quantized-data

	switch ( constructor ) {

		case Int8Array:
			return 1 / 127;

		case Uint8Array:
			return 1 / 255;

		case Int16Array:
			return 1 / 32767;

		case Uint16Array:
			return 1 / 65535;

		default:
			throw new Error( 'THREE.GLTFLoader: Unsupported normalized accessor component type.' );

	}

}

function getImageURIMimeType( uri ) {

	if ( uri.search( /\.jpe?g($|\?)/i ) > 0 || uri.search( /^data\:image\/jpeg/ ) === 0 ) return 'image/jpeg';
	if ( uri.search( /\.webp($|\?)/i ) > 0 || uri.search( /^data\:image\/webp/ ) === 0 ) return 'image/webp';

	return 'image/png';

}

const _identityMatrix = new Matrix4();

/* GLTF PARSER */

class GLTFParser {

	constructor( json = {}, options = {} ) {

		this.json = json;
		this.extensions = {};
		this.plugins = {};
		this.options = options;

		// loader object cache
		this.cache = new GLTFRegistry();

		// associations between Three.js objects and glTF elements
		this.associations = new Map();

		// BufferGeometry caching
		this.primitiveCache = {};

		// Node cache
		this.nodeCache = {};

		// Object3D instance caches
		this.meshCache = { refs: {}, uses: {} };
		this.cameraCache = { refs: {}, uses: {} };
		this.lightCache = { refs: {}, uses: {} };

		this.sourceCache = {};
		this.textureCache = {};

		// Track node names, to ensure no duplicates
		this.nodeNamesUsed = {};

		// Use an ImageBitmapLoader if imageBitmaps are supported. Moves much of the
		// expensive work of uploading a texture to the GPU off the main thread.

		let isSafari = false;
		let isFirefox = false;
		let firefoxVersion = - 1;

		if ( typeof navigator !== 'undefined' ) {

			isSafari = /^((?!chrome|android).)*safari/i.test( navigator.userAgent ) === true;
			isFirefox = navigator.userAgent.indexOf( 'Firefox' ) > - 1;
			firefoxVersion = isFirefox ? navigator.userAgent.match( /Firefox\/([0-9]+)\./ )[ 1 ] : - 1;

		}

		if ( typeof createImageBitmap === 'undefined' || isSafari || ( isFirefox && firefoxVersion < 98 ) ) {

			this.textureLoader = new TextureLoader( this.options.manager );

		} else {

			this.textureLoader = new ImageBitmapLoader( this.options.manager );

		}

		this.textureLoader.setCrossOrigin( this.options.crossOrigin );
		this.textureLoader.setRequestHeader( this.options.requestHeader );

		this.fileLoader = new FileLoader( this.options.manager );
		this.fileLoader.setResponseType( 'arraybuffer' );

		if ( this.options.crossOrigin === 'use-credentials' ) {

			this.fileLoader.setWithCredentials( true );

		}

	}

	setExtensions( extensions ) {

		this.extensions = extensions;

	}

	setPlugins( plugins ) {

		this.plugins = plugins;

	}

	parse( onLoad, onError ) {

		const parser = this;
		const json = this.json;
		const extensions = this.extensions;

		// Clear the loader cache
		this.cache.removeAll();
		this.nodeCache = {};

		// Mark the special nodes/meshes in json for efficient parse
		this._invokeAll( function ( ext ) {

			return ext._markDefs && ext._markDefs();

		} );

		Promise.all( this._invokeAll( function ( ext ) {

			return ext.beforeRoot && ext.beforeRoot();

		} ) ).then( function () {

			return Promise.all( [

				parser.getDependencies( 'scene' ),
				parser.getDependencies( 'animation' ),
				parser.getDependencies( 'camera' ),

			] );

		} ).then( function ( dependencies ) {

			const result = {
				scene: dependencies[ 0 ][ json.scene || 0 ],
				scenes: dependencies[ 0 ],
				animations: dependencies[ 1 ],
				cameras: dependencies[ 2 ],
				asset: json.asset,
				parser: parser,
				userData: {}
			};

			addUnknownExtensionsToUserData( extensions, result, json );

			assignExtrasToUserData( result, json );

			return Promise.all( parser._invokeAll( function ( ext ) {

				return ext.afterRoot && ext.afterRoot( result );

			} ) ).then( function () {

				onLoad( result );

			} );

		} ).catch( onError );

	}

	/**
	 * Marks the special nodes/meshes in json for efficient parse.
	 */
	_markDefs() {

		const nodeDefs = this.json.nodes || [];
		const skinDefs = this.json.skins || [];
		const meshDefs = this.json.meshes || [];

		// Nothing in the node definition indicates whether it is a Bone or an
		// Object3D. Use the skins' joint references to mark bones.
		for ( let skinIndex = 0, skinLength = skinDefs.length; skinIndex < skinLength; skinIndex ++ ) {

			const joints = skinDefs[ skinIndex ].joints;

			for ( let i = 0, il = joints.length; i < il; i ++ ) {

				nodeDefs[ joints[ i ] ].isBone = true;

			}

		}

		// Iterate over all nodes, marking references to shared resources,
		// as well as skeleton joints.
		for ( let nodeIndex = 0, nodeLength = nodeDefs.length; nodeIndex < nodeLength; nodeIndex ++ ) {

			const nodeDef = nodeDefs[ nodeIndex ];

			if ( nodeDef.mesh !== undefined ) {

				this._addNodeRef( this.meshCache, nodeDef.mesh );

				// Nothing in the mesh definition indicates whether it is
				// a SkinnedMesh or Mesh. Use the node's mesh reference
				// to mark SkinnedMesh if node has skin.
				if ( nodeDef.skin !== undefined ) {

					meshDefs[ nodeDef.mesh ].isSkinnedMesh = true;

				}

			}

			if ( nodeDef.camera !== undefined ) {

				this._addNodeRef( this.cameraCache, nodeDef.camera );

			}

		}

	}

	/**
	 * Counts references to shared node / Object3D resources. These resources
	 * can be reused, or "instantiated", at multiple nodes in the scene
	 * hierarchy. Mesh, Camera, and Light instances are instantiated and must
	 * be marked. Non-scenegraph resources (like Materials, Geometries, and
	 * Textures) can be reused directly and are not marked here.
	 *
	 * Example: CesiumMilkTruck sample model reuses "Wheel" meshes.
	 */
	_addNodeRef( cache, index ) {

		if ( index === undefined ) return;

		if ( cache.refs[ index ] === undefined ) {

			cache.refs[ index ] = cache.uses[ index ] = 0;

		}

		cache.refs[ index ] ++;

	}

	/** Returns a reference to a shared resource, cloning it if necessary. */
	_getNodeRef( cache, index, object ) {

		if ( cache.refs[ index ] <= 1 ) return object;

		const ref = object.clone();

		// Propagates mappings to the cloned object, prevents mappings on the
		// original object from being lost.
		const updateMappings = ( original, clone ) => {

			const mappings = this.associations.get( original );
			if ( mappings != null ) {

				this.associations.set( clone, mappings );

			}

			for ( const [ i, child ] of original.children.entries() ) {

				updateMappings( child, clone.children[ i ] );

			}

		};

		updateMappings( object, ref );

		ref.name += '_instance_' + ( cache.uses[ index ] ++ );

		return ref;

	}

	_invokeOne( func ) {

		const extensions = Object.values( this.plugins );
		extensions.push( this );

		for ( let i = 0; i < extensions.length; i ++ ) {

			const result = func( extensions[ i ] );

			if ( result ) return result;

		}

		return null;

	}

	_invokeAll( func ) {

		const extensions = Object.values( this.plugins );
		extensions.unshift( this );

		const pending = [];

		for ( let i = 0; i < extensions.length; i ++ ) {

			const result = func( extensions[ i ] );

			if ( result ) pending.push( result );

		}

		return pending;

	}

	/**
	 * Requests the specified dependency asynchronously, with caching.
	 * @param {string} type
	 * @param {number} index
	 * @return {Promise<Object3D|Material|THREE.Texture|AnimationClip|ArrayBuffer|Object>}
	 */
	getDependency( type, index ) {

		const cacheKey = type + ':' + index;
		let dependency = this.cache.get( cacheKey );

		if ( ! dependency ) {

			switch ( type ) {

				case 'scene':
					dependency = this.loadScene( index );
					break;

				case 'node':
					dependency = this._invokeOne( function ( ext ) {

						return ext.loadNode && ext.loadNode( index );

					} );
					break;

				case 'mesh':
					dependency = this._invokeOne( function ( ext ) {

						return ext.loadMesh && ext.loadMesh( index );

					} );
					break;

				case 'accessor':
					dependency = this.loadAccessor( index );
					break;

				case 'bufferView':
					dependency = this._invokeOne( function ( ext ) {

						return ext.loadBufferView && ext.loadBufferView( index );

					} );
					break;

				case 'buffer':
					dependency = this.loadBuffer( index );
					break;

				case 'material':
					dependency = this._invokeOne( function ( ext ) {

						return ext.loadMaterial && ext.loadMaterial( index );

					} );
					break;

				case 'texture':
					dependency = this._invokeOne( function ( ext ) {

						return ext.loadTexture && ext.loadTexture( index );

					} );
					break;

				case 'skin':
					dependency = this.loadSkin( index );
					break;

				case 'animation':
					dependency = this._invokeOne( function ( ext ) {

						return ext.loadAnimation && ext.loadAnimation( index );

					} );
					break;

				case 'camera':
					dependency = this.loadCamera( index );
					break;

				default:
					dependency = this._invokeOne( function ( ext ) {

						return ext != this && ext.getDependency && ext.getDependency( type, index );

					} );

					if ( ! dependency ) {

						throw new Error( 'Unknown type: ' + type );

					}

					break;

			}

			this.cache.add( cacheKey, dependency );

		}

		return dependency;

	}

	/**
	 * Requests all dependencies of the specified type asynchronously, with caching.
	 * @param {string} type
	 * @return {Promise<Array<Object>>}
	 */
	getDependencies( type ) {

		let dependencies = this.cache.get( type );

		if ( ! dependencies ) {

			const parser = this;
			const defs = this.json[ type + ( type === 'mesh' ? 'es' : 's' ) ] || [];

			dependencies = Promise.all( defs.map( function ( def, index ) {

				return parser.getDependency( type, index );

			} ) );

			this.cache.add( type, dependencies );

		}

		return dependencies;

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#buffers-and-buffer-views
	 * @param {number} bufferIndex
	 * @return {Promise<ArrayBuffer>}
	 */
	loadBuffer( bufferIndex ) {

		const bufferDef = this.json.buffers[ bufferIndex ];
		const loader = this.fileLoader;

		if ( bufferDef.type && bufferDef.type !== 'arraybuffer' ) {

			throw new Error( 'THREE.GLTFLoader: ' + bufferDef.type + ' buffer type is not supported.' );

		}

		// If present, GLB container is required to be the first buffer.
		if ( bufferDef.uri === undefined && bufferIndex === 0 ) {

			return Promise.resolve( this.extensions[ EXTENSIONS.KHR_BINARY_GLTF ].body );

		}

		const options = this.options;

		return new Promise( function ( resolve, reject ) {

			loader.load( LoaderUtils.resolveURL( bufferDef.uri, options.path ), resolve, undefined, function () {

				reject( new Error( 'THREE.GLTFLoader: Failed to load buffer "' + bufferDef.uri + '".' ) );

			} );

		} );

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#buffers-and-buffer-views
	 * @param {number} bufferViewIndex
	 * @return {Promise<ArrayBuffer>}
	 */
	loadBufferView( bufferViewIndex ) {

		const bufferViewDef = this.json.bufferViews[ bufferViewIndex ];

		return this.getDependency( 'buffer', bufferViewDef.buffer ).then( function ( buffer ) {

			const byteLength = bufferViewDef.byteLength || 0;
			const byteOffset = bufferViewDef.byteOffset || 0;
			return buffer.slice( byteOffset, byteOffset + byteLength );

		} );

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#accessors
	 * @param {number} accessorIndex
	 * @return {Promise<BufferAttribute|InterleavedBufferAttribute>}
	 */
	loadAccessor( accessorIndex ) {

		const parser = this;
		const json = this.json;

		const accessorDef = this.json.accessors[ accessorIndex ];

		if ( accessorDef.bufferView === undefined && accessorDef.sparse === undefined ) {

			const itemSize = WEBGL_TYPE_SIZES[ accessorDef.type ];
			const TypedArray = WEBGL_COMPONENT_TYPES[ accessorDef.componentType ];
			const normalized = accessorDef.normalized === true;

			const array = new TypedArray( accessorDef.count * itemSize );
			return Promise.resolve( new BufferAttribute( array, itemSize, normalized ) );

		}

		const pendingBufferViews = [];

		if ( accessorDef.bufferView !== undefined ) {

			pendingBufferViews.push( this.getDependency( 'bufferView', accessorDef.bufferView ) );

		} else {

			pendingBufferViews.push( null );

		}

		if ( accessorDef.sparse !== undefined ) {

			pendingBufferViews.push( this.getDependency( 'bufferView', accessorDef.sparse.indices.bufferView ) );
			pendingBufferViews.push( this.getDependency( 'bufferView', accessorDef.sparse.values.bufferView ) );

		}

		return Promise.all( pendingBufferViews ).then( function ( bufferViews ) {

			const bufferView = bufferViews[ 0 ];

			const itemSize = WEBGL_TYPE_SIZES[ accessorDef.type ];
			const TypedArray = WEBGL_COMPONENT_TYPES[ accessorDef.componentType ];

			// For VEC3: itemSize is 3, elementBytes is 4, itemBytes is 12.
			const elementBytes = TypedArray.BYTES_PER_ELEMENT;
			const itemBytes = elementBytes * itemSize;
			const byteOffset = accessorDef.byteOffset || 0;
			const byteStride = accessorDef.bufferView !== undefined ? json.bufferViews[ accessorDef.bufferView ].byteStride : undefined;
			const normalized = accessorDef.normalized === true;
			let array, bufferAttribute;

			// The buffer is not interleaved if the stride is the item size in bytes.
			if ( byteStride && byteStride !== itemBytes ) {

				// Each "slice" of the buffer, as defined by 'count' elements of 'byteStride' bytes, gets its own InterleavedBuffer
				// This makes sure that IBA.count reflects accessor.count properly
				const ibSlice = Math.floor( byteOffset / byteStride );
				const ibCacheKey = 'InterleavedBuffer:' + accessorDef.bufferView + ':' + accessorDef.componentType + ':' + ibSlice + ':' + accessorDef.count;
				let ib = parser.cache.get( ibCacheKey );

				if ( ! ib ) {

					array = new TypedArray( bufferView, ibSlice * byteStride, accessorDef.count * byteStride / elementBytes );

					// Integer parameters to IB/IBA are in array elements, not bytes.
					ib = new InterleavedBuffer( array, byteStride / elementBytes );

					parser.cache.add( ibCacheKey, ib );

				}

				bufferAttribute = new InterleavedBufferAttribute( ib, itemSize, ( byteOffset % byteStride ) / elementBytes, normalized );

			} else {

				if ( bufferView === null ) {

					array = new TypedArray( accessorDef.count * itemSize );

				} else {

					array = new TypedArray( bufferView, byteOffset, accessorDef.count * itemSize );

				}

				bufferAttribute = new BufferAttribute( array, itemSize, normalized );

			}

			// https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#sparse-accessors
			if ( accessorDef.sparse !== undefined ) {

				const itemSizeIndices = WEBGL_TYPE_SIZES.SCALAR;
				const TypedArrayIndices = WEBGL_COMPONENT_TYPES[ accessorDef.sparse.indices.componentType ];

				const byteOffsetIndices = accessorDef.sparse.indices.byteOffset || 0;
				const byteOffsetValues = accessorDef.sparse.values.byteOffset || 0;

				const sparseIndices = new TypedArrayIndices( bufferViews[ 1 ], byteOffsetIndices, accessorDef.sparse.count * itemSizeIndices );
				const sparseValues = new TypedArray( bufferViews[ 2 ], byteOffsetValues, accessorDef.sparse.count * itemSize );

				if ( bufferView !== null ) {

					// Avoid modifying the original ArrayBuffer, if the bufferView wasn't initialized with zeroes.
					bufferAttribute = new BufferAttribute( bufferAttribute.array.slice(), bufferAttribute.itemSize, bufferAttribute.normalized );

				}

				for ( let i = 0, il = sparseIndices.length; i < il; i ++ ) {

					const index = sparseIndices[ i ];

					bufferAttribute.setX( index, sparseValues[ i * itemSize ] );
					if ( itemSize >= 2 ) bufferAttribute.setY( index, sparseValues[ i * itemSize + 1 ] );
					if ( itemSize >= 3 ) bufferAttribute.setZ( index, sparseValues[ i * itemSize + 2 ] );
					if ( itemSize >= 4 ) bufferAttribute.setW( index, sparseValues[ i * itemSize + 3 ] );
					if ( itemSize >= 5 ) throw new Error( 'THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.' );

				}

			}

			return bufferAttribute;

		} );

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#textures
	 * @param {number} textureIndex
	 * @return {Promise<THREE.Texture|null>}
	 */
	loadTexture( textureIndex ) {

		const json = this.json;
		const options = this.options;
		const textureDef = json.textures[ textureIndex ];
		const sourceIndex = textureDef.source;
		const sourceDef = json.images[ sourceIndex ];

		let loader = this.textureLoader;

		if ( sourceDef.uri ) {

			const handler = options.manager.getHandler( sourceDef.uri );
			if ( handler !== null ) loader = handler;

		}

		return this.loadTextureImage( textureIndex, sourceIndex, loader );

	}

	loadTextureImage( textureIndex, sourceIndex, loader ) {

		const parser = this;
		const json = this.json;

		const textureDef = json.textures[ textureIndex ];
		const sourceDef = json.images[ sourceIndex ];

		const cacheKey = ( sourceDef.uri || sourceDef.bufferView ) + ':' + textureDef.sampler;

		if ( this.textureCache[ cacheKey ] ) {

			// See https://github.com/mrdoob/three.js/issues/21559.
			return this.textureCache[ cacheKey ];

		}

		const promise = this.loadImageSource( sourceIndex, loader ).then( function ( texture ) {

			texture.flipY = false;

			texture.name = textureDef.name || sourceDef.name || '';

			if ( texture.name === '' && typeof sourceDef.uri === 'string' && sourceDef.uri.startsWith( 'data:image/' ) === false ) {

				texture.name = sourceDef.uri;

			}

			const samplers = json.samplers || {};
			const sampler = samplers[ textureDef.sampler ] || {};

			texture.magFilter = WEBGL_FILTERS[ sampler.magFilter ] || LinearFilter;
			texture.minFilter = WEBGL_FILTERS[ sampler.minFilter ] || LinearMipmapLinearFilter;
			texture.wrapS = WEBGL_WRAPPINGS[ sampler.wrapS ] || RepeatWrapping;
			texture.wrapT = WEBGL_WRAPPINGS[ sampler.wrapT ] || RepeatWrapping;

			parser.associations.set( texture, { textures: textureIndex } );

			return texture;

		} ).catch( function () {

			return null;

		} );

		this.textureCache[ cacheKey ] = promise;

		return promise;

	}

	loadImageSource( sourceIndex, loader ) {

		const parser = this;
		const json = this.json;
		const options = this.options;

		if ( this.sourceCache[ sourceIndex ] !== undefined ) {

			return this.sourceCache[ sourceIndex ].then( ( texture ) => texture.clone() );

		}

		const sourceDef = json.images[ sourceIndex ];

		const URL = self.URL || self.webkitURL;

		let sourceURI = sourceDef.uri || '';
		let isObjectURL = false;

		if ( sourceDef.bufferView !== undefined ) {

			// Load binary image data from bufferView, if provided.

			sourceURI = parser.getDependency( 'bufferView', sourceDef.bufferView ).then( function ( bufferView ) {

				isObjectURL = true;
				const blob = new Blob( [ bufferView ], { type: sourceDef.mimeType } );
				sourceURI = URL.createObjectURL( blob );
				return sourceURI;

			} );

		} else if ( sourceDef.uri === undefined ) {

			throw new Error( 'THREE.GLTFLoader: Image ' + sourceIndex + ' is missing URI and bufferView' );

		}

		const promise = Promise.resolve( sourceURI ).then( function ( sourceURI ) {

			return new Promise( function ( resolve, reject ) {

				let onLoad = resolve;

				if ( loader.isImageBitmapLoader === true ) {

					onLoad = function ( imageBitmap ) {

						const texture = new Texture( imageBitmap );
						texture.needsUpdate = true;

						resolve( texture );

					};

				}

				loader.load( LoaderUtils.resolveURL( sourceURI, options.path ), onLoad, undefined, reject );

			} );

		} ).then( function ( texture ) {

			// Clean up resources and configure Texture.

			if ( isObjectURL === true ) {

				URL.revokeObjectURL( sourceURI );

			}

			texture.userData.mimeType = sourceDef.mimeType || getImageURIMimeType( sourceDef.uri );

			return texture;

		} ).catch( function ( error ) {

			console.error( 'THREE.GLTFLoader: Couldn\'t load texture', sourceURI );
			throw error;

		} );

		this.sourceCache[ sourceIndex ] = promise;
		return promise;

	}

	/**
	 * Asynchronously assigns a texture to the given material parameters.
	 * @param {Object} materialParams
	 * @param {string} mapName
	 * @param {Object} mapDef
	 * @return {Promise<Texture>}
	 */
	assignTexture( materialParams, mapName, mapDef, colorSpace ) {

		const parser = this;

		return this.getDependency( 'texture', mapDef.index ).then( function ( texture ) {

			if ( ! texture ) return null;

			if ( mapDef.texCoord !== undefined && mapDef.texCoord > 0 ) {

				texture = texture.clone();
				texture.channel = mapDef.texCoord;

			}

			if ( parser.extensions[ EXTENSIONS.KHR_TEXTURE_TRANSFORM ] ) {

				const transform = mapDef.extensions !== undefined ? mapDef.extensions[ EXTENSIONS.KHR_TEXTURE_TRANSFORM ] : undefined;

				if ( transform ) {

					const gltfReference = parser.associations.get( texture );
					texture = parser.extensions[ EXTENSIONS.KHR_TEXTURE_TRANSFORM ].extendTexture( texture, transform );
					parser.associations.set( texture, gltfReference );

				}

			}

			if ( colorSpace !== undefined ) {

				texture.colorSpace = colorSpace;

			}

			materialParams[ mapName ] = texture;

			return texture;

		} );

	}

	/**
	 * Assigns final material to a Mesh, Line, or Points instance. The instance
	 * already has a material (generated from the glTF material options alone)
	 * but reuse of the same glTF material may require multiple threejs materials
	 * to accommodate different primitive types, defines, etc. New materials will
	 * be created if necessary, and reused from a cache.
	 * @param  {Object3D} mesh Mesh, Line, or Points instance.
	 */
	assignFinalMaterial( mesh ) {

		const geometry = mesh.geometry;
		let material = mesh.material;

		const useDerivativeTangents = geometry.attributes.tangent === undefined;
		const useVertexColors = geometry.attributes.color !== undefined;
		const useFlatShading = geometry.attributes.normal === undefined;

		if ( mesh.isPoints ) {

			const cacheKey = 'PointsMaterial:' + material.uuid;

			let pointsMaterial = this.cache.get( cacheKey );

			if ( ! pointsMaterial ) {

				pointsMaterial = new PointsMaterial();
				Material.prototype.copy.call( pointsMaterial, material );
				pointsMaterial.color.copy( material.color );
				pointsMaterial.map = material.map;
				pointsMaterial.sizeAttenuation = false; // glTF spec says points should be 1px

				this.cache.add( cacheKey, pointsMaterial );

			}

			material = pointsMaterial;

		} else if ( mesh.isLine ) {

			const cacheKey = 'LineBasicMaterial:' + material.uuid;

			let lineMaterial = this.cache.get( cacheKey );

			if ( ! lineMaterial ) {

				lineMaterial = new LineBasicMaterial();
				Material.prototype.copy.call( lineMaterial, material );
				lineMaterial.color.copy( material.color );
				lineMaterial.map = material.map;

				this.cache.add( cacheKey, lineMaterial );

			}

			material = lineMaterial;

		}

		// Clone the material if it will be modified
		if ( useDerivativeTangents || useVertexColors || useFlatShading ) {

			let cacheKey = 'ClonedMaterial:' + material.uuid + ':';

			if ( useDerivativeTangents ) cacheKey += 'derivative-tangents:';
			if ( useVertexColors ) cacheKey += 'vertex-colors:';
			if ( useFlatShading ) cacheKey += 'flat-shading:';

			let cachedMaterial = this.cache.get( cacheKey );

			if ( ! cachedMaterial ) {

				cachedMaterial = material.clone();

				if ( useVertexColors ) cachedMaterial.vertexColors = true;
				if ( useFlatShading ) cachedMaterial.flatShading = true;

				if ( useDerivativeTangents ) {

					// https://github.com/mrdoob/three.js/issues/11438#issuecomment-507003995
					if ( cachedMaterial.normalScale ) cachedMaterial.normalScale.y *= - 1;
					if ( cachedMaterial.clearcoatNormalScale ) cachedMaterial.clearcoatNormalScale.y *= - 1;

				}

				this.cache.add( cacheKey, cachedMaterial );

				this.associations.set( cachedMaterial, this.associations.get( material ) );

			}

			material = cachedMaterial;

		}

		mesh.material = material;

	}

	getMaterialType( /* materialIndex */ ) {

		return MeshStandardMaterial;

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#materials
	 * @param {number} materialIndex
	 * @return {Promise<Material>}
	 */
	loadMaterial( materialIndex ) {

		const parser = this;
		const json = this.json;
		const extensions = this.extensions;
		const materialDef = json.materials[ materialIndex ];

		let materialType;
		const materialParams = {};
		const materialExtensions = materialDef.extensions || {};

		const pending = [];

		if ( materialExtensions[ EXTENSIONS.KHR_MATERIALS_UNLIT ] ) {

			const kmuExtension = extensions[ EXTENSIONS.KHR_MATERIALS_UNLIT ];
			materialType = kmuExtension.getMaterialType();
			pending.push( kmuExtension.extendParams( materialParams, materialDef, parser ) );

		} else {

			// Specification:
			// https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#metallic-roughness-material

			const metallicRoughness = materialDef.pbrMetallicRoughness || {};

			materialParams.color = new Color( 1.0, 1.0, 1.0 );
			materialParams.opacity = 1.0;

			if ( Array.isArray( metallicRoughness.baseColorFactor ) ) {

				const array = metallicRoughness.baseColorFactor;

				materialParams.color.setRGB( array[ 0 ], array[ 1 ], array[ 2 ], LinearSRGBColorSpace );
				materialParams.opacity = array[ 3 ];

			}

			if ( metallicRoughness.baseColorTexture !== undefined ) {

				pending.push( parser.assignTexture( materialParams, 'map', metallicRoughness.baseColorTexture, SRGBColorSpace ) );

			}

			materialParams.metalness = metallicRoughness.metallicFactor !== undefined ? metallicRoughness.metallicFactor : 1.0;
			materialParams.roughness = metallicRoughness.roughnessFactor !== undefined ? metallicRoughness.roughnessFactor : 1.0;

			if ( metallicRoughness.metallicRoughnessTexture !== undefined ) {

				pending.push( parser.assignTexture( materialParams, 'metalnessMap', metallicRoughness.metallicRoughnessTexture ) );
				pending.push( parser.assignTexture( materialParams, 'roughnessMap', metallicRoughness.metallicRoughnessTexture ) );

			}

			materialType = this._invokeOne( function ( ext ) {

				return ext.getMaterialType && ext.getMaterialType( materialIndex );

			} );

			pending.push( Promise.all( this._invokeAll( function ( ext ) {

				return ext.extendMaterialParams && ext.extendMaterialParams( materialIndex, materialParams );

			} ) ) );

		}

		if ( materialDef.doubleSided === true ) {

			materialParams.side = DoubleSide;

		}

		const alphaMode = materialDef.alphaMode || ALPHA_MODES.OPAQUE;

		if ( alphaMode === ALPHA_MODES.BLEND ) {

			materialParams.transparent = true;

			// See: https://github.com/mrdoob/three.js/issues/17706
			materialParams.depthWrite = false;

		} else {

			materialParams.transparent = false;

			if ( alphaMode === ALPHA_MODES.MASK ) {

				materialParams.alphaTest = materialDef.alphaCutoff !== undefined ? materialDef.alphaCutoff : 0.5;

			}

		}

		if ( materialDef.normalTexture !== undefined && materialType !== MeshBasicMaterial ) {

			pending.push( parser.assignTexture( materialParams, 'normalMap', materialDef.normalTexture ) );

			materialParams.normalScale = new Vector2( 1, 1 );

			if ( materialDef.normalTexture.scale !== undefined ) {

				const scale = materialDef.normalTexture.scale;

				materialParams.normalScale.set( scale, scale );

			}

		}

		if ( materialDef.occlusionTexture !== undefined && materialType !== MeshBasicMaterial ) {

			pending.push( parser.assignTexture( materialParams, 'aoMap', materialDef.occlusionTexture ) );

			if ( materialDef.occlusionTexture.strength !== undefined ) {

				materialParams.aoMapIntensity = materialDef.occlusionTexture.strength;

			}

		}

		if ( materialDef.emissiveFactor !== undefined && materialType !== MeshBasicMaterial ) {

			const emissiveFactor = materialDef.emissiveFactor;
			materialParams.emissive = new Color().setRGB( emissiveFactor[ 0 ], emissiveFactor[ 1 ], emissiveFactor[ 2 ], LinearSRGBColorSpace );

		}

		if ( materialDef.emissiveTexture !== undefined && materialType !== MeshBasicMaterial ) {

			pending.push( parser.assignTexture( materialParams, 'emissiveMap', materialDef.emissiveTexture, SRGBColorSpace ) );

		}

		return Promise.all( pending ).then( function () {

			const material = new materialType( materialParams );

			if ( materialDef.name ) material.name = materialDef.name;

			assignExtrasToUserData( material, materialDef );

			parser.associations.set( material, { materials: materialIndex } );

			if ( materialDef.extensions ) addUnknownExtensionsToUserData( extensions, material, materialDef );

			return material;

		} );

	}

	/** When Object3D instances are targeted by animation, they need unique names. */
	createUniqueName( originalName ) {

		const sanitizedName = PropertyBinding.sanitizeNodeName( originalName || '' );

		if ( sanitizedName in this.nodeNamesUsed ) {

			return sanitizedName + '_' + ( ++ this.nodeNamesUsed[ sanitizedName ] );

		} else {

			this.nodeNamesUsed[ sanitizedName ] = 0;

			return sanitizedName;

		}

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#geometry
	 *
	 * Creates BufferGeometries from primitives.
	 *
	 * @param {Array<GLTF.Primitive>} primitives
	 * @return {Promise<Array<BufferGeometry>>}
	 */
	loadGeometries( primitives ) {

		const parser = this;
		const extensions = this.extensions;
		const cache = this.primitiveCache;

		function createDracoPrimitive( primitive ) {

			return extensions[ EXTENSIONS.KHR_DRACO_MESH_COMPRESSION ]
				.decodePrimitive( primitive, parser )
				.then( function ( geometry ) {

					return addPrimitiveAttributes( geometry, primitive, parser );

				} );

		}

		const pending = [];

		for ( let i = 0, il = primitives.length; i < il; i ++ ) {

			const primitive = primitives[ i ];
			const cacheKey = createPrimitiveKey( primitive );

			// See if we've already created this geometry
			const cached = cache[ cacheKey ];

			if ( cached ) {

				// Use the cached geometry if it exists
				pending.push( cached.promise );

			} else {

				let geometryPromise;

				if ( primitive.extensions && primitive.extensions[ EXTENSIONS.KHR_DRACO_MESH_COMPRESSION ] ) {

					// Use DRACO geometry if available
					geometryPromise = createDracoPrimitive( primitive );

				} else {

					// Otherwise create a new geometry
					geometryPromise = addPrimitiveAttributes( new BufferGeometry(), primitive, parser );

				}

				// Cache this geometry
				cache[ cacheKey ] = { primitive: primitive, promise: geometryPromise };

				pending.push( geometryPromise );

			}

		}

		return Promise.all( pending );

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#meshes
	 * @param {number} meshIndex
	 * @return {Promise<Group|Mesh|SkinnedMesh>}
	 */
	loadMesh( meshIndex ) {

		const parser = this;
		const json = this.json;
		const extensions = this.extensions;

		const meshDef = json.meshes[ meshIndex ];
		const primitives = meshDef.primitives;

		const pending = [];

		for ( let i = 0, il = primitives.length; i < il; i ++ ) {

			const material = primitives[ i ].material === undefined
				? createDefaultMaterial( this.cache )
				: this.getDependency( 'material', primitives[ i ].material );

			pending.push( material );

		}

		pending.push( parser.loadGeometries( primitives ) );

		return Promise.all( pending ).then( function ( results ) {

			const materials = results.slice( 0, results.length - 1 );
			const geometries = results[ results.length - 1 ];

			const meshes = [];

			for ( let i = 0, il = geometries.length; i < il; i ++ ) {

				const geometry = geometries[ i ];
				const primitive = primitives[ i ];

				// 1. create Mesh

				let mesh;

				const material = materials[ i ];

				if ( primitive.mode === WEBGL_CONSTANTS.TRIANGLES ||
						primitive.mode === WEBGL_CONSTANTS.TRIANGLE_STRIP ||
						primitive.mode === WEBGL_CONSTANTS.TRIANGLE_FAN ||
						primitive.mode === undefined ) {

					// .isSkinnedMesh isn't in glTF spec. See ._markDefs()
					mesh = meshDef.isSkinnedMesh === true
						? new SkinnedMesh( geometry, material )
						: new Mesh( geometry, material );

					if ( mesh.isSkinnedMesh === true ) {

						// normalize skin weights to fix malformed assets (see #15319)
						mesh.normalizeSkinWeights();

					}

					if ( primitive.mode === WEBGL_CONSTANTS.TRIANGLE_STRIP ) {

						mesh.geometry = toTrianglesDrawMode( mesh.geometry, TriangleStripDrawMode );

					} else if ( primitive.mode === WEBGL_CONSTANTS.TRIANGLE_FAN ) {

						mesh.geometry = toTrianglesDrawMode( mesh.geometry, TriangleFanDrawMode );

					}

				} else if ( primitive.mode === WEBGL_CONSTANTS.LINES ) {

					mesh = new LineSegments( geometry, material );

				} else if ( primitive.mode === WEBGL_CONSTANTS.LINE_STRIP ) {

					mesh = new Line( geometry, material );

				} else if ( primitive.mode === WEBGL_CONSTANTS.LINE_LOOP ) {

					mesh = new LineLoop( geometry, material );

				} else if ( primitive.mode === WEBGL_CONSTANTS.POINTS ) {

					mesh = new Points( geometry, material );

				} else {

					throw new Error( 'THREE.GLTFLoader: Primitive mode unsupported: ' + primitive.mode );

				}

				if ( Object.keys( mesh.geometry.morphAttributes ).length > 0 ) {

					updateMorphTargets( mesh, meshDef );

				}

				mesh.name = parser.createUniqueName( meshDef.name || ( 'mesh_' + meshIndex ) );

				assignExtrasToUserData( mesh, meshDef );

				if ( primitive.extensions ) addUnknownExtensionsToUserData( extensions, mesh, primitive );

				parser.assignFinalMaterial( mesh );

				meshes.push( mesh );

			}

			for ( let i = 0, il = meshes.length; i < il; i ++ ) {

				parser.associations.set( meshes[ i ], {
					meshes: meshIndex,
					primitives: i
				} );

			}

			if ( meshes.length === 1 ) {

				if ( meshDef.extensions ) addUnknownExtensionsToUserData( extensions, meshes[ 0 ], meshDef );

				return meshes[ 0 ];

			}

			const group = new Group();

			if ( meshDef.extensions ) addUnknownExtensionsToUserData( extensions, group, meshDef );

			parser.associations.set( group, { meshes: meshIndex } );

			for ( let i = 0, il = meshes.length; i < il; i ++ ) {

				group.add( meshes[ i ] );

			}

			return group;

		} );

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#cameras
	 * @param {number} cameraIndex
	 * @return {Promise<THREE.Camera>}
	 */
	loadCamera( cameraIndex ) {

		let camera;
		const cameraDef = this.json.cameras[ cameraIndex ];
		const params = cameraDef[ cameraDef.type ];

		if ( ! params ) {

			console.warn( 'THREE.GLTFLoader: Missing camera parameters.' );
			return;

		}

		if ( cameraDef.type === 'perspective' ) {

			camera = new PerspectiveCamera( MathUtils.radToDeg( params.yfov ), params.aspectRatio || 1, params.znear || 1, params.zfar || 2e6 );

		} else if ( cameraDef.type === 'orthographic' ) {

			camera = new OrthographicCamera( - params.xmag, params.xmag, params.ymag, - params.ymag, params.znear, params.zfar );

		}

		if ( cameraDef.name ) camera.name = this.createUniqueName( cameraDef.name );

		assignExtrasToUserData( camera, cameraDef );

		return Promise.resolve( camera );

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#skins
	 * @param {number} skinIndex
	 * @return {Promise<Skeleton>}
	 */
	loadSkin( skinIndex ) {

		const skinDef = this.json.skins[ skinIndex ];

		const pending = [];

		for ( let i = 0, il = skinDef.joints.length; i < il; i ++ ) {

			pending.push( this._loadNodeShallow( skinDef.joints[ i ] ) );

		}

		if ( skinDef.inverseBindMatrices !== undefined ) {

			pending.push( this.getDependency( 'accessor', skinDef.inverseBindMatrices ) );

		} else {

			pending.push( null );

		}

		return Promise.all( pending ).then( function ( results ) {

			const inverseBindMatrices = results.pop();
			const jointNodes = results;

			// Note that bones (joint nodes) may or may not be in the
			// scene graph at this time.

			const bones = [];
			const boneInverses = [];

			for ( let i = 0, il = jointNodes.length; i < il; i ++ ) {

				const jointNode = jointNodes[ i ];

				if ( jointNode ) {

					bones.push( jointNode );

					const mat = new Matrix4();

					if ( inverseBindMatrices !== null ) {

						mat.fromArray( inverseBindMatrices.array, i * 16 );

					}

					boneInverses.push( mat );

				} else {

					console.warn( 'THREE.GLTFLoader: Joint "%s" could not be found.', skinDef.joints[ i ] );

				}

			}

			return new Skeleton( bones, boneInverses );

		} );

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#animations
	 * @param {number} animationIndex
	 * @return {Promise<AnimationClip>}
	 */
	loadAnimation( animationIndex ) {

		const json = this.json;
		const parser = this;

		const animationDef = json.animations[ animationIndex ];
		const animationName = animationDef.name ? animationDef.name : 'animation_' + animationIndex;

		const pendingNodes = [];
		const pendingInputAccessors = [];
		const pendingOutputAccessors = [];
		const pendingSamplers = [];
		const pendingTargets = [];

		for ( let i = 0, il = animationDef.channels.length; i < il; i ++ ) {

			const channel = animationDef.channels[ i ];
			const sampler = animationDef.samplers[ channel.sampler ];
			const target = channel.target;
			const name = target.node;
			const input = animationDef.parameters !== undefined ? animationDef.parameters[ sampler.input ] : sampler.input;
			const output = animationDef.parameters !== undefined ? animationDef.parameters[ sampler.output ] : sampler.output;

			if ( target.node === undefined ) continue;

			pendingNodes.push( this.getDependency( 'node', name ) );
			pendingInputAccessors.push( this.getDependency( 'accessor', input ) );
			pendingOutputAccessors.push( this.getDependency( 'accessor', output ) );
			pendingSamplers.push( sampler );
			pendingTargets.push( target );

		}

		return Promise.all( [

			Promise.all( pendingNodes ),
			Promise.all( pendingInputAccessors ),
			Promise.all( pendingOutputAccessors ),
			Promise.all( pendingSamplers ),
			Promise.all( pendingTargets )

		] ).then( function ( dependencies ) {

			const nodes = dependencies[ 0 ];
			const inputAccessors = dependencies[ 1 ];
			const outputAccessors = dependencies[ 2 ];
			const samplers = dependencies[ 3 ];
			const targets = dependencies[ 4 ];

			const tracks = [];

			for ( let i = 0, il = nodes.length; i < il; i ++ ) {

				const node = nodes[ i ];
				const inputAccessor = inputAccessors[ i ];
				const outputAccessor = outputAccessors[ i ];
				const sampler = samplers[ i ];
				const target = targets[ i ];

				if ( node === undefined ) continue;

				if ( node.updateMatrix ) {

					node.updateMatrix();

				}

				const createdTracks = parser._createAnimationTracks( node, inputAccessor, outputAccessor, sampler, target );

				if ( createdTracks ) {

					for ( let k = 0; k < createdTracks.length; k ++ ) {

						tracks.push( createdTracks[ k ] );

					}

				}

			}

			return new AnimationClip( animationName, undefined, tracks );

		} );

	}

	createNodeMesh( nodeIndex ) {

		const json = this.json;
		const parser = this;
		const nodeDef = json.nodes[ nodeIndex ];

		if ( nodeDef.mesh === undefined ) return null;

		return parser.getDependency( 'mesh', nodeDef.mesh ).then( function ( mesh ) {

			const node = parser._getNodeRef( parser.meshCache, nodeDef.mesh, mesh );

			// if weights are provided on the node, override weights on the mesh.
			if ( nodeDef.weights !== undefined ) {

				node.traverse( function ( o ) {

					if ( ! o.isMesh ) return;

					for ( let i = 0, il = nodeDef.weights.length; i < il; i ++ ) {

						o.morphTargetInfluences[ i ] = nodeDef.weights[ i ];

					}

				} );

			}

			return node;

		} );

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#nodes-and-hierarchy
	 * @param {number} nodeIndex
	 * @return {Promise<Object3D>}
	 */
	loadNode( nodeIndex ) {

		const json = this.json;
		const parser = this;

		const nodeDef = json.nodes[ nodeIndex ];

		const nodePending = parser._loadNodeShallow( nodeIndex );

		const childPending = [];
		const childrenDef = nodeDef.children || [];

		for ( let i = 0, il = childrenDef.length; i < il; i ++ ) {

			childPending.push( parser.getDependency( 'node', childrenDef[ i ] ) );

		}

		const skeletonPending = nodeDef.skin === undefined
			? Promise.resolve( null )
			: parser.getDependency( 'skin', nodeDef.skin );

		return Promise.all( [
			nodePending,
			Promise.all( childPending ),
			skeletonPending
		] ).then( function ( results ) {

			const node = results[ 0 ];
			const children = results[ 1 ];
			const skeleton = results[ 2 ];

			if ( skeleton !== null ) {

				// This full traverse should be fine because
				// child glTF nodes have not been added to this node yet.
				node.traverse( function ( mesh ) {

					if ( ! mesh.isSkinnedMesh ) return;

					mesh.bind( skeleton, _identityMatrix );

				} );

			}

			for ( let i = 0, il = children.length; i < il; i ++ ) {

				node.add( children[ i ] );

			}

			return node;

		} );

	}

	// ._loadNodeShallow() parses a single node.
	// skin and child nodes are created and added in .loadNode() (no '_' prefix).
	_loadNodeShallow( nodeIndex ) {

		const json = this.json;
		const extensions = this.extensions;
		const parser = this;

		// This method is called from .loadNode() and .loadSkin().
		// Cache a node to avoid duplication.

		if ( this.nodeCache[ nodeIndex ] !== undefined ) {

			return this.nodeCache[ nodeIndex ];

		}

		const nodeDef = json.nodes[ nodeIndex ];

		// reserve node's name before its dependencies, so the root has the intended name.
		const nodeName = nodeDef.name ? parser.createUniqueName( nodeDef.name ) : '';

		const pending = [];

		const meshPromise = parser._invokeOne( function ( ext ) {

			return ext.createNodeMesh && ext.createNodeMesh( nodeIndex );

		} );

		if ( meshPromise ) {

			pending.push( meshPromise );

		}

		if ( nodeDef.camera !== undefined ) {

			pending.push( parser.getDependency( 'camera', nodeDef.camera ).then( function ( camera ) {

				return parser._getNodeRef( parser.cameraCache, nodeDef.camera, camera );

			} ) );

		}

		parser._invokeAll( function ( ext ) {

			return ext.createNodeAttachment && ext.createNodeAttachment( nodeIndex );

		} ).forEach( function ( promise ) {

			pending.push( promise );

		} );

		this.nodeCache[ nodeIndex ] = Promise.all( pending ).then( function ( objects ) {

			let node;

			// .isBone isn't in glTF spec. See ._markDefs
			if ( nodeDef.isBone === true ) {

				node = new Bone();

			} else if ( objects.length > 1 ) {

				node = new Group();

			} else if ( objects.length === 1 ) {

				node = objects[ 0 ];

			} else {

				node = new Object3D();

			}

			if ( node !== objects[ 0 ] ) {

				for ( let i = 0, il = objects.length; i < il; i ++ ) {

					node.add( objects[ i ] );

				}

			}

			if ( nodeDef.name ) {

				node.userData.name = nodeDef.name;
				node.name = nodeName;

			}

			assignExtrasToUserData( node, nodeDef );

			if ( nodeDef.extensions ) addUnknownExtensionsToUserData( extensions, node, nodeDef );

			if ( nodeDef.matrix !== undefined ) {

				const matrix = new Matrix4();
				matrix.fromArray( nodeDef.matrix );
				node.applyMatrix4( matrix );

			} else {

				if ( nodeDef.translation !== undefined ) {

					node.position.fromArray( nodeDef.translation );

				}

				if ( nodeDef.rotation !== undefined ) {

					node.quaternion.fromArray( nodeDef.rotation );

				}

				if ( nodeDef.scale !== undefined ) {

					node.scale.fromArray( nodeDef.scale );

				}

			}

			if ( ! parser.associations.has( node ) ) {

				parser.associations.set( node, {} );

			}

			parser.associations.get( node ).nodes = nodeIndex;

			return node;

		} );

		return this.nodeCache[ nodeIndex ];

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#scenes
	 * @param {number} sceneIndex
	 * @return {Promise<Group>}
	 */
	loadScene( sceneIndex ) {

		const extensions = this.extensions;
		const sceneDef = this.json.scenes[ sceneIndex ];
		const parser = this;

		// Loader returns Group, not Scene.
		// See: https://github.com/mrdoob/three.js/issues/18342#issuecomment-578981172
		const scene = new Group();
		if ( sceneDef.name ) scene.name = parser.createUniqueName( sceneDef.name );

		assignExtrasToUserData( scene, sceneDef );

		if ( sceneDef.extensions ) addUnknownExtensionsToUserData( extensions, scene, sceneDef );

		const nodeIds = sceneDef.nodes || [];

		const pending = [];

		for ( let i = 0, il = nodeIds.length; i < il; i ++ ) {

			pending.push( parser.getDependency( 'node', nodeIds[ i ] ) );

		}

		return Promise.all( pending ).then( function ( nodes ) {

			for ( let i = 0, il = nodes.length; i < il; i ++ ) {

				scene.add( nodes[ i ] );

			}

			// Removes dangling associations, associations that reference a node that
			// didn't make it into the scene.
			const reduceAssociations = ( node ) => {

				const reducedAssociations = new Map();

				for ( const [ key, value ] of parser.associations ) {

					if ( key instanceof Material || key instanceof Texture ) {

						reducedAssociations.set( key, value );

					}

				}

				node.traverse( ( node ) => {

					const mappings = parser.associations.get( node );

					if ( mappings != null ) {

						reducedAssociations.set( node, mappings );

					}

				} );

				return reducedAssociations;

			};

			parser.associations = reduceAssociations( scene );

			return scene;

		} );

	}

	_createAnimationTracks( node, inputAccessor, outputAccessor, sampler, target ) {

		const tracks = [];

		const targetName = node.name ? node.name : node.uuid;
		const targetNames = [];

		if ( PATH_PROPERTIES[ target.path ] === PATH_PROPERTIES.weights ) {

			node.traverse( function ( object ) {

				if ( object.morphTargetInfluences ) {

					targetNames.push( object.name ? object.name : object.uuid );

				}

			} );

		} else {

			targetNames.push( targetName );

		}

		let TypedKeyframeTrack;

		switch ( PATH_PROPERTIES[ target.path ] ) {

			case PATH_PROPERTIES.weights:

				TypedKeyframeTrack = NumberKeyframeTrack;
				break;

			case PATH_PROPERTIES.rotation:

				TypedKeyframeTrack = QuaternionKeyframeTrack;
				break;

			case PATH_PROPERTIES.position:
			case PATH_PROPERTIES.scale:

				TypedKeyframeTrack = VectorKeyframeTrack;
				break;

			default:

				switch ( outputAccessor.itemSize ) {

					case 1:
						TypedKeyframeTrack = NumberKeyframeTrack;
						break;
					case 2:
					case 3:
					default:
						TypedKeyframeTrack = VectorKeyframeTrack;
						break;

				}

				break;

		}

		const interpolation = sampler.interpolation !== undefined ? INTERPOLATION[ sampler.interpolation ] : InterpolateLinear;


		const outputArray = this._getArrayFromAccessor( outputAccessor );

		for ( let j = 0, jl = targetNames.length; j < jl; j ++ ) {

			const track = new TypedKeyframeTrack(
				targetNames[ j ] + '.' + PATH_PROPERTIES[ target.path ],
				inputAccessor.array,
				outputArray,
				interpolation
			);

			// Override interpolation with custom factory method.
			if ( sampler.interpolation === 'CUBICSPLINE' ) {

				this._createCubicSplineTrackInterpolant( track );

			}

			tracks.push( track );

		}

		return tracks;

	}

	_getArrayFromAccessor( accessor ) {

		let outputArray = accessor.array;

		if ( accessor.normalized ) {

			const scale = getNormalizedComponentScale( outputArray.constructor );
			const scaled = new Float32Array( outputArray.length );

			for ( let j = 0, jl = outputArray.length; j < jl; j ++ ) {

				scaled[ j ] = outputArray[ j ] * scale;

			}

			outputArray = scaled;

		}

		return outputArray;

	}

	_createCubicSplineTrackInterpolant( track ) {

		track.createInterpolant = function InterpolantFactoryMethodGLTFCubicSpline( result ) {

			// A CUBICSPLINE keyframe in glTF has three output values for each input value,
			// representing inTangent, splineVertex, and outTangent. As a result, track.getValueSize()
			// must be divided by three to get the interpolant's sampleSize argument.

			const interpolantType = ( this instanceof QuaternionKeyframeTrack ) ? GLTFCubicSplineQuaternionInterpolant : GLTFCubicSplineInterpolant;

			return new interpolantType( this.times, this.values, this.getValueSize() / 3, result );

		};

		// Mark as CUBICSPLINE. `track.getInterpolation()` doesn't support custom interpolants.
		track.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline = true;

	}

}

/**
 * @param {BufferGeometry} geometry
 * @param {GLTF.Primitive} primitiveDef
 * @param {GLTFParser} parser
 */
function computeBounds( geometry, primitiveDef, parser ) {

	const attributes = primitiveDef.attributes;

	const box = new Box3();

	if ( attributes.POSITION !== undefined ) {

		const accessor = parser.json.accessors[ attributes.POSITION ];

		const min = accessor.min;
		const max = accessor.max;

		// glTF requires 'min' and 'max', but VRM (which extends glTF) currently ignores that requirement.

		if ( min !== undefined && max !== undefined ) {

			box.set(
				new Vector3( min[ 0 ], min[ 1 ], min[ 2 ] ),
				new Vector3( max[ 0 ], max[ 1 ], max[ 2 ] )
			);

			if ( accessor.normalized ) {

				const boxScale = getNormalizedComponentScale( WEBGL_COMPONENT_TYPES[ accessor.componentType ] );
				box.min.multiplyScalar( boxScale );
				box.max.multiplyScalar( boxScale );

			}

		} else {

			console.warn( 'THREE.GLTFLoader: Missing min/max properties for accessor POSITION.' );

			return;

		}

	} else {

		return;

	}

	const targets = primitiveDef.targets;

	if ( targets !== undefined ) {

		const maxDisplacement = new Vector3();
		const vector = new Vector3();

		for ( let i = 0, il = targets.length; i < il; i ++ ) {

			const target = targets[ i ];

			if ( target.POSITION !== undefined ) {

				const accessor = parser.json.accessors[ target.POSITION ];
				const min = accessor.min;
				const max = accessor.max;

				// glTF requires 'min' and 'max', but VRM (which extends glTF) currently ignores that requirement.

				if ( min !== undefined && max !== undefined ) {

					// we need to get max of absolute components because target weight is [-1,1]
					vector.setX( Math.max( Math.abs( min[ 0 ] ), Math.abs( max[ 0 ] ) ) );
					vector.setY( Math.max( Math.abs( min[ 1 ] ), Math.abs( max[ 1 ] ) ) );
					vector.setZ( Math.max( Math.abs( min[ 2 ] ), Math.abs( max[ 2 ] ) ) );


					if ( accessor.normalized ) {

						const boxScale = getNormalizedComponentScale( WEBGL_COMPONENT_TYPES[ accessor.componentType ] );
						vector.multiplyScalar( boxScale );

					}

					// Note: this assumes that the sum of all weights is at most 1. This isn't quite correct - it's more conservative
					// to assume that each target can have a max weight of 1. However, for some use cases - notably, when morph targets
					// are used to implement key-frame animations and as such only two are active at a time - this results in very large
					// boxes. So for now we make a box that's sometimes a touch too small but is hopefully mostly of reasonable size.
					maxDisplacement.max( vector );

				} else {

					console.warn( 'THREE.GLTFLoader: Missing min/max properties for accessor POSITION.' );

				}

			}

		}

		// As per comment above this box isn't conservative, but has a reasonable size for a very large number of morph targets.
		box.expandByVector( maxDisplacement );

	}

	geometry.boundingBox = box;

	const sphere = new Sphere();

	box.getCenter( sphere.center );
	sphere.radius = box.min.distanceTo( box.max ) / 2;

	geometry.boundingSphere = sphere;

}

/**
 * @param {BufferGeometry} geometry
 * @param {GLTF.Primitive} primitiveDef
 * @param {GLTFParser} parser
 * @return {Promise<BufferGeometry>}
 */
function addPrimitiveAttributes( geometry, primitiveDef, parser ) {

	const attributes = primitiveDef.attributes;

	const pending = [];

	function assignAttributeAccessor( accessorIndex, attributeName ) {

		return parser.getDependency( 'accessor', accessorIndex )
			.then( function ( accessor ) {

				geometry.setAttribute( attributeName, accessor );

			} );

	}

	for ( const gltfAttributeName in attributes ) {

		const threeAttributeName = ATTRIBUTES[ gltfAttributeName ] || gltfAttributeName.toLowerCase();

		// Skip attributes already provided by e.g. Draco extension.
		if ( threeAttributeName in geometry.attributes ) continue;

		pending.push( assignAttributeAccessor( attributes[ gltfAttributeName ], threeAttributeName ) );

	}

	if ( primitiveDef.indices !== undefined && ! geometry.index ) {

		const accessor = parser.getDependency( 'accessor', primitiveDef.indices ).then( function ( accessor ) {

			geometry.setIndex( accessor );

		} );

		pending.push( accessor );

	}

	if ( ColorManagement.workingColorSpace !== LinearSRGBColorSpace && 'COLOR_0' in attributes ) {

		console.warn( `THREE.GLTFLoader: Converting vertex colors from "srgb-linear" to "${ColorManagement.workingColorSpace}" not supported.` );

	}

	assignExtrasToUserData( geometry, primitiveDef );

	computeBounds( geometry, primitiveDef, parser );

	return Promise.all( pending ).then( function () {

		return primitiveDef.targets !== undefined
			? addMorphTargets( geometry, primitiveDef.targets, parser )
			: geometry;

	} );

}

/**
 * @webxr-input-profiles/motion-controllers 1.0.0 https://github.com/immersive-web/webxr-input-profiles
 */

const Constants = {
  Handedness: Object.freeze({
    NONE: 'none',
    LEFT: 'left',
    RIGHT: 'right'
  }),

  ComponentState: Object.freeze({
    DEFAULT: 'default',
    TOUCHED: 'touched',
    PRESSED: 'pressed'
  }),

  ComponentProperty: Object.freeze({
    BUTTON: 'button',
    X_AXIS: 'xAxis',
    Y_AXIS: 'yAxis',
    STATE: 'state'
  }),

  ComponentType: Object.freeze({
    TRIGGER: 'trigger',
    SQUEEZE: 'squeeze',
    TOUCHPAD: 'touchpad',
    THUMBSTICK: 'thumbstick',
    BUTTON: 'button'
  }),

  ButtonTouchThreshold: 0.05,

  AxisTouchThreshold: 0.1,

  VisualResponseProperty: Object.freeze({
    TRANSFORM: 'transform',
    VISIBILITY: 'visibility'
  })
};

/**
 * @description Static helper function to fetch a JSON file and turn it into a JS object
 * @param {string} path - Path to JSON file to be fetched
 */
async function fetchJsonFile(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(response.statusText);
  } else {
    return response.json();
  }
}

async function fetchProfilesList(basePath) {
  if (!basePath) {
    throw new Error('No basePath supplied');
  }

  const profileListFileName = 'profilesList.json';
  const profilesList = await fetchJsonFile(`${basePath}/${profileListFileName}`);
  return profilesList;
}

async function fetchProfile(xrInputSource, basePath, defaultProfile = null, getAssetPath = true) {
  if (!xrInputSource) {
    throw new Error('No xrInputSource supplied');
  }

  if (!basePath) {
    throw new Error('No basePath supplied');
  }

  // Get the list of profiles
  const supportedProfilesList = await fetchProfilesList(basePath);

  // Find the relative path to the first requested profile that is recognized
  let match;
  xrInputSource.profiles.some((profileId) => {
    const supportedProfile = supportedProfilesList[profileId];
    if (supportedProfile) {
      match = {
        profileId,
        profilePath: `${basePath}/${supportedProfile.path}`,
        deprecated: !!supportedProfile.deprecated
      };
    }
    return !!match;
  });

  if (!match) {
    if (!defaultProfile) {
      throw new Error('No matching profile name found');
    }

    const supportedProfile = supportedProfilesList[defaultProfile];
    if (!supportedProfile) {
      throw new Error(`No matching profile name found and default profile "${defaultProfile}" missing.`);
    }

    match = {
      profileId: defaultProfile,
      profilePath: `${basePath}/${supportedProfile.path}`,
      deprecated: !!supportedProfile.deprecated
    };
  }

  const profile = await fetchJsonFile(match.profilePath);

  let assetPath;
  if (getAssetPath) {
    let layout;
    if (xrInputSource.handedness === 'any') {
      layout = profile.layouts[Object.keys(profile.layouts)[0]];
    } else {
      layout = profile.layouts[xrInputSource.handedness];
    }
    if (!layout) {
      throw new Error(
        `No matching handedness, ${xrInputSource.handedness}, in profile ${match.profileId}`
      );
    }

    if (layout.assetPath) {
      assetPath = match.profilePath.replace('profile.json', layout.assetPath);
    }
  }

  return { profile, assetPath };
}

/** @constant {Object} */
const defaultComponentValues = {
  xAxis: 0,
  yAxis: 0,
  button: 0,
  state: Constants.ComponentState.DEFAULT
};

/**
 * @description Converts an X, Y coordinate from the range -1 to 1 (as reported by the Gamepad
 * API) to the range 0 to 1 (for interpolation). Also caps the X, Y values to be bounded within
 * a circle. This ensures that thumbsticks are not animated outside the bounds of their physical
 * range of motion and touchpads do not report touch locations off their physical bounds.
 * @param {number} x The original x coordinate in the range -1 to 1
 * @param {number} y The original y coordinate in the range -1 to 1
 */
function normalizeAxes(x = 0, y = 0) {
  let xAxis = x;
  let yAxis = y;

  // Determine if the point is outside the bounds of the circle
  // and, if so, place it on the edge of the circle
  const hypotenuse = Math.sqrt((x * x) + (y * y));
  if (hypotenuse > 1) {
    const theta = Math.atan2(y, x);
    xAxis = Math.cos(theta);
    yAxis = Math.sin(theta);
  }

  // Scale and move the circle so values are in the interpolation range.  The circle's origin moves
  // from (0, 0) to (0.5, 0.5). The circle's radius scales from 1 to be 0.5.
  const result = {
    normalizedXAxis: (xAxis * 0.5) + 0.5,
    normalizedYAxis: (yAxis * 0.5) + 0.5
  };
  return result;
}

/**
 * Contains the description of how the 3D model should visually respond to a specific user input.
 * This is accomplished by initializing the object with the name of a node in the 3D model and
 * property that need to be modified in response to user input, the name of the nodes representing
 * the allowable range of motion, and the name of the input which triggers the change. In response
 * to the named input changing, this object computes the appropriate weighting to use for
 * interpolating between the range of motion nodes.
 */
class VisualResponse {
  constructor(visualResponseDescription) {
    this.componentProperty = visualResponseDescription.componentProperty;
    this.states = visualResponseDescription.states;
    this.valueNodeName = visualResponseDescription.valueNodeName;
    this.valueNodeProperty = visualResponseDescription.valueNodeProperty;

    if (this.valueNodeProperty === Constants.VisualResponseProperty.TRANSFORM) {
      this.minNodeName = visualResponseDescription.minNodeName;
      this.maxNodeName = visualResponseDescription.maxNodeName;
    }

    // Initializes the response's current value based on default data
    this.value = 0;
    this.updateFromComponent(defaultComponentValues);
  }

  /**
   * Computes the visual response's interpolation weight based on component state
   * @param {Object} componentValues - The component from which to update
   * @param {number} xAxis - The reported X axis value of the component
   * @param {number} yAxis - The reported Y axis value of the component
   * @param {number} button - The reported value of the component's button
   * @param {string} state - The component's active state
   */
  updateFromComponent({
    xAxis, yAxis, button, state
  }) {
    const { normalizedXAxis, normalizedYAxis } = normalizeAxes(xAxis, yAxis);
    switch (this.componentProperty) {
      case Constants.ComponentProperty.X_AXIS:
        this.value = (this.states.includes(state)) ? normalizedXAxis : 0.5;
        break;
      case Constants.ComponentProperty.Y_AXIS:
        this.value = (this.states.includes(state)) ? normalizedYAxis : 0.5;
        break;
      case Constants.ComponentProperty.BUTTON:
        this.value = (this.states.includes(state)) ? button : 0;
        break;
      case Constants.ComponentProperty.STATE:
        if (this.valueNodeProperty === Constants.VisualResponseProperty.VISIBILITY) {
          this.value = (this.states.includes(state));
        } else {
          this.value = this.states.includes(state) ? 1.0 : 0.0;
        }
        break;
      default:
        throw new Error(`Unexpected visualResponse componentProperty ${this.componentProperty}`);
    }
  }
}

class Component {
  /**
   * @param {Object} componentId - Id of the component
   * @param {Object} componentDescription - Description of the component to be created
   */
  constructor(componentId, componentDescription) {
    if (!componentId
     || !componentDescription
     || !componentDescription.visualResponses
     || !componentDescription.gamepadIndices
     || Object.keys(componentDescription.gamepadIndices).length === 0) {
      throw new Error('Invalid arguments supplied');
    }

    this.id = componentId;
    this.type = componentDescription.type;
    this.rootNodeName = componentDescription.rootNodeName;
    this.touchPointNodeName = componentDescription.touchPointNodeName;

    // Build all the visual responses for this component
    this.visualResponses = {};
    Object.keys(componentDescription.visualResponses).forEach((responseName) => {
      const visualResponse = new VisualResponse(componentDescription.visualResponses[responseName]);
      this.visualResponses[responseName] = visualResponse;
    });

    // Set default values
    this.gamepadIndices = Object.assign({}, componentDescription.gamepadIndices);

    this.values = {
      state: Constants.ComponentState.DEFAULT,
      button: (this.gamepadIndices.button !== undefined) ? 0 : undefined,
      xAxis: (this.gamepadIndices.xAxis !== undefined) ? 0 : undefined,
      yAxis: (this.gamepadIndices.yAxis !== undefined) ? 0 : undefined
    };
  }

  get data() {
    const data = { id: this.id, ...this.values };
    return data;
  }

  /**
   * @description Poll for updated data based on current gamepad state
   * @param {Object} gamepad - The gamepad object from which the component data should be polled
   */
  updateFromGamepad(gamepad) {
    // Set the state to default before processing other data sources
    this.values.state = Constants.ComponentState.DEFAULT;

    // Get and normalize button
    if (this.gamepadIndices.button !== undefined
        && gamepad.buttons.length > this.gamepadIndices.button) {
      const gamepadButton = gamepad.buttons[this.gamepadIndices.button];
      this.values.button = gamepadButton.value;
      this.values.button = (this.values.button < 0) ? 0 : this.values.button;
      this.values.button = (this.values.button > 1) ? 1 : this.values.button;

      // Set the state based on the button
      if (gamepadButton.pressed || this.values.button === 1) {
        this.values.state = Constants.ComponentState.PRESSED;
      } else if (gamepadButton.touched || this.values.button > Constants.ButtonTouchThreshold) {
        this.values.state = Constants.ComponentState.TOUCHED;
      }
    }

    // Get and normalize x axis value
    if (this.gamepadIndices.xAxis !== undefined
        && gamepad.axes.length > this.gamepadIndices.xAxis) {
      this.values.xAxis = gamepad.axes[this.gamepadIndices.xAxis];
      this.values.xAxis = (this.values.xAxis < -1) ? -1 : this.values.xAxis;
      this.values.xAxis = (this.values.xAxis > 1) ? 1 : this.values.xAxis;

      // If the state is still default, check if the xAxis makes it touched
      if (this.values.state === Constants.ComponentState.DEFAULT
        && Math.abs(this.values.xAxis) > Constants.AxisTouchThreshold) {
        this.values.state = Constants.ComponentState.TOUCHED;
      }
    }

    // Get and normalize Y axis value
    if (this.gamepadIndices.yAxis !== undefined
        && gamepad.axes.length > this.gamepadIndices.yAxis) {
      this.values.yAxis = gamepad.axes[this.gamepadIndices.yAxis];
      this.values.yAxis = (this.values.yAxis < -1) ? -1 : this.values.yAxis;
      this.values.yAxis = (this.values.yAxis > 1) ? 1 : this.values.yAxis;

      // If the state is still default, check if the yAxis makes it touched
      if (this.values.state === Constants.ComponentState.DEFAULT
        && Math.abs(this.values.yAxis) > Constants.AxisTouchThreshold) {
        this.values.state = Constants.ComponentState.TOUCHED;
      }
    }

    // Update the visual response weights based on the current component data
    Object.values(this.visualResponses).forEach((visualResponse) => {
      visualResponse.updateFromComponent(this.values);
    });
  }
}

/**
  * @description Builds a motion controller with components and visual responses based on the
  * supplied profile description. Data is polled from the xrInputSource's gamepad.
  * @author Nell Waliczek / https://github.com/NellWaliczek
*/
class MotionController {
  /**
   * @param {Object} xrInputSource - The XRInputSource to build the MotionController around
   * @param {Object} profile - The best matched profile description for the supplied xrInputSource
   * @param {Object} assetUrl
   */
  constructor(xrInputSource, profile, assetUrl) {
    if (!xrInputSource) {
      throw new Error('No xrInputSource supplied');
    }

    if (!profile) {
      throw new Error('No profile supplied');
    }

    this.xrInputSource = xrInputSource;
    this.assetUrl = assetUrl;
    this.id = profile.profileId;

    // Build child components as described in the profile description
    this.layoutDescription = profile.layouts[xrInputSource.handedness];
    this.components = {};
    Object.keys(this.layoutDescription.components).forEach((componentId) => {
      const componentDescription = this.layoutDescription.components[componentId];
      this.components[componentId] = new Component(componentId, componentDescription);
    });

    // Initialize components based on current gamepad state
    this.updateFromGamepad();
  }

  get gripSpace() {
    return this.xrInputSource.gripSpace;
  }

  get targetRaySpace() {
    return this.xrInputSource.targetRaySpace;
  }

  /**
   * @description Returns a subset of component data for simplified debugging
   */
  get data() {
    const data = [];
    Object.values(this.components).forEach((component) => {
      data.push(component.data);
    });
    return data;
  }

  /**
   * @description Poll for updated data based on current gamepad state
   */
  updateFromGamepad() {
    Object.values(this.components).forEach((component) => {
      component.updateFromGamepad(this.xrInputSource.gamepad);
    });
  }
}

const DEFAULT_PROFILES_PATH = 'https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets@1.0/dist/profiles';
const DEFAULT_PROFILE = 'generic-trigger';

class XRControllerModel extends Object3D {

    constructor() {

        super();

        this.motionController = null;
        this.envMap = null;

    }

    setEnvironmentMap( envMap ) {

        if ( this.envMap == envMap ) {

            return this;

        }

        this.envMap = envMap;
        this.traverse( ( child ) => {

            if ( child.isMesh ) {

                child.material.envMap = this.envMap;
                child.material.needsUpdate = true;

            }

        } );

        return this;

    }

	/**
	 * Polls data from the XRInputSource and updates the model's components to
     * match the real world data
	 */
    updateMatrixWorld( force ) {

        super.updateMatrixWorld( force );

        if ( ! this.motionController ) return;

		// Cause the MotionController to poll the Gamepad for data
        this.motionController.updateFromGamepad();

		// Update the 3D model to reflect the button, thumbstick, and touchpad
        // state
        Object.values(this.motionController.components).forEach((component) => {

			// Update node data based on the visual responses' current states
            Object.values(component.visualResponses).forEach((visualResponse)=>{

                const { valueNode, minNode, maxNode, value, valueNodeProperty }
                    = visualResponse;

				// Skip if the visual response node is not found. No error is
                // needed, because it will have been reported at load time.
                if ( ! valueNode ) return;

				// Calculate the new properties based on the weight supplied
                if(valueNodeProperty === Constants
                        .VisualResponseProperty.VISIBILITY) {
                    valueNode.visible = value;
                } else if(valueNodeProperty === Constants
                        .VisualResponseProperty.TRANSFORM) {
                    valueNode.quaternion.slerpQuaternions(
                        minNode.quaternion,
                        maxNode.quaternion,
                        value
                    );
                    valueNode.position.lerpVectors(
                        minNode.position,
                        maxNode.position,
                        value
                    );
                }
            } );
        } );
    }
}

/**
 * Walks the model's tree to find the nodes needed to animate the components and
 * saves them to the motionContoller components for use in the frame loop. When
 * touchpads are found, attaches a touch dot to them.
 */
function findNodes( motionController, scene ) {

	// Loop through the components and find the nodes needed for each
    // components' visual responses
    Object.values( motionController.components ).forEach( ( component ) => {

        const { type, touchPointNodeName, visualResponses } = component;

        if ( type === Constants.ComponentType.TOUCHPAD ) {

            component.touchPointNode =scene.getObjectByName(touchPointNodeName);
            if(component.touchPointNode) {

				// Attach a touch dot to the touchpad.
                const sphereGeometry = new SphereGeometry( 0.001 );
                const material = new MeshBasicMaterial({ color: 0x0000FF });
                const sphere = new Mesh(sphereGeometry, material);
                component.touchPointNode.add(sphere);

            } else {

                console.warn( 'Could not find touch dot, '
                    + component.touchPointNodeName + ', in touchpad component '
                    + component.id);

            }

        }

		// Loop through all the visual responses to be applied to this component
        Object.values( visualResponses ).forEach( ( visualResponse ) => {

            const { valueNodeName, minNodeName, maxNodeName, valueNodeProperty }
                = visualResponse;

			// If animating a transform, find the two nodes to be interpolated
            // between.
            if ( valueNodeProperty === Constants
                    .VisualResponseProperty.TRANSFORM ) {
                visualResponse.minNode = scene.getObjectByName( minNodeName );
                visualResponse.maxNode = scene.getObjectByName( maxNodeName );

				// If the extents cannot be found, skip this animation
                if ( ! visualResponse.minNode ) {
                    console.warn(`Could not find ${minNodeName} in the model`);
                    return;
                }

                if ( ! visualResponse.maxNode ) {
                    console.warn(`Could not find ${maxNodeName} in the model`);
                    return;
                }
            }

			// If the target node cannot be found, skip this animation
            visualResponse.valueNode = scene.getObjectByName( valueNodeName );
            if ( ! visualResponse.valueNode ) {
                console.warn( `Could not find ${valueNodeName} in the model` );
            }
        } );
    } );
}

function addAssetSceneToControllerModel( controllerModel, scene ) {

	// Find the nodes needed for animation and cache them on the
    // motionController.
    findNodes( controllerModel.motionController, scene );

	// Apply any environment map that the mesh already has set.
    if ( controllerModel.envMap ) {

        scene.traverse( ( child ) => {

            if ( child.isMesh ) {

                child.material.envMap = controllerModel.envMap;
                child.material.needsUpdate = true;

            }

        } );

    }

	// Add the glTF scene to the controllerModel.
    controllerModel.add( scene );

}

class XRControllerModelFactory {

    constructor( gltfLoader = null ) {

        this.gltfLoader = gltfLoader;
        this.path = DEFAULT_PROFILES_PATH;
        this._assetCache = {};

		// If a GLTFLoader wasn't supplied to the constructor create a new one.
        if ( ! this.gltfLoader ) {

            this.gltfLoader = new GLTFLoader();

        }

    }

    createControllerModel( xrInputSource ) {

        const controllerModel = new XRControllerModel();
        let scene = null;

        if(xrInputSource.targetRayMode !== 'tracked-pointer'
            || ! xrInputSource.gamepad ) return;

        fetchProfile( xrInputSource, this.path, DEFAULT_PROFILE )
            .then( ( { profile, assetPath } ) => {

                controllerModel.motionController = new MotionController(
                    xrInputSource,
                    profile,
                    assetPath
                );

                const cachedAsset = this._assetCache[
                    controllerModel.motionController.assetUrl];
                if ( cachedAsset ) {
                    scene = cachedAsset.scene.clone();
                    addAssetSceneToControllerModel( controllerModel, scene );
                } else {
                    if ( ! this.gltfLoader ) {
                        throw new Error( 'GLTFLoader not set.' );
                    }

                    this.gltfLoader.setPath( '' );
                    this.gltfLoader.load(controllerModel.motionController
                        .assetUrl, ( asset ) => {

                        this._assetCache[controllerModel.motionController
                            .assetUrl] = asset;

                        scene = asset.scene.clone();

                        addAssetSceneToControllerModel(controllerModel, scene);

                    },
                    null,
                    () => {
                        throw new Error('Asset '
                            + controllerModel.motionController.assetUrl
                            + ' missing or malformed.');
                    } );
                }
            } ).catch( ( err ) => {
                console.warn( err );
            } );
        return controllerModel;
    }
}

const DEFAULT_HAND_PROFILE_PATH = 'https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets@1.0/dist/profiles/generic-hand/';
const CONTACT_DISTANCE = 0.015;
const SEPARATE_DISTANCE = 0.025;

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

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */


/* global nipplejs */
const controllerModelFactory = new XRControllerModelFactory();
const handModelFactory = new XRHandModelFactory();

//Provides Polling for XR Input Sources, Keyboard, or Mobile Touch Screen inputs
class InputHandler {
    init(container, renderer, deviceType) {
        this._container = container;
        this._renderer = renderer;
        this._renderer.domElement.tabIndex = "1";
        this._xrInputDevices = {};
        for(let type in XRInputDeviceTypes) {
            this._xrInputDevices[type] = {};
        }
        this._pointerPosition = new Vector2();
        this._pointerPressed = false;
        this._keysPressed = new Set();
        this._keyCodesPressed = new Set();
        this._screenTouched = false;
        this._joystickAngle = 0;
        this._joystickDistance = 0;
        this._container.style.position = 'relative';
        this._createExtraControls();
        this._addEventListeners(deviceType);
    }

    _addEventListeners(deviceType) {
        if(deviceType == "XR") {
            //XR Event Listeners
            this._renderer.xr.addEventListener("sessionstart", () => {
                this._onXRSessionStart();
            });
            this._renderer.xr.addEventListener("sessionend", () => {
                this._onXRSessionEnd();
            });
        } else if (deviceType == "POINTER") {
            //POINTER Event Listeners
            this._renderer.domElement.addEventListener('keydown', (event) => {
                this._keysPressed.add(event.key);
                this._keyCodesPressed.add(event.code);
            });
            this._renderer.domElement.addEventListener('keyup', (event) => {
                this._keysPressed.delete(event.key);
                this._keyCodesPressed.delete(event.code);
            });
            window.addEventListener('blur', () => {
                this._keysPressed.clear();
                this._keyCodesPressed.clear();
            });
            this._renderer.domElement.addEventListener( 'mousedown', () => {
                this._pointerPressed = true;
            });
            this._renderer.domElement.addEventListener( 'mouseup', () => {
                this._pointerPressed = false;
            });
            this._renderer.domElement.addEventListener( 'mousemove', (event) =>{
                let rect = event.target.getBoundingClientRect();
                this._pointerPosition.x = ((event.clientX - rect.left)
                    / this._renderer.domElement.clientWidth) * 2 - 1;
                this._pointerPosition.y = -((event.clientY - rect.top)
                    / this._renderer.domElement.clientHeight) * 2 + 1;
            });
            this._container.addEventListener('mouseup', () => {
                this._renderer.domElement.focus();
            });
        } else if(deviceType == "TOUCH") {
            //TOUCH Event Listeners
            this._renderer.domElement.addEventListener('touchstart', () => {
                this._screenTouched = true;
                let rect = event.target.getBoundingClientRect();
                this._pointerPosition.x = ((event.touches[0].clientX -rect.left)
                    / this._renderer.domElement.clientWidth) * 2 - 1;
                this._pointerPosition.y = -((event.touches[0].clientY -rect.top)
                    / this._renderer.domElement.clientHeight) * 2 + 1;
            });
            this._renderer.domElement.addEventListener('touchend', () => {
                this._screenTouched = false;
            });
            this._renderer.domElement.addEventListener( 'touchmove', (event) =>{
                let rect = event.target.getBoundingClientRect();
                this._pointerPosition.x = ((event.touches[0].clientX -rect.left)
                    / this._renderer.domElement.clientWidth) * 2 - 1;
                this._pointerPosition.y = -((event.touches[0].clientY -rect.top)
                    / this._renderer.domElement.clientHeight) * 2 + 1;
            });
            //Prevent zoom on double tapping the joystick/buttons on iOS
            //https://stackoverflow.com/a/38573198/11626958
            let lastTouchEnd = 0;
            document.addEventListener('touchend', function (event) {
                let now = (new Date()).getTime();
                if (now - lastTouchEnd <= 300) event.preventDefault();
                lastTouchEnd = now;
            }, false);
        }
    }

    _onXRSessionStart() {
        this._session = this._renderer.xr.getSession();
        this._session.oninputsourceschange = (event) => {
            this._onXRInputSourceChange(event);
        };
        let inputSources = this._session.inputSources;
        for(let i = 0; i < inputSources.length; i++) {
            this._addXRInputSource(inputSources[i]);
        }
    }

    _onXRSessionEnd() {
        this._session.oninputsourcechange = null;
        this._session = null;
        for(let type in this._xrInputDevices) {
            for(let handedness in this._xrInputDevices[type]) {
                delete this._xrInputDevices[type][handedness].inputSource;
            }
        }
    }

    _onXRInputSourceChange(event) {
        for(let i = 0; i < event.removed.length; i++) {
            this._deleteXRInputSource(event.removed[i]);
        }
        for(let i = 0; i < event.added.length; i++) {
            this._addXRInputSource(event.added[i]);
        }
    }

    _addXRInputSource(inputSource) {
        let type = (inputSource.hand != null)
            ? XRInputDeviceTypes.HAND
            : XRInputDeviceTypes.CONTROLLER;

        let handedness = inputSource.handedness.toUpperCase();
        if(handedness in Handedness) {
            let xrInputDevice = this._xrInputDevices[type][handedness];
            if(!xrInputDevice) {
                xrInputDevice = { controllers: {} };
                this._xrInputDevices[type][handedness] = xrInputDevice;
                if(inputSource.targetRaySpace) {
                    xrInputDevice.controllers.targetRay = new Object3D();
                }
                if(inputSource.gripSpace) {
                    xrInputDevice.controllers.grip = new Object3D();
                }
            }
            xrInputDevice.inputSource = inputSource;
            if(!xrInputDevice.model) {
                if(type == XRInputDeviceTypes.HAND) {
                    xrInputDevice.model = handModelFactory
                        .createHandModel(inputSource);
                } else if(type == XRInputDeviceTypes.CONTROLLER) {
                    xrInputDevice.model = controllerModelFactory
                        .createControllerModel(inputSource, 'mesh');
                }
            } else {
                let motionController = xrInputDevice.model.motionController;
                if(motionController)
                    motionController.xrInputSource = inputSource;
            }
            if(this._xrControllerParent) {
                this._xrControllerParent.add(
                    xrInputDevice.controllers.targetRay);
                this._xrControllerParent.add(xrInputDevice.controllers.grip);
                xrInputDevice.controllers.grip.add(xrInputDevice.model);
            }
        }
    }

    _deleteXRInputSource(inputSource) {
        let type = (inputSource.hand != null)
            ? XRInputDeviceTypes.HAND
            : XRInputDeviceTypes.CONTROLLER;

        let handedness = inputSource.handedness.toUpperCase();
        let xrInputDevice = this._getXRInputDevice(type, handedness);
        if(xrInputDevice?.inputSource)
            delete this._xrInputDevices[type][handedness].inputSource;
        if(xrInputDevice?.controllers && this._xrControllerParent) {
            this._xrControllerParent.remove(
                xrInputDevice.controllers.targetRay);
            this._xrControllerParent.remove(xrInputDevice.controllers.grip);
        }
    }

    _getXRInputDevice(type, handedness) {
        return (this._xrInputDevices[type])
            ? this._xrInputDevices[type][handedness]
            : null;
    }

    getXRInputSource(type, handedness) {
        let xrInputDevice = this._getXRInputDevice(type, handedness);
        return (xrInputDevice) ? xrInputDevice.inputSource : null;
    }

    getXRGamepad(handedness) {
        let type = XRInputDeviceTypes.CONTROLLER;
        let inputSource = this.getXRInputSource(type, handedness);
        return (inputSource) ? inputSource.gamepad : null;
    }

    getXRController(type, handedness, space) {
        let xrInputDevice = this._getXRInputDevice(type, handedness);
        return (xrInputDevice) ? xrInputDevice.controllers[space] : null;
    }
    
    getXRControllerModel(type, handedness) {
        let xrInputDevice = this._getXRInputDevice(type, handedness);
        return (xrInputDevice) ? xrInputDevice.model : null;
    }

    setXRControllerModel(type, handedness, model) {
        let xrInputDevice = this._getXRInputDevice(type, handedness);
        if(xrInputDevice) {
            if(xrInputDevice.model)
                xrInputDevice.controllers.grip.remove(xrInputDevice.model);
            xrInputDevice.model = model;
            xrInputDevice.controllers.grip.add(model);
            return true;
        }
        return false;
    }

    enableXRControllerManagement(controllerParent) {
        this._xrControllerParent = controllerParent;
    }

    disableXRControllerManagement() {
        this._xrControllerParent = null;
    }

    getPointerPosition() {
        return this._pointerPosition;
    }

    isPointerPressed() {
        return this._pointerPressed;
    }

    isKeyPressed(key) {
        return this._keysPressed.has(key);
    }

    isKeyCodePressed(code) {
        return this._keyCodesPressed.has(code);
    }

    isScreenTouched() {
        return this._screenTouched;
    }

    getJoystickAngle() {
        return this._joystickAngle;
    }

    getJoystickDistance() {
        return this._joystickDistance;
    }

    _createExtraControls() {
        this._extraControls = {};
        this._extraControlsDiv = document.createElement('div');
        this._extraControlsDiv.style.position = 'absolute';
        this._extraControlsDiv.style.top = '10px';
        this._extraControlsDiv.style.right = '10px';
        this._container.appendChild(this._extraControlsDiv);
    }

    createJoystick() {
        let joystickParent = document.createElement('div');
        joystickParent.style.position = 'absolute';
        joystickParent.style.width = '100px';
        joystickParent.style.height = '100px';
        joystickParent.style.left = '10px';
        joystickParent.style.bottom = '10px';
        this._container.appendChild(joystickParent);
        let options = {
            zone: joystickParent,
            mode: 'static',
            position: {left: '50%', top: '50%'},
        };
        let manager = nipplejs.create(options);
        let joystick = manager.get(0);
        joystick.on('move', (event, data) => {
            this._joystickAngle = data.angle.radian;
            this._joystickDistance = Math.min(data.force, 1);
        });
        joystick.on('end', () => {
            this._joystickDistance = 0;
        });
    }

    addExtraControlsButton(id, name) {
        let button = document.createElement('button');
        button.id = id;
        button.innerText = name;
        button.style.borderWidth = '1px';
        button.style.borderStyle = 'solid';
        button.style.borderColor = '#fff';
        button.style.borderRadius = '4px';
        button.style.background = 'rgba(0,0,0,0.5)';
        button.style.padding = '12px';
        button.style.color = '#fff';
        button.style.font = 'normal 13px sans-serif';
        button.style.marginLeft = '5px';
        button.style.opacity = '0.75';
        button.style.width = '70px';
        this._extraControlsDiv.appendChild(button);
        this._extraControls[id] = button;
        return button;
    }

    getExtraControlsButton(id) {
        return this._extraControls[id];
    }

    hideExtraControlsButton(id) {
        let button = this._extraControls[id];
        if(button) button.style.display = 'none';
    }

    showExtraControlsButton(id) {
        let button = this._extraControls[id];
        if(button) button.style.display = 'inline-block';
    }

    _updateXRController(frame, referenceSpace, xrInputDevice) {
        let xrInputSource = xrInputDevice.inputSource;
        let xrControllers = xrInputDevice.controllers;
        if(xrInputSource) {
            let targetRayPose = frame.getPose(
                xrInputSource.targetRaySpace, referenceSpace
            );
            if(targetRayPose != null) {
                xrControllers.targetRay.matrix.fromArray(
                    targetRayPose.transform.matrix
                );
                xrControllers.targetRay.matrix.decompose(
                    xrControllers.targetRay.position,
                    xrControllers.targetRay.rotation,
                    xrControllers.targetRay.scale
                );
            }

            let gripPose = frame.getPose(
                xrInputSource.gripSpace, referenceSpace
            );
            if(gripPose != null) {
                xrControllers.grip.matrix.fromArray(gripPose.transform.matrix);
                xrControllers.grip.matrix.decompose(
                    xrControllers.grip.position,
                    xrControllers.grip.rotation,
                    xrControllers.grip.scale
                );
            }

            if(xrInputSource.hand && xrInputDevice.model) {
                let motionController = xrInputDevice.model.motionController;
                if(motionController){
                    motionController.updateMesh(frame, referenceSpace,
                        xrControllers.grip.matrix);
                }
            }
        }
    }

    update(frame) {
        if(frame == null) return;
        let referenceSpace = this._renderer.xr.getReferenceSpace();
        for(let type in this._xrInputDevices) {
            for(let handedness in this._xrInputDevices[type]) {
                this._updateXRController(frame, referenceSpace,
                    this._xrInputDevices[type][handedness]);
            }
        }
    }
}

let inputHandler = new InputHandler();

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */


class InteractableHandler {
    constructor() {
        this._interactables = new Set();
        this._hoveredInteractables = new Map();
        this._selectedInteractables = new Map();
        this._tool = null;
        this._toolHandlers = {};
    }

    _setupXRSubscription() {
        interactionTool.addUpdateListener((tool) => {
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

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */


class GripInteractableHandler extends InteractableHandler {
    constructor() {
        super();
    }

    init(deviceType, scene) {
        super.init(deviceType);
        this._scene = scene;
        this._sphere = new THREE.Sphere();
        this._box3 = new THREE.Box3();
    }

    _getBoundingSphere(object) {
        if(!object) return null;
        this._box3.setFromObject(object).getBoundingSphere(this._sphere);
        return this._sphere;
    }

    _isXRControllerPressed(type, handedness) {
        if(type == XRInputDeviceTypes.HAND) {
            let model = inputHandler.getXRControllerModel(type, handedness);
            return model?.motionController?.isGrabbing != null;
        } else {
            let gamepad = inputHandler.getXRGamepad(handedness);
            return gamepad?.buttons != null && gamepad.buttons[1].pressed;
        }
    }

    _scopeInteractables(controller, interactables) {
        let boundingSphere = controller['boundingSphere'];
        if(boundingSphere == null) return;
        for(let interactable of interactables) {
            if(interactable.children.size != 0)
                this._scopeInteractables(controller, interactable.children);
            let threeObj = interactable.getObject();
            if(threeObj == null || interactable.isOnlyGroup()) continue;
            let intersects = interactable.intersectsSphere(boundingSphere);
            if(intersects) {
                let distance = interactable.distanceToSphere(boundingSphere);
                if(distance < controller['closestPointDistance']) {
                    controller['closestPointDistance'] = distance;
                    controller['closestInteractable'] = interactable;
                }
            }
        }
    }

    _updateInteractables(controller) {
        let option = controller.option;
        let isPressed = controller['isPressed'];
        this._scopeInteractables(controller, this._interactables);
        let hoveredInteractable = this._hoveredInteractables.get(option);
        let selectedInteractable = this._selectedInteractables.get(option);
        let closestInteractable = controller['closestInteractable'];
        if(closestInteractable) {
            if(isPressed) {
                if(!selectedInteractable 
                        && hoveredInteractable == closestInteractable)
                {
                    closestInteractable.addSelectedBy(option);
                    this._selectedInteractables.set(option,closestInteractable);
                    closestInteractable.removeHoveredBy(option);
                    this._hoveredInteractables.delete(option);
                }
            } else {
                if(hoveredInteractable != closestInteractable) {
                    if(hoveredInteractable) {
                        hoveredInteractable.removeHoveredBy(option);
                    }
                    closestInteractable.addHoveredBy(option);
                    this._hoveredInteractables.set(option, closestInteractable);
                }
                if(selectedInteractable) {
                    selectedInteractable.removeSelectedBy(option);
                    this._selectedInteractables.delete(option);
                }
            }
        } else if(!isPressed) {
            if(hoveredInteractable) {
                hoveredInteractable.removeHoveredBy(option);
                this._hoveredInteractables.delete(option);
            }
            if(selectedInteractable) {
                selectedInteractable.removeSelectedBy(option);
                this._selectedInteractables.delete(option);
            }
        }
    }

    _updateForXR() {
        for(let handedness in Handedness) {
            let controllerExists = false;
            for(let type of [XRInputDeviceTypes.HAND,
                             XRInputDeviceTypes.CONTROLLER]) {
                let xrController = inputHandler.getXRController(type,
                    handedness, 'grip');
                let xrControllerModel = inputHandler.getXRControllerModel(type,
                    handedness);
                if(!xrController) continue;
                let active = isDescendant(this._scene, xrController);
                if(active) {
                    if(type == XRInputDeviceTypes.CONTROLLER) {
                        controllerExists = true;
                    } else if(controllerExists) {
                        active = false;
                    }
                }
                let boundingSphere, isPressed;
                if(active) {
                    let isChild = isDescendant(xrController, xrControllerModel);
                    boundingSphere = (isChild)
                        ? this._getBoundingSphere(xrControllerModel)
                        : this._getBoundingSphere(xrController);
                    isPressed = this._isXRControllerPressed(type, handedness);
                }
                let controller = {
                    option: xrController,
                    boundingSphere: boundingSphere,
                    isPressed: isPressed,
                    closestPointDistance: Number.MAX_SAFE_INTEGER,
                };
                let skipUpdate = false;
                if(this._toolHandlers[this._tool]) {
                    skipUpdate = this._toolHandlers[this._tool](controller);
                }
                if(!skipUpdate) this._updateInteractables(controller);
            }
        }
    }

    _updateForPointer() {
        return;
    }

    _updateForMobile() {
        return;
    }

}

let gripInteractableHandler = new GripInteractableHandler();

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */


const vector3 = new THREE.Vector3();

class PointerInteractableHandler extends InteractableHandler {
    constructor() {
        super();
        this._cursors = {};
        this._emptyClickListeners = {};
        this._wasPressed = new Map();
    }

    init(deviceType, renderer, scene, camera, orbitTarget) {
        super.init(deviceType);
        this._deviceType = deviceType;
        this._renderer = renderer;
        this._scene = scene;
        this._camera = camera;
        this._cameraFocus = orbitTarget || camera;
    }

    addEmptyClickListener(callback) {
        let id = uuidv4();
        this._emptyClickListeners[id] = callback;
        return id;
    }

    _getXRCursor(hand) {
        if(this._cursors[hand]) return this._cursors[hand];
        let canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        let ctx = canvas.getContext("2d");
        ctx.beginPath();
        ctx.arc(32, 32, 29, 0, 2 * Math.PI);
        ctx.lineWidth = 5;
        ctx.stroke();
        ctx.fillStyle = "white";
        ctx.fill();
        let spriteMaterial = new THREE.SpriteMaterial({
            map: new THREE.CanvasTexture(canvas),
            depthTest: false,
            sizeAttenuation: false,
        });
        for(let handedness in Handedness) {
            let cursor = new THREE.Sprite(spriteMaterial);
            cursor.scale.set(0.015,0.015,0.015);
            cursor.visible = false;
            cursor.renderOrder = Infinity;
            this._cursors[handedness] = cursor;
            this._scene.add(cursor);
        }
        return this._cursors[hand];
    }

    _getRaycaster() {
        if(!this._raycaster) this._raycaster = new THREE.Raycaster();
        let position = inputHandler.getPointerPosition();
        this._raycaster.setFromCamera(position, this._camera);
        return this._raycaster;
    }

    _getXRRaycaster(xrController) {
        if(!xrController.raycaster)
            xrController.raycaster = new THREE.Raycaster();
        xrController.getWorldPosition(xrController.raycaster.ray.origin);
        xrController.getWorldDirection(xrController.raycaster.ray.direction)
            .negate().normalize();
        return xrController.raycaster;
    }

    _isControllerPressed(option) {
        if(option == Handedness.LEFT || option == Handedness.RIGHT) {
            let gamepad = inputHandler.getXRGamepad(option);
            return gamepad != null && gamepad.buttons[0].pressed;
        } else if(option == "POINTER") {
            return inputHandler.isPointerPressed();
        } else if(option == "MOBILE") {
            return inputHandler.isScreenTouched();
        }
    }

    _isXRControllerPressed(type, handedness) {
        if(type == XRInputDeviceTypes.HAND) {
            let model = inputHandler.getXRControllerModel(type, handedness);
            return model?.motionController?.isPinching != null;
        } else {
            let gamepad = inputHandler.getXRGamepad(handedness);
            return gamepad?.buttons != null && gamepad.buttons[0].pressed;
        }
    }

    _squashInteractables(option, interactables, objects) {
        for(let interactable of interactables) {
            let object = interactable.getObject();
            if(object && !interactable.isOnlyGroup()) objects.push(object);
            if(interactable.children.size != 0) {
                this._squashInteractables(option, interactable.children,
                    objects);
            }
        }
    }

    _getObjectInteractable(object) {
        while(object != null) {
            if(object.pointerInteractable) return object.pointerInteractable;
            object = object.parent;
        }
    }

    _raycastInteractables(controller, interactables) {
        let raycaster = controller['raycaster'];
        if(!raycaster) return;
        raycaster.firstHitOnly = true;
        raycaster.params.Line.threshold = 0.01;
        let objects = [];
        this._squashInteractables(controller.option, interactables, objects);
        let intersections = raycaster.intersectObjects(objects);
        for(let intersection of intersections) {
            let interactable = this._getObjectInteractable(intersection.object);
            if(!interactable) continue;
            let distance = intersection.distance;
            let userDistance = distance;
            if(this._deviceType != 'XR') {
                this._cameraFocus.getWorldPosition(vector3);
                userDistance = intersection.point
                    .distanceTo(vector3);
            }   
            if(!interactable.isWithinReach(userDistance)) continue;
            controller['closestPointDistance'] = distance;
            controller['closestPoint'] = intersection.point;
            controller['closestInteractable'] = interactable;
            controller['userDistance'] = userDistance;
            return;
        }
    }

    _updateInteractables(controller) {
        let option = controller['option'];
        let isPressed = controller['isPressed'];
        let hoveredInteractable = this._hoveredInteractables.get(option);
        let selectedInteractable = this._selectedInteractables.get(option);
        let closestInteractable = controller['closestInteractable'];
        let userDistance = controller['userDistance'];
        if(closestInteractable && !closestInteractable.isOnlyGroup()) {
            if(isPressed) {
                if(selectedInteractable) {
                    if(selectedInteractable == closestInteractable) {
                        selectedInteractable.triggerDraggableActions(option,
                            controller['closestPoint'], userDistance);
                    }
                } else if(hoveredInteractable == closestInteractable) {
                    closestInteractable.addSelectedBy(option,
                        controller['closestPoint'], userDistance);
                    this._selectedInteractables.set(option,closestInteractable);
                    closestInteractable.removeHoveredBy(option);
                    this._hoveredInteractables.delete(option);
                }
            } else {
                if(hoveredInteractable != closestInteractable) {
                    if(hoveredInteractable) {
                        hoveredInteractable.removeHoveredBy(option);
                    }
                    closestInteractable.addHoveredBy(option,
                        controller['closestPoint'], userDistance);
                    this._hoveredInteractables.set(option, closestInteractable);
                }
                if(selectedInteractable) {
                    selectedInteractable.removeSelectedBy(option);
                    this._selectedInteractables.delete(option);
                }
            }
        } else if(!isPressed) {
            if(this._wasPressed.get(option) && !hoveredInteractable
                    && !selectedInteractable) {
                for(let id in this._emptyClickListeners) {
                    this._emptyClickListeners[id](option);
                }
            }
            if(selectedInteractable) {
                selectedInteractable.removeSelectedBy(option);
                this._selectedInteractables.delete(option);
            }
            if(hoveredInteractable) {
                hoveredInteractable.removeHoveredBy(option);
                this._hoveredInteractables.delete(option);
            }
        }
        this._wasPressed.set(option, isPressed);
    }

    _updateInteractablesMobile(controller) {
        let option = controller['option'];
        let isPressed = controller['isPressed'];
        let selectedInteractable = this._selectedInteractables.get(option);
        if(this._mobileWasTouched) {
            if(!selectedInteractable) {
                this._mobileWasTouched = isPressed;
                return;
            }

            this._raycastInteractables(controller, this._interactables);
            let userDistance = controller['userDistance'];
            let closestInteractable = controller['closestInteractable'];
            if(!isPressed) {
                this._mobileWasTouched = false;
                if(closestInteractable == selectedInteractable) {
                    selectedInteractable.triggerActions(option,
                        controller['closestPoint'], userDistance);
                }
                selectedInteractable.removeSelectedBy(option);
            } else if(selectedInteractable == closestInteractable) {
                selectedInteractable.triggerDraggableActions(option,
                    controller['closestPoint'], userDistance);
            }
        } else if(isPressed) {
            this._mobileWasTouched = true;
            this._raycastInteractables(controller, this._interactables);
            let userDistance = controller['userDistance'];
            let closestInteractable = controller['closestInteractable'];
            if(closestInteractable) {
                closestInteractable.addSelectedBy(option,
                    controller['closestPoint'], userDistance);
                this._selectedInteractables.set(option, closestInteractable);
            }
        }
    }

    _updateCursor(controller) {
        let cursor = controller.cursor;
        if(!cursor) return;
        if(controller['closestPoint'] != null) {
            cursor.position.copy(controller['closestPoint']);
            if(!cursor.visible) {
                cursor.visible = true;
            }
        } else {
            if(cursor.visible) {
                cursor.visible = false;
            }
        }
    }

    _updateForXR() {
        for(let handedness in Handedness) {
            let controllerExists = false;
            for(let type of [XRInputDeviceTypes.HAND,
                             XRInputDeviceTypes.CONTROLLER]) {
                let xrController = inputHandler.getXRController(type,
                    handedness, 'grip');
                if(!xrController) continue;
                let active = isDescendant(this._scene, xrController);
                if(active) {
                    if(type == XRInputDeviceTypes.CONTROLLER) {
                        controllerExists = true;
                    } else if(controllerExists) {
                        active = false;
                    }
                }
                let raycaster, isPressed;
                if(active) {
                    let targetRay = inputHandler.getXRController(type,
                        handedness, 'targetRay');
                    raycaster = this._getXRRaycaster(targetRay);
                    isPressed = this._isXRControllerPressed(type, handedness);
                }
                let controller = {
                    option: xrController,
                    raycaster: raycaster,
                    isPressed: isPressed,
                    closestPoint: null,
                    closestPointDistance: Number.MAX_SAFE_INTEGER,
                    cursor: (active) ? this._getXRCursor(handedness) : null,
                    userDistance: Number.MAX_SAFE_INTEGER,
                };
                let skipUpdate = false;
                if(this._toolHandlers[this._tool]) {
                    skipUpdate = this._toolHandlers[this._tool](controller);
                }
                if(!skipUpdate) {
                    this._raycastInteractables(controller, this._interactables);
                    this._updateInteractables(controller);
                }
                this._updateCursor(controller);
            }
        }
    }

    _updateForPointer() {
        let controller = {
            option: "POINTER",
            raycaster: this._getRaycaster(),
            isPressed: this._isControllerPressed("POINTER"),
            closestPoint: null,
            closestPointDistance: Number.MAX_SAFE_INTEGER,
            userDistance: Number.MAX_SAFE_INTEGER,
        };
        let skipUpdate = false;
        if(this._toolHandlers[this._tool]) {
            skipUpdate = this._toolHandlers[this._tool](controller);
        }
        if(!skipUpdate) {
            this._raycastInteractables(controller, this._interactables);
            this._updateInteractables(controller);
        }
        let style = this._renderer.domElement.style;
        if(this._hoveredInteractables.get('POINTER')) {
            if(!style.cursor) style.cursor = 'pointer';
        } else if(style.cursor == 'pointer') {
            style.cursor = '';
        }
    }

    _updateForMobile() {
        let controller = {
            option: "MOBILE",
            raycaster: this._getRaycaster(),
            isPressed: this._isControllerPressed("MOBILE"),
            closestPoint: null,
            closestPointDistance: Number.MAX_SAFE_INTEGER,
            userDistance: Number.MAX_SAFE_INTEGER,
        };
        if(this._toolHandlers[this._tool]) {
            let skipUpdate = this._toolHandlers[this._tool](controller);
            if(skipUpdate) return;
        }
        this._updateInteractablesMobile(controller);
    }
}

let pointerInteractableHandler = new PointerInteractableHandler();

/**
 * Main content for the worker that handles the loading and execution of
 * modules within it.
 */
function workerBootstrap() {
  var modules = Object.create(null);

  // Handle messages for registering a module
  function registerModule(ref, callback) {
    var id = ref.id;
    var name = ref.name;
    var dependencies = ref.dependencies; if ( dependencies === void 0 ) dependencies = [];
    var init = ref.init; if ( init === void 0 ) init = function(){};
    var getTransferables = ref.getTransferables; if ( getTransferables === void 0 ) getTransferables = null;

    // Only register once
    if (modules[id]) { return }

    try {
      // If any dependencies are modules, ensure they're registered and grab their value
      dependencies = dependencies.map(function (dep) {
        if (dep && dep.isWorkerModule) {
          registerModule(dep, function (depResult) {
            if (depResult instanceof Error) { throw depResult }
          });
          dep = modules[dep.id].value;
        }
        return dep
      });

      // Rehydrate functions
      init = rehydrate(("<" + name + ">.init"), init);
      if (getTransferables) {
        getTransferables = rehydrate(("<" + name + ">.getTransferables"), getTransferables);
      }

      // Initialize the module and store its value
      var value = null;
      if (typeof init === 'function') {
        value = init.apply(void 0, dependencies);
      } else {
        console.error('worker module init function failed to rehydrate');
      }
      modules[id] = {
        id: id,
        value: value,
        getTransferables: getTransferables
      };
      callback(value);
    } catch(err) {
      if (!(err && err.noLog)) {
        console.error(err);
      }
      callback(err);
    }
  }

  // Handle messages for calling a registered module's result function
  function callModule(ref, callback) {
    var ref$1;

    var id = ref.id;
    var args = ref.args;
    if (!modules[id] || typeof modules[id].value !== 'function') {
      callback(new Error(("Worker module " + id + ": not found or its 'init' did not return a function")));
    }
    try {
      var result = (ref$1 = modules[id]).value.apply(ref$1, args);
      if (result && typeof result.then === 'function') {
        result.then(handleResult, function (rej) { return callback(rej instanceof Error ? rej : new Error('' + rej)); });
      } else {
        handleResult(result);
      }
    } catch(err) {
      callback(err);
    }
    function handleResult(result) {
      try {
        var tx = modules[id].getTransferables && modules[id].getTransferables(result);
        if (!tx || !Array.isArray(tx) || !tx.length) {
          tx = undefined; //postMessage is very picky about not passing null or empty transferables
        }
        callback(result, tx);
      } catch(err) {
        console.error(err);
        callback(err);
      }
    }
  }

  function rehydrate(name, str) {
    var result = void 0;
    self.troikaDefine = function (r) { return result = r; };
    var url = URL.createObjectURL(
      new Blob(
        [("/** " + (name.replace(/\*/g, '')) + " **/\n\ntroikaDefine(\n" + str + "\n)")],
        {type: 'application/javascript'}
      )
    );
    try {
      importScripts(url);
    } catch(err) {
      console.error(err);
    }
    URL.revokeObjectURL(url);
    delete self.troikaDefine;
    return result
  }

  // Handler for all messages within the worker
  self.addEventListener('message', function (e) {
    var ref = e.data;
    var messageId = ref.messageId;
    var action = ref.action;
    var data = ref.data;
    try {
      // Module registration
      if (action === 'registerModule') {
        registerModule(data, function (result) {
          if (result instanceof Error) {
            postMessage({
              messageId: messageId,
              success: false,
              error: result.message
            });
          } else {
            postMessage({
              messageId: messageId,
              success: true,
              result: {isCallable: typeof result === 'function'}
            });
          }
        });
      }
      // Invocation
      if (action === 'callModule') {
        callModule(data, function (result, transferables) {
          if (result instanceof Error) {
            postMessage({
              messageId: messageId,
              success: false,
              error: result.message
            });
          } else {
            postMessage({
              messageId: messageId,
              success: true,
              result: result
            }, transferables || undefined);
          }
        });
      }
    } catch(err) {
      postMessage({
        messageId: messageId,
        success: false,
        error: err.stack
      });
    }
  });
}

/**
 * Fallback for `defineWorkerModule` that behaves identically but runs in the main
 * thread, for when the execution environment doesn't support web workers or they
 * are disallowed due to e.g. CSP security restrictions.
 */
function defineMainThreadModule(options) {
  var moduleFunc = function() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return moduleFunc._getInitResult().then(function (initResult) {
      if (typeof initResult === 'function') {
        return initResult.apply(void 0, args)
      } else {
        throw new Error('Worker module function was called but `init` did not return a callable function')
      }
    })
  };
  moduleFunc._getInitResult = function() {
    // We can ignore getTransferables in main thread. TODO workerId?
    var dependencies = options.dependencies;
    var init = options.init;

    // Resolve dependencies
    dependencies = Array.isArray(dependencies) ? dependencies.map(function (dep) { return dep && dep._getInitResult ? dep._getInitResult() : dep; }
    ) : [];

    // Invoke init with the resolved dependencies
    var initPromise = Promise.all(dependencies).then(function (deps) {
      return init.apply(null, deps)
    });

    // Cache the resolved promise for subsequent calls
    moduleFunc._getInitResult = function () { return initPromise; };

    return initPromise
  };
  return moduleFunc
}

var supportsWorkers = function () {
  var supported = false;

  // Only attempt worker initialization in browsers; elsewhere it would just be
  // noise e.g. loading into a Node environment for SSR.
  if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
    try {
      // TODO additional checks for things like importScripts within the worker?
      //  Would need to be an async check.
      var worker = new Worker(
        URL.createObjectURL(new Blob([''], { type: 'application/javascript' }))
      );
      worker.terminate();
      supported = true;
    } catch (err) {
      if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ; else {
        console.log(
          ("Troika createWorkerModule: web workers not allowed; falling back to main thread execution. Cause: [" + (err.message) + "]")
        );
      }
    }
  }

  // Cached result
  supportsWorkers = function () { return supported; };
  return supported
};

var _workerModuleId = 0;
var _messageId = 0;
var _allowInitAsString = false;
var workers = Object.create(null);
var registeredModules = Object.create(null); //workerId -> Set<unregisterFn>
var openRequests = Object.create(null);


/**
 * Define a module of code that will be executed with a web worker. This provides a simple
 * interface for moving chunks of logic off the main thread, and managing their dependencies
 * among one another.
 *
 * @param {object} options
 * @param {function} options.init
 * @param {array} [options.dependencies]
 * @param {function} [options.getTransferables]
 * @param {string} [options.name]
 * @param {string} [options.workerId]
 * @return {function(...[*]): {then}}
 */
function defineWorkerModule(options) {
  if ((!options || typeof options.init !== 'function') && !_allowInitAsString) {
    throw new Error('requires `options.init` function')
  }
  var dependencies = options.dependencies;
  var init = options.init;
  var getTransferables = options.getTransferables;
  var workerId = options.workerId;

  if (!supportsWorkers()) {
    return defineMainThreadModule(options)
  }

  if (workerId == null) {
    workerId = '#default';
  }
  var id = "workerModule" + (++_workerModuleId);
  var name = options.name || id;
  var registrationPromise = null;

  dependencies = dependencies && dependencies.map(function (dep) {
    // Wrap raw functions as worker modules with no dependencies
    if (typeof dep === 'function' && !dep.workerModuleData) {
      _allowInitAsString = true;
      dep = defineWorkerModule({
        workerId: workerId,
        name: ("<" + name + "> function dependency: " + (dep.name)),
        init: ("function(){return (\n" + (stringifyFunction(dep)) + "\n)}")
      });
      _allowInitAsString = false;
    }
    // Grab postable data for worker modules
    if (dep && dep.workerModuleData) {
      dep = dep.workerModuleData;
    }
    return dep
  });

  function moduleFunc() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    // Register this module if needed
    if (!registrationPromise) {
      registrationPromise = callWorker(workerId,'registerModule', moduleFunc.workerModuleData);
      var unregister = function () {
        registrationPromise = null;
        registeredModules[workerId].delete(unregister);
      }
      ;(registeredModules[workerId] || (registeredModules[workerId] = new Set())).add(unregister);
    }

    // Invoke the module, returning a promise
    return registrationPromise.then(function (ref) {
      var isCallable = ref.isCallable;

      if (isCallable) {
        return callWorker(workerId,'callModule', {id: id, args: args})
      } else {
        throw new Error('Worker module function was called but `init` did not return a callable function')
      }
    })
  }
  moduleFunc.workerModuleData = {
    isWorkerModule: true,
    id: id,
    name: name,
    dependencies: dependencies,
    init: stringifyFunction(init),
    getTransferables: getTransferables && stringifyFunction(getTransferables)
  };
  return moduleFunc
}

/**
 * Terminate an active Worker by a workerId that was passed to defineWorkerModule.
 * This only terminates the Worker itself; the worker module will remain available
 * and if you call it again its Worker will be respawned.
 * @param {string} workerId
 */
function terminateWorker(workerId) {
  // Unregister all modules that were registered in that worker
  if (registeredModules[workerId]) {
    registeredModules[workerId].forEach(function (unregister) {
      unregister();
    });
  }
  // Terminate the Worker object
  if (workers[workerId]) {
    workers[workerId].terminate();
    delete workers[workerId];
  }
}

/**
 * Stringifies a function into a form that can be deserialized in the worker
 * @param fn
 */
function stringifyFunction(fn) {
  var str = fn.toString();
  // If it was defined in object method/property format, it needs to be modified
  if (!/^function/.test(str) && /^\w+\s*\(/.test(str)) {
    str = 'function ' + str;
  }
  return str
}


function getWorker(workerId) {
  var worker = workers[workerId];
  if (!worker) {
    // Bootstrap the worker's content
    var bootstrap = stringifyFunction(workerBootstrap);

    // Create the worker from the bootstrap function content
    worker = workers[workerId] = new Worker(
      URL.createObjectURL(
        new Blob(
          [("/** Worker Module Bootstrap: " + (workerId.replace(/\*/g, '')) + " **/\n\n;(" + bootstrap + ")()")],
          {type: 'application/javascript'}
        )
      )
    );

    // Single handler for response messages from the worker
    worker.onmessage = function (e) {
      var response = e.data;
      var msgId = response.messageId;
      var callback = openRequests[msgId];
      if (!callback) {
        throw new Error('WorkerModule response with empty or unknown messageId')
      }
      delete openRequests[msgId];
      callback(response);
    };
  }
  return worker
}

// Issue a call to the worker with a callback to handle the response
function callWorker(workerId, action, data) {
  return new Promise(function (resolve, reject) {
    var messageId = ++_messageId;
    openRequests[messageId] = function (response) {
      if (response.success) {
        resolve(response.result);
      } else {
        reject(new Error(("Error in worker " + action + " call: " + (response.error))));
      }
    };
    getWorker(workerId).postMessage({
      messageId: messageId,
      action: action,
      data: data
    });
  })
}

function SDFGenerator() {
var exports = (function (exports) {

  /**
   * Find the point on a quadratic bezier curve at t where t is in the range [0, 1]
   */
  function pointOnQuadraticBezier (x0, y0, x1, y1, x2, y2, t, pointOut) {
    var t2 = 1 - t;
    pointOut.x = t2 * t2 * x0 + 2 * t2 * t * x1 + t * t * x2;
    pointOut.y = t2 * t2 * y0 + 2 * t2 * t * y1 + t * t * y2;
  }

  /**
   * Find the point on a cubic bezier curve at t where t is in the range [0, 1]
   */
  function pointOnCubicBezier (x0, y0, x1, y1, x2, y2, x3, y3, t, pointOut) {
    var t2 = 1 - t;
    pointOut.x = t2 * t2 * t2 * x0 + 3 * t2 * t2 * t * x1 + 3 * t2 * t * t * x2 + t * t * t * x3;
    pointOut.y = t2 * t2 * t2 * y0 + 3 * t2 * t2 * t * y1 + 3 * t2 * t * t * y2 + t * t * t * y3;
  }

  /**
   * Parse a path string into its constituent line/curve commands, invoking a callback for each.
   * @param {string} pathString - An SVG-like path string to parse; should only contain commands: M/L/Q/C/Z
   * @param {function(
   *   command: 'L'|'Q'|'C',
   *   startX: number,
   *   startY: number,
   *   endX: number,
   *   endY: number,
   *   ctrl1X?: number,
   *   ctrl1Y?: number,
   *   ctrl2X?: number,
   *   ctrl2Y?: number
   * )} commandCallback - A callback function that will be called once for each parsed path command, passing the
   *                      command identifier (only L/Q/C commands) and its numeric arguments.
   */
  function forEachPathCommand(pathString, commandCallback) {
    var segmentRE = /([MLQCZ])([^MLQCZ]*)/g;
    var match, firstX, firstY, prevX, prevY;
    while ((match = segmentRE.exec(pathString))) {
      var args = match[2]
        .replace(/^\s*|\s*$/g, '')
        .split(/[,\s]+/)
        .map(function (v) { return parseFloat(v); });
      switch (match[1]) {
        case 'M':
          prevX = firstX = args[0];
          prevY = firstY = args[1];
          break
        case 'L':
          if (args[0] !== prevX || args[1] !== prevY) { // yup, some fonts have zero-length line commands
            commandCallback('L', prevX, prevY, (prevX = args[0]), (prevY = args[1]));
          }
          break
        case 'Q': {
          commandCallback('Q', prevX, prevY, (prevX = args[2]), (prevY = args[3]), args[0], args[1]);
          break
        }
        case 'C': {
          commandCallback('C', prevX, prevY, (prevX = args[4]), (prevY = args[5]), args[0], args[1], args[2], args[3]);
          break
        }
        case 'Z':
          if (prevX !== firstX || prevY !== firstY) {
            commandCallback('L', prevX, prevY, firstX, firstY);
          }
          break
      }
    }
  }

  /**
   * Convert a path string to a series of straight line segments
   * @param {string} pathString - An SVG-like path string to parse; should only contain commands: M/L/Q/C/Z
   * @param {function(x1:number, y1:number, x2:number, y2:number)} segmentCallback - A callback
   *        function that will be called once for every line segment
   * @param {number} [curvePoints] - How many straight line segments to use when approximating a
   *        bezier curve in the path. Defaults to 16.
   */
  function pathToLineSegments (pathString, segmentCallback, curvePoints) {
    if ( curvePoints === void 0 ) curvePoints = 16;

    var tempPoint = { x: 0, y: 0 };
    forEachPathCommand(pathString, function (command, startX, startY, endX, endY, ctrl1X, ctrl1Y, ctrl2X, ctrl2Y) {
      switch (command) {
        case 'L':
          segmentCallback(startX, startY, endX, endY);
          break
        case 'Q': {
          var prevCurveX = startX;
          var prevCurveY = startY;
          for (var i = 1; i < curvePoints; i++) {
            pointOnQuadraticBezier(
              startX, startY,
              ctrl1X, ctrl1Y,
              endX, endY,
              i / (curvePoints - 1),
              tempPoint
            );
            segmentCallback(prevCurveX, prevCurveY, tempPoint.x, tempPoint.y);
            prevCurveX = tempPoint.x;
            prevCurveY = tempPoint.y;
          }
          break
        }
        case 'C': {
          var prevCurveX$1 = startX;
          var prevCurveY$1 = startY;
          for (var i$1 = 1; i$1 < curvePoints; i$1++) {
            pointOnCubicBezier(
              startX, startY,
              ctrl1X, ctrl1Y,
              ctrl2X, ctrl2Y,
              endX, endY,
              i$1 / (curvePoints - 1),
              tempPoint
            );
            segmentCallback(prevCurveX$1, prevCurveY$1, tempPoint.x, tempPoint.y);
            prevCurveX$1 = tempPoint.x;
            prevCurveY$1 = tempPoint.y;
          }
          break
        }
      }
    });
  }

  var viewportQuadVertex = "precision highp float;attribute vec2 aUV;varying vec2 vUV;void main(){vUV=aUV;gl_Position=vec4(mix(vec2(-1.0),vec2(1.0),aUV),0.0,1.0);}";

  var copyTexFragment = "precision highp float;uniform sampler2D tex;varying vec2 vUV;void main(){gl_FragColor=texture2D(tex,vUV);}";

  var cache = new WeakMap();

  var glContextParams = {
    premultipliedAlpha: false,
    preserveDrawingBuffer: true,
    antialias: false,
    depth: false,
  };

  /**
   * This is a little helper library for WebGL. It assists with state management for a GL context.
   * It's pretty tightly wrapped to the needs of this package, not very general-purpose.
   *
   * @param { WebGLRenderingContext | HTMLCanvasElement | OffscreenCanvas } glOrCanvas - the GL context to wrap
   * @param { ({gl, getExtension, withProgram, withTexture, withTextureFramebuffer, handleContextLoss}) => void } callback
   */
  function withWebGLContext (glOrCanvas, callback) {
    var gl = glOrCanvas.getContext ? glOrCanvas.getContext('webgl', glContextParams) : glOrCanvas;
    var wrapper = cache.get(gl);
    if (!wrapper) {
      var isWebGL2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
      var extensions = {};
      var programs = {};
      var textures = {};
      var textureUnit = -1;
      var framebufferStack = [];

      gl.canvas.addEventListener('webglcontextlost', function (e) {
        handleContextLoss();
        e.preventDefault();
      }, false);

      function getExtension (name) {
        var ext = extensions[name];
        if (!ext) {
          ext = extensions[name] = gl.getExtension(name);
          if (!ext) {
            throw new Error((name + " not supported"))
          }
        }
        return ext
      }

      function compileShader (src, type) {
        var shader = gl.createShader(type);
        gl.shaderSource(shader, src);
        gl.compileShader(shader);
        // const status = gl.getShaderParameter(shader, gl.COMPILE_STATUS)
        // if (!status && !gl.isContextLost()) {
        //   throw new Error(gl.getShaderInfoLog(shader).trim())
        // }
        return shader
      }

      function withProgram (name, vert, frag, func) {
        if (!programs[name]) {
          var attributes = {};
          var uniforms = {};
          var program = gl.createProgram();
          gl.attachShader(program, compileShader(vert, gl.VERTEX_SHADER));
          gl.attachShader(program, compileShader(frag, gl.FRAGMENT_SHADER));
          gl.linkProgram(program);

          programs[name] = {
            program: program,
            transaction: function transaction (func) {
              gl.useProgram(program);
              func({
                setUniform: function setUniform (type, name) {
                  var values = [], len = arguments.length - 2;
                  while ( len-- > 0 ) values[ len ] = arguments[ len + 2 ];

                  var uniformLoc = uniforms[name] || (uniforms[name] = gl.getUniformLocation(program, name));
                  gl[("uniform" + type)].apply(gl, [ uniformLoc ].concat( values ));
                },

                setAttribute: function setAttribute (name, size, usage, instancingDivisor, data) {
                  var attr = attributes[name];
                  if (!attr) {
                    attr = attributes[name] = {
                      buf: gl.createBuffer(), // TODO should we destroy our buffers?
                      loc: gl.getAttribLocation(program, name),
                      data: null
                    };
                  }
                  gl.bindBuffer(gl.ARRAY_BUFFER, attr.buf);
                  gl.vertexAttribPointer(attr.loc, size, gl.FLOAT, false, 0, 0);
                  gl.enableVertexAttribArray(attr.loc);
                  if (isWebGL2) {
                    gl.vertexAttribDivisor(attr.loc, instancingDivisor);
                  } else {
                    getExtension('ANGLE_instanced_arrays').vertexAttribDivisorANGLE(attr.loc, instancingDivisor);
                  }
                  if (data !== attr.data) {
                    gl.bufferData(gl.ARRAY_BUFFER, data, usage);
                    attr.data = data;
                  }
                }
              });
            }
          };
        }

        programs[name].transaction(func);
      }

      function withTexture (name, func) {
        textureUnit++;
        try {
          gl.activeTexture(gl.TEXTURE0 + textureUnit);
          var texture = textures[name];
          if (!texture) {
            texture = textures[name] = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
          }
          gl.bindTexture(gl.TEXTURE_2D, texture);
          func(texture, textureUnit);
        } finally {
          textureUnit--;
        }
      }

      function withTextureFramebuffer (texture, textureUnit, func) {
        var framebuffer = gl.createFramebuffer();
        framebufferStack.push(framebuffer);
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.activeTexture(gl.TEXTURE0 + textureUnit);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        try {
          func(framebuffer);
        } finally {
          gl.deleteFramebuffer(framebuffer);
          gl.bindFramebuffer(gl.FRAMEBUFFER, framebufferStack[--framebufferStack.length - 1] || null);
        }
      }

      function handleContextLoss () {
        extensions = {};
        programs = {};
        textures = {};
        textureUnit = -1;
        framebufferStack.length = 0;
      }

      cache.set(gl, wrapper = {
        gl: gl,
        isWebGL2: isWebGL2,
        getExtension: getExtension,
        withProgram: withProgram,
        withTexture: withTexture,
        withTextureFramebuffer: withTextureFramebuffer,
        handleContextLoss: handleContextLoss,
      });
    }
    callback(wrapper);
  }


  function renderImageData(glOrCanvas, imageData, x, y, width, height, channels, framebuffer) {
    if ( channels === void 0 ) channels = 15;
    if ( framebuffer === void 0 ) framebuffer = null;

    withWebGLContext(glOrCanvas, function (ref) {
      var gl = ref.gl;
      var withProgram = ref.withProgram;
      var withTexture = ref.withTexture;

      withTexture('copy', function (tex, texUnit) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, imageData);
        withProgram('copy', viewportQuadVertex, copyTexFragment, function (ref) {
          var setUniform = ref.setUniform;
          var setAttribute = ref.setAttribute;

          setAttribute('aUV', 2, gl.STATIC_DRAW, 0, new Float32Array([0, 0, 2, 0, 0, 2]));
          setUniform('1i', 'image', texUnit);
          gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer || null);
          gl.disable(gl.BLEND);
          gl.colorMask(channels & 8, channels & 4, channels & 2, channels & 1);
          gl.viewport(x, y, width, height);
          gl.scissor(x, y, width, height);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
        });
      });
    });
  }

  /**
   * Resizing a canvas clears its contents; this utility copies the previous contents over.
   * @param canvas
   * @param newWidth
   * @param newHeight
   */
  function resizeWebGLCanvasWithoutClearing(canvas, newWidth, newHeight) {
    var width = canvas.width;
    var height = canvas.height;
    withWebGLContext(canvas, function (ref) {
      var gl = ref.gl;

      var data = new Uint8Array(width * height * 4);
      gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data);
      canvas.width = newWidth;
      canvas.height = newHeight;
      renderImageData(gl, data, 0, 0, width, height);
    });
  }

  var webglUtils = /*#__PURE__*/Object.freeze({
    __proto__: null,
    withWebGLContext: withWebGLContext,
    renderImageData: renderImageData,
    resizeWebGLCanvasWithoutClearing: resizeWebGLCanvasWithoutClearing
  });

  function generate$2 (sdfWidth, sdfHeight, path, viewBox, maxDistance, sdfExponent) {
    if ( sdfExponent === void 0 ) sdfExponent = 1;

    var textureData = new Uint8Array(sdfWidth * sdfHeight);

    var viewBoxWidth = viewBox[2] - viewBox[0];
    var viewBoxHeight = viewBox[3] - viewBox[1];

    // Decompose all paths into straight line segments and add them to an index
    var segments = [];
    pathToLineSegments(path, function (x1, y1, x2, y2) {
      segments.push({
        x1: x1, y1: y1, x2: x2, y2: y2,
        minX: Math.min(x1, x2),
        minY: Math.min(y1, y2),
        maxX: Math.max(x1, x2),
        maxY: Math.max(y1, y2)
      });
    });

    // Sort segments by maxX, this will let us short-circuit some loops below
    segments.sort(function (a, b) { return a.maxX - b.maxX; });

    // For each target SDF texel, find the distance from its center to its nearest line segment,
    // map that distance to an alpha value, and write that alpha to the texel
    for (var sdfX = 0; sdfX < sdfWidth; sdfX++) {
      for (var sdfY = 0; sdfY < sdfHeight; sdfY++) {
        var signedDist = findNearestSignedDistance(
          viewBox[0] + viewBoxWidth * (sdfX + 0.5) / sdfWidth,
          viewBox[1] + viewBoxHeight * (sdfY + 0.5) / sdfHeight
        );

        // Use an exponential scale to ensure the texels very near the glyph path have adequate
        // precision, while allowing the distance field to cover the entire texture, given that
        // there are only 8 bits available. Formula visualized: https://www.desmos.com/calculator/uiaq5aqiam
        var alpha = Math.pow((1 - Math.abs(signedDist) / maxDistance), sdfExponent) / 2;
        if (signedDist < 0) {
          alpha = 1 - alpha;
        }

        alpha = Math.max(0, Math.min(255, Math.round(alpha * 255))); //clamp
        textureData[sdfY * sdfWidth + sdfX] = alpha;
      }
    }

    return textureData

    /**
     * For a given x/y, search the index for the closest line segment and return
     * its signed distance. Negative = inside, positive = outside, zero = on edge
     * @param x
     * @param y
     * @returns {number}
     */
    function findNearestSignedDistance (x, y) {
      var closestDistSq = Infinity;
      var closestDist = Infinity;

      for (var i = segments.length; i--;) {
        var seg = segments[i];
        if (seg.maxX + closestDist <= x) { break } //sorting by maxX means no more can be closer, so we can short-circuit
        if (x + closestDist > seg.minX && y - closestDist < seg.maxY && y + closestDist > seg.minY) {
          var distSq = absSquareDistanceToLineSegment(x, y, seg.x1, seg.y1, seg.x2, seg.y2);
          if (distSq < closestDistSq) {
            closestDistSq = distSq;
            closestDist = Math.sqrt(closestDistSq);
          }
        }
      }

      // Flip to negative distance if inside the poly
      if (isPointInPoly(x, y)) {
        closestDist = -closestDist;
      }
      return closestDist
    }

    /**
     * Determine whether the given point lies inside or outside the glyph. Uses a simple
     * winding-number ray casting algorithm using a ray pointing east from the point.
     */
    function isPointInPoly (x, y) {
      var winding = 0;
      for (var i = segments.length; i--;) {
        var seg = segments[i];
        if (seg.maxX <= x) { break } //sorting by maxX means no more can cross, so we can short-circuit
        var intersects = ((seg.y1 > y) !== (seg.y2 > y)) && (x < (seg.x2 - seg.x1) * (y - seg.y1) / (seg.y2 - seg.y1) + seg.x1);
        if (intersects) {
          winding += seg.y1 < seg.y2 ? 1 : -1;
        }
      }
      return winding !== 0
    }
  }

  function generateIntoCanvas$2(sdfWidth, sdfHeight, path, viewBox, maxDistance, sdfExponent, canvas, x, y, channel) {
    if ( sdfExponent === void 0 ) sdfExponent = 1;
    if ( x === void 0 ) x = 0;
    if ( y === void 0 ) y = 0;
    if ( channel === void 0 ) channel = 0;

    generateIntoFramebuffer$1(sdfWidth, sdfHeight, path, viewBox, maxDistance, sdfExponent, canvas, null, x, y, channel);
  }

  function generateIntoFramebuffer$1 (sdfWidth, sdfHeight, path, viewBox, maxDistance, sdfExponent, glOrCanvas, framebuffer, x, y, channel) {
    if ( sdfExponent === void 0 ) sdfExponent = 1;
    if ( x === void 0 ) x = 0;
    if ( y === void 0 ) y = 0;
    if ( channel === void 0 ) channel = 0;

    var data = generate$2(sdfWidth, sdfHeight, path, viewBox, maxDistance, sdfExponent);
    // Expand single-channel data to rbga
    var rgbaData = new Uint8Array(data.length * 4);
    for (var i = 0; i < data.length; i++) {
      rgbaData[i * 4 + channel] = data[i];
    }
    renderImageData(glOrCanvas, rgbaData, x, y, sdfWidth, sdfHeight, 1 << (3 - channel), framebuffer);
  }

  /**
   * Find the absolute distance from a point to a line segment at closest approach
   */
  function absSquareDistanceToLineSegment (x, y, lineX0, lineY0, lineX1, lineY1) {
    var ldx = lineX1 - lineX0;
    var ldy = lineY1 - lineY0;
    var lengthSq = ldx * ldx + ldy * ldy;
    var t = lengthSq ? Math.max(0, Math.min(1, ((x - lineX0) * ldx + (y - lineY0) * ldy) / lengthSq)) : 0;
    var dx = x - (lineX0 + t * ldx);
    var dy = y - (lineY0 + t * ldy);
    return dx * dx + dy * dy
  }

  var javascript = /*#__PURE__*/Object.freeze({
    __proto__: null,
    generate: generate$2,
    generateIntoCanvas: generateIntoCanvas$2,
    generateIntoFramebuffer: generateIntoFramebuffer$1
  });

  var mainVertex = "precision highp float;uniform vec4 uGlyphBounds;attribute vec2 aUV;attribute vec4 aLineSegment;varying vec4 vLineSegment;varying vec2 vGlyphXY;void main(){vLineSegment=aLineSegment;vGlyphXY=mix(uGlyphBounds.xy,uGlyphBounds.zw,aUV);gl_Position=vec4(mix(vec2(-1.0),vec2(1.0),aUV),0.0,1.0);}";

  var mainFragment = "precision highp float;uniform vec4 uGlyphBounds;uniform float uMaxDistance;uniform float uExponent;varying vec4 vLineSegment;varying vec2 vGlyphXY;float absDistToSegment(vec2 point,vec2 lineA,vec2 lineB){vec2 lineDir=lineB-lineA;float lenSq=dot(lineDir,lineDir);float t=lenSq==0.0 ? 0.0 : clamp(dot(point-lineA,lineDir)/lenSq,0.0,1.0);vec2 linePt=lineA+t*lineDir;return distance(point,linePt);}void main(){vec4 seg=vLineSegment;vec2 p=vGlyphXY;float dist=absDistToSegment(p,seg.xy,seg.zw);float val=pow(1.0-clamp(dist/uMaxDistance,0.0,1.0),uExponent)*0.5;bool crossing=(seg.y>p.y!=seg.w>p.y)&&(p.x<(seg.z-seg.x)*(p.y-seg.y)/(seg.w-seg.y)+seg.x);bool crossingUp=crossing&&vLineSegment.y<vLineSegment.w;gl_FragColor=vec4(crossingUp ? 1.0/255.0 : 0.0,crossing&&!crossingUp ? 1.0/255.0 : 0.0,0.0,val);}";

  var postFragment = "precision highp float;uniform sampler2D tex;varying vec2 vUV;void main(){vec4 color=texture2D(tex,vUV);bool inside=color.r!=color.g;float val=inside ? 1.0-color.a : color.a;gl_FragColor=vec4(val);}";

  // Single triangle covering viewport
  var viewportUVs = new Float32Array([0, 0, 2, 0, 0, 2]);

  var implicitContext = null;
  var isTestingSupport = false;
  var NULL_OBJECT = {};
  var supportByCanvas = new WeakMap(); // canvas -> bool

  function validateSupport (glOrCanvas) {
    if (!isTestingSupport && !isSupported(glOrCanvas)) {
      throw new Error('WebGL generation not supported')
    }
  }

  function generate$1 (sdfWidth, sdfHeight, path, viewBox, maxDistance, sdfExponent, glOrCanvas) {
    if ( sdfExponent === void 0 ) sdfExponent = 1;
    if ( glOrCanvas === void 0 ) glOrCanvas = null;

    if (!glOrCanvas) {
      glOrCanvas = implicitContext;
      if (!glOrCanvas) {
        var canvas = typeof OffscreenCanvas === 'function'
          ? new OffscreenCanvas(1, 1)
          : typeof document !== 'undefined'
            ? document.createElement('canvas')
            : null;
        if (!canvas) {
          throw new Error('OffscreenCanvas or DOM canvas not supported')
        }
        glOrCanvas = implicitContext = canvas.getContext('webgl', { depth: false });
      }
    }

    validateSupport(glOrCanvas);

    var rgbaData = new Uint8Array(sdfWidth * sdfHeight * 4); //not Uint8ClampedArray, cuz Safari

    // Render into a background texture framebuffer
    withWebGLContext(glOrCanvas, function (ref) {
      var gl = ref.gl;
      var withTexture = ref.withTexture;
      var withTextureFramebuffer = ref.withTextureFramebuffer;

      withTexture('readable', function (texture, textureUnit) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, sdfWidth, sdfHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

        withTextureFramebuffer(texture, textureUnit, function (framebuffer) {
          generateIntoFramebuffer(
            sdfWidth,
            sdfHeight,
            path,
            viewBox,
            maxDistance,
            sdfExponent,
            gl,
            framebuffer,
            0,
            0,
            0 // red channel
          );
          gl.readPixels(0, 0, sdfWidth, sdfHeight, gl.RGBA, gl.UNSIGNED_BYTE, rgbaData);
        });
      });
    });

    // Throw away all but the red channel
    var data = new Uint8Array(sdfWidth * sdfHeight);
    for (var i = 0, j = 0; i < rgbaData.length; i += 4) {
      data[j++] = rgbaData[i];
    }

    return data
  }

  function generateIntoCanvas$1(sdfWidth, sdfHeight, path, viewBox, maxDistance, sdfExponent, canvas, x, y, channel) {
    if ( sdfExponent === void 0 ) sdfExponent = 1;
    if ( x === void 0 ) x = 0;
    if ( y === void 0 ) y = 0;
    if ( channel === void 0 ) channel = 0;

    generateIntoFramebuffer(sdfWidth, sdfHeight, path, viewBox, maxDistance, sdfExponent, canvas, null, x, y, channel);
  }

  function generateIntoFramebuffer (sdfWidth, sdfHeight, path, viewBox, maxDistance, sdfExponent, glOrCanvas, framebuffer, x, y, channel) {
    if ( sdfExponent === void 0 ) sdfExponent = 1;
    if ( x === void 0 ) x = 0;
    if ( y === void 0 ) y = 0;
    if ( channel === void 0 ) channel = 0;

    // Verify support
    validateSupport(glOrCanvas);

    // Compute path segments
    var lineSegmentCoords = [];
    pathToLineSegments(path, function (x1, y1, x2, y2) {
      lineSegmentCoords.push(x1, y1, x2, y2);
    });
    lineSegmentCoords = new Float32Array(lineSegmentCoords);

    withWebGLContext(glOrCanvas, function (ref) {
      var gl = ref.gl;
      var isWebGL2 = ref.isWebGL2;
      var getExtension = ref.getExtension;
      var withProgram = ref.withProgram;
      var withTexture = ref.withTexture;
      var withTextureFramebuffer = ref.withTextureFramebuffer;
      var handleContextLoss = ref.handleContextLoss;

      withTexture('rawDistances', function (intermediateTexture, intermediateTextureUnit) {
        if (sdfWidth !== intermediateTexture._lastWidth || sdfHeight !== intermediateTexture._lastHeight) {
          gl.texImage2D(
            gl.TEXTURE_2D, 0, gl.RGBA,
            intermediateTexture._lastWidth = sdfWidth,
            intermediateTexture._lastHeight = sdfHeight,
            0, gl.RGBA, gl.UNSIGNED_BYTE, null
          );
        }

        // Unsigned distance pass
        withProgram('main', mainVertex, mainFragment, function (ref) {
          var setAttribute = ref.setAttribute;
          var setUniform = ref.setUniform;

          // Init extensions
          var instancingExtension = !isWebGL2 && getExtension('ANGLE_instanced_arrays');
          var blendMinMaxExtension = !isWebGL2 && getExtension('EXT_blend_minmax');

          // Init/update attributes
          setAttribute('aUV', 2, gl.STATIC_DRAW, 0, viewportUVs);
          setAttribute('aLineSegment', 4, gl.DYNAMIC_DRAW, 1, lineSegmentCoords);

          // Init/update uniforms
          setUniform.apply(void 0, [ '4f', 'uGlyphBounds' ].concat( viewBox ));
          setUniform('1f', 'uMaxDistance', maxDistance);
          setUniform('1f', 'uExponent', sdfExponent);

          // Render initial unsigned distance / winding number info to a texture
          withTextureFramebuffer(intermediateTexture, intermediateTextureUnit, function (framebuffer) {
            gl.enable(gl.BLEND);
            gl.colorMask(true, true, true, true);
            gl.viewport(0, 0, sdfWidth, sdfHeight);
            gl.scissor(0, 0, sdfWidth, sdfHeight);
            gl.blendFunc(gl.ONE, gl.ONE);
            // Red+Green channels are incremented (FUNC_ADD) for segment-ray crossings to give a "winding number".
            // Alpha holds the closest (MAX) unsigned distance.
            gl.blendEquationSeparate(gl.FUNC_ADD, isWebGL2 ? gl.MAX : blendMinMaxExtension.MAX_EXT);
            gl.clear(gl.COLOR_BUFFER_BIT);
            if (isWebGL2) {
              gl.drawArraysInstanced(gl.TRIANGLES, 0, 3, lineSegmentCoords.length / 4);
            } else {
              instancingExtension.drawArraysInstancedANGLE(gl.TRIANGLES, 0, 3, lineSegmentCoords.length / 4);
            }
            // Debug
            // const debug = new Uint8Array(sdfWidth * sdfHeight * 4)
            // gl.readPixels(0, 0, sdfWidth, sdfHeight, gl.RGBA, gl.UNSIGNED_BYTE, debug)
            // console.log('intermediate texture data: ', debug)
          });
        });

        // Use the data stored in the texture to apply inside/outside and write to the output framebuffer rect+channel.
        withProgram('post', viewportQuadVertex, postFragment, function (program) {
          program.setAttribute('aUV', 2, gl.STATIC_DRAW, 0, viewportUVs);
          program.setUniform('1i', 'tex', intermediateTextureUnit);
          gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
          gl.disable(gl.BLEND);
          gl.colorMask(channel === 0, channel === 1, channel === 2, channel === 3);
          gl.viewport(x, y, sdfWidth, sdfHeight);
          gl.scissor(x, y, sdfWidth, sdfHeight);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
        });
      });

      // Handle context loss occurring during any of the above calls
      if (gl.isContextLost()) {
        handleContextLoss();
        throw new Error('webgl context lost')
      }
    });
  }

  function isSupported (glOrCanvas) {
    var key = (!glOrCanvas || glOrCanvas === implicitContext) ? NULL_OBJECT : (glOrCanvas.canvas || glOrCanvas);
    var supported = supportByCanvas.get(key);
    if (supported === undefined) {
      isTestingSupport = true;
      var failReason = null;
      try {
        // Since we can't detect all failure modes up front, let's just do a trial run of a
        // simple path and compare what we get back to the correct expected result. This will
        // also serve to prime the shader compilation.
        var expectedResult = [
          97, 106, 97, 61,
          99, 137, 118, 80,
          80, 118, 137, 99,
          61, 97, 106, 97
        ];
        var testResult = generate$1(
          4,
          4,
          'M8,8L16,8L24,24L16,24Z',
          [0, 0, 32, 32],
          24,
          1,
          glOrCanvas
        );
        supported = testResult && expectedResult.length === testResult.length &&
          testResult.every(function (val, i) { return val === expectedResult[i]; });
        if (!supported) {
          failReason = 'bad trial run results';
          console.info(expectedResult, testResult);
        }
      } catch (err) {
        // TODO if it threw due to webgl context loss, should we maybe leave isSupported as null and try again later?
        supported = false;
        failReason = err.message;
      }
      if (failReason) {
        console.warn('WebGL SDF generation not supported:', failReason);
      }
      isTestingSupport = false;
      supportByCanvas.set(key, supported);
    }
    return supported
  }

  var webgl = /*#__PURE__*/Object.freeze({
    __proto__: null,
    generate: generate$1,
    generateIntoCanvas: generateIntoCanvas$1,
    generateIntoFramebuffer: generateIntoFramebuffer,
    isSupported: isSupported
  });

  /**
   * Generate an SDF texture image for a 2D path.
   *
   * @param {number} sdfWidth - width of the SDF output image in pixels.
   * @param {number} sdfHeight - height of the SDF output image in pixels.
   * @param {string} path - an SVG-like path string describing the glyph; should only contain commands: M/L/Q/C/Z.
   * @param {number[]} viewBox - [minX, minY, maxX, maxY] in font units aligning with the texture's edges.
   * @param {number} maxDistance - the maximum distance from the glyph path in font units that will be encoded; defaults
   *        to half the maximum viewBox dimension.
   * @param {number} [sdfExponent] - specifies an exponent for encoding the SDF's distance values; higher exponents
   *        will give greater precision nearer the glyph's path.
   * @return {Uint8Array}
   */
  function generate(
    sdfWidth,
    sdfHeight,
    path,
    viewBox,
    maxDistance,
    sdfExponent
  ) {
    if ( maxDistance === void 0 ) maxDistance = Math.max(viewBox[2] - viewBox[0], viewBox[3] - viewBox[1]) / 2;
    if ( sdfExponent === void 0 ) sdfExponent = 1;

    try {
      return generate$1.apply(webgl, arguments)
    } catch(e) {
      console.info('WebGL SDF generation failed, falling back to JS', e);
      return generate$2.apply(javascript, arguments)
    }
  }

  /**
   * Generate an SDF texture image for a 2D path, inserting the result into a WebGL `canvas` at a given x/y position
   * and color channel. This is generally much faster than calling `generate` because it does not require reading pixels
   * back from the GPU->CPU -- the `canvas` can be used directly as a WebGL texture image, so it all stays on the GPU.
   *
   * @param {number} sdfWidth - width of the SDF output image in pixels.
   * @param {number} sdfHeight - height of the SDF output image in pixels.
   * @param {string} path - an SVG-like path string describing the glyph; should only contain commands: M/L/Q/C/Z.
   * @param {number[]} viewBox - [minX, minY, maxX, maxY] in font units aligning with the texture's edges.
   * @param {number} maxDistance - the maximum distance from the glyph path in font units that will be encoded; defaults
   *        to half the maximum viewBox dimension.
   * @param {number} [sdfExponent] - specifies an exponent for encoding the SDF's distance values; higher exponents
   *        will give greater precision nearer the glyph's path.
   * @param {HTMLCanvasElement|OffscreenCanvas} canvas - a WebGL-enabled canvas into which the SDF will be rendered.
   *        Only the relevant rect/channel will be modified, the rest will be preserved. To avoid unpredictable results
   *        due to shared GL context state, this canvas should be dedicated to use by this library alone.
   * @param {number} x - the x position at which to render the SDF.
   * @param {number} y - the y position at which to render the SDF.
   * @param {number} channel - the color channel index (0-4) into which the SDF will be rendered.
   * @return {Uint8Array}
   */
  function generateIntoCanvas(
    sdfWidth,
    sdfHeight,
    path,
    viewBox,
    maxDistance,
    sdfExponent,
    canvas,
    x,
    y,
    channel
  ) {
    if ( maxDistance === void 0 ) maxDistance = Math.max(viewBox[2] - viewBox[0], viewBox[3] - viewBox[1]) / 2;
    if ( sdfExponent === void 0 ) sdfExponent = 1;
    if ( x === void 0 ) x = 0;
    if ( y === void 0 ) y = 0;
    if ( channel === void 0 ) channel = 0;

    try {
      return generateIntoCanvas$1.apply(webgl, arguments)
    } catch(e) {
      console.info('WebGL SDF generation failed, falling back to JS', e);
      return generateIntoCanvas$2.apply(javascript, arguments)
    }
  }

  exports.forEachPathCommand = forEachPathCommand;
  exports.generate = generate;
  exports.generateIntoCanvas = generateIntoCanvas;
  exports.javascript = javascript;
  exports.pathToLineSegments = pathToLineSegments;
  exports.webgl = webgl;
  exports.webglUtils = webglUtils;

  Object.defineProperty(exports, '__esModule', { value: true });

  return exports;

}({}));
return exports
}

function bidiFactory() {
var bidi = (function (exports) {

  // Bidi character types data, auto generated
  var DATA = {
    "R": "13k,1a,2,3,3,2+1j,ch+16,a+1,5+2,2+n,5,a,4,6+16,4+3,h+1b,4mo,179q,2+9,2+11,2i9+7y,2+68,4,3+4,5+13,4+3,2+4k,3+29,8+cf,1t+7z,w+17,3+3m,1t+3z,16o1+5r,8+30,8+mc,29+1r,29+4v,75+73",
    "EN": "1c+9,3d+1,6,187+9,513,4+5,7+9,sf+j,175h+9,qw+q,161f+1d,4xt+a,25i+9",
    "ES": "17,2,6dp+1,f+1,av,16vr,mx+1,4o,2",
    "ET": "z+2,3h+3,b+1,ym,3e+1,2o,p4+1,8,6u,7c,g6,1wc,1n9+4,30+1b,2n,6d,qhx+1,h0m,a+1,49+2,63+1,4+1,6bb+3,12jj",
    "AN": "16o+5,2j+9,2+1,35,ed,1ff2+9,87+u",
    "CS": "18,2+1,b,2u,12k,55v,l,17v0,2,3,53,2+1,b",
    "B": "a,3,f+2,2v,690",
    "S": "9,2,k",
    "WS": "c,k,4f4,1vk+a,u,1j,335",
    "ON": "x+1,4+4,h+5,r+5,r+3,z,5+3,2+1,2+1,5,2+2,3+4,o,w,ci+1,8+d,3+d,6+8,2+g,39+1,9,6+1,2,33,b8,3+1,3c+1,7+1,5r,b,7h+3,sa+5,2,3i+6,jg+3,ur+9,2v,ij+1,9g+9,7+a,8m,4+1,49+x,14u,2+2,c+2,e+2,e+2,e+1,i+n,e+e,2+p,u+2,e+2,36+1,2+3,2+1,b,2+2,6+5,2,2,2,h+1,5+4,6+3,3+f,16+2,5+3l,3+81,1y+p,2+40,q+a,m+13,2r+ch,2+9e,75+hf,3+v,2+2w,6e+5,f+6,75+2a,1a+p,2+2g,d+5x,r+b,6+3,4+o,g,6+1,6+2,2k+1,4,2j,5h+z,1m+1,1e+f,t+2,1f+e,d+3,4o+3,2s+1,w,535+1r,h3l+1i,93+2,2s,b+1,3l+x,2v,4g+3,21+3,kz+1,g5v+1,5a,j+9,n+v,2,3,2+8,2+1,3+2,2,3,46+1,4+4,h+5,r+5,r+a,3h+2,4+6,b+4,78,1r+24,4+c,4,1hb,ey+6,103+j,16j+c,1ux+7,5+g,fsh,jdq+1t,4,57+2e,p1,1m,1m,1m,1m,4kt+1,7j+17,5+2r,d+e,3+e,2+e,2+10,m+4,w,1n+5,1q,4z+5,4b+rb,9+c,4+c,4+37,d+2g,8+b,l+b,5+1j,9+9,7+13,9+t,3+1,27+3c,2+29,2+3q,d+d,3+4,4+2,6+6,a+o,8+6,a+2,e+6,16+42,2+1i",
    "BN": "0+8,6+d,2s+5,2+p,e,4m9,1kt+2,2b+5,5+5,17q9+v,7k,6p+8,6+1,119d+3,440+7,96s+1,1ekf+1,1ekf+1,1ekf+1,1ekf+1,1ekf+1,1ekf+1,1ekf+1,1ekf+1,1ekf+1,1ekf+1,1ekf+1,1ekf+75,6p+2rz,1ben+1,1ekf+1,1ekf+1",
    "NSM": "lc+33,7o+6,7c+18,2,2+1,2+1,2,21+a,1d+k,h,2u+6,3+5,3+1,2+3,10,v+q,2k+a,1n+8,a,p+3,2+8,2+2,2+4,18+2,3c+e,2+v,1k,2,5+7,5,4+6,b+1,u,1n,5+3,9,l+1,r,3+1,1m,5+1,5+1,3+2,4,v+1,4,c+1,1m,5+4,2+1,5,l+1,n+5,2,1n,3,2+3,9,8+1,c+1,v,1q,d,1f,4,1m+2,6+2,2+3,8+1,c+1,u,1n,g+1,l+1,t+1,1m+1,5+3,9,l+1,u,21,8+2,2,2j,3+6,d+7,2r,3+8,c+5,23+1,s,2,2,1k+d,2+4,2+1,6+a,2+z,a,2v+3,2+5,2+1,3+1,q+1,5+2,h+3,e,3+1,7,g,jk+2,qb+2,u+2,u+1,v+1,1t+1,2+6,9,3+a,a,1a+2,3c+1,z,3b+2,5+1,a,7+2,64+1,3,1n,2+6,2,2,3+7,7+9,3,1d+g,1s+3,1d,2+4,2,6,15+8,d+1,x+3,3+1,2+2,1l,2+1,4,2+2,1n+7,3+1,49+2,2+c,2+6,5,7,4+1,5j+1l,2+4,k1+w,2db+2,3y,2p+v,ff+3,30+1,n9x+3,2+9,x+1,29+1,7l,4,5,q+1,6,48+1,r+h,e,13+7,q+a,1b+2,1d,3+3,3+1,14,1w+5,3+1,3+1,d,9,1c,1g,2+2,3+1,6+1,2,17+1,9,6n,3,5,fn5,ki+f,h+f,r2,6b,46+4,1af+2,2+1,6+3,15+2,5,4m+1,fy+3,as+1,4a+a,4x,1j+e,1l+2,1e+3,3+1,1y+2,11+4,2+7,1r,d+1,1h+8,b+3,3,2o+2,3,2+1,7,4h,4+7,m+1,1m+1,4,12+6,4+4,5g+7,3+2,2,o,2d+5,2,5+1,2+1,6n+3,7+1,2+1,s+1,2e+7,3,2+1,2z,2,3+5,2,2u+2,3+3,2+4,78+8,2+1,75+1,2,5,41+3,3+1,5,x+5,3+1,15+5,3+3,9,a+5,3+2,1b+c,2+1,bb+6,2+5,2d+l,3+6,2+1,2+1,3f+5,4,2+1,2+6,2,21+1,4,2,9o+1,f0c+4,1o+6,t5,1s+3,2a,f5l+1,43t+2,i+7,3+6,v+3,45+2,1j0+1i,5+1d,9,f,n+4,2+e,11t+6,2+g,3+6,2+1,2+4,7a+6,c6+3,15t+6,32+6,gzhy+6n",
    "AL": "16w,3,2,e+1b,z+2,2+2s,g+1,8+1,b+m,2+t,s+2i,c+e,4h+f,1d+1e,1bwe+dp,3+3z,x+c,2+1,35+3y,2rm+z,5+7,b+5,dt+l,c+u,17nl+27,1t+27,4x+6n,3+d",
    "LRO": "6ct",
    "RLO": "6cu",
    "LRE": "6cq",
    "RLE": "6cr",
    "PDF": "6cs",
    "LRI": "6ee",
    "RLI": "6ef",
    "FSI": "6eg",
    "PDI": "6eh"
  };

  var TYPES = {};
  var TYPES_TO_NAMES = {};
  TYPES.L = 1; //L is the default
  TYPES_TO_NAMES[1] = 'L';
  Object.keys(DATA).forEach(function (type, i) {
    TYPES[type] = 1 << (i + 1);
    TYPES_TO_NAMES[TYPES[type]] = type;
  });
  Object.freeze(TYPES);

  var ISOLATE_INIT_TYPES = TYPES.LRI | TYPES.RLI | TYPES.FSI;
  var STRONG_TYPES = TYPES.L | TYPES.R | TYPES.AL;
  var NEUTRAL_ISOLATE_TYPES = TYPES.B | TYPES.S | TYPES.WS | TYPES.ON | TYPES.FSI | TYPES.LRI | TYPES.RLI | TYPES.PDI;
  var BN_LIKE_TYPES = TYPES.BN | TYPES.RLE | TYPES.LRE | TYPES.RLO | TYPES.LRO | TYPES.PDF;
  var TRAILING_TYPES = TYPES.S | TYPES.WS | TYPES.B | ISOLATE_INIT_TYPES | TYPES.PDI | BN_LIKE_TYPES;

  var map = null;

  function parseData () {
    if (!map) {
      //const start = performance.now()
      map = new Map();
      var loop = function ( type ) {
        if (DATA.hasOwnProperty(type)) {
          var lastCode = 0;
          DATA[type].split(',').forEach(function (range) {
            var ref = range.split('+');
            var skip = ref[0];
            var step = ref[1];
            skip = parseInt(skip, 36);
            step = step ? parseInt(step, 36) : 0;
            map.set(lastCode += skip, TYPES[type]);
            for (var i = 0; i < step; i++) {
              map.set(++lastCode, TYPES[type]);
            }
          });
        }
      };

      for (var type in DATA) loop( type );
      //console.log(`char types parsed in ${performance.now() - start}ms`)
    }
  }

  /**
   * @param {string} char
   * @return {number}
   */
  function getBidiCharType (char) {
    parseData();
    return map.get(char.codePointAt(0)) || TYPES.L
  }

  function getBidiCharTypeName(char) {
    return TYPES_TO_NAMES[getBidiCharType(char)]
  }

  // Bidi bracket pairs data, auto generated
  var data$1 = {
    "pairs": "14>1,1e>2,u>2,2wt>1,1>1,1ge>1,1wp>1,1j>1,f>1,hm>1,1>1,u>1,u6>1,1>1,+5,28>1,w>1,1>1,+3,b8>1,1>1,+3,1>3,-1>-1,3>1,1>1,+2,1s>1,1>1,x>1,th>1,1>1,+2,db>1,1>1,+3,3>1,1>1,+2,14qm>1,1>1,+1,4q>1,1e>2,u>2,2>1,+1",
    "canonical": "6f1>-6dx,6dy>-6dx,6ec>-6ed,6ee>-6ed,6ww>2jj,-2ji>2jj,14r4>-1e7l,1e7m>-1e7l,1e7m>-1e5c,1e5d>-1e5b,1e5c>-14qx,14qy>-14qx,14vn>-1ecg,1ech>-1ecg,1edu>-1ecg,1eci>-1ecg,1eda>-1ecg,1eci>-1ecg,1eci>-168q,168r>-168q,168s>-14ye,14yf>-14ye"
  };

  /**
   * Parses an string that holds encoded codepoint mappings, e.g. for bracket pairs or
   * mirroring characters, as encoded by scripts/generateBidiData.js. Returns an object
   * holding the `map`, and optionally a `reverseMap` if `includeReverse:true`.
   * @param {string} encodedString
   * @param {boolean} includeReverse - true if you want reverseMap in the output
   * @return {{map: Map<number, number>, reverseMap?: Map<number, number>}}
   */
  function parseCharacterMap (encodedString, includeReverse) {
    var radix = 36;
    var lastCode = 0;
    var map = new Map();
    var reverseMap = includeReverse && new Map();
    var prevPair;
    encodedString.split(',').forEach(function visit(entry) {
      if (entry.indexOf('+') !== -1) {
        for (var i = +entry; i--;) {
          visit(prevPair);
        }
      } else {
        prevPair = entry;
        var ref = entry.split('>');
        var a = ref[0];
        var b = ref[1];
        a = String.fromCodePoint(lastCode += parseInt(a, radix));
        b = String.fromCodePoint(lastCode += parseInt(b, radix));
        map.set(a, b);
        includeReverse && reverseMap.set(b, a);
      }
    });
    return { map: map, reverseMap: reverseMap }
  }

  var openToClose, closeToOpen, canonical;

  function parse$1 () {
    if (!openToClose) {
      //const start = performance.now()
      var ref = parseCharacterMap(data$1.pairs, true);
      var map = ref.map;
      var reverseMap = ref.reverseMap;
      openToClose = map;
      closeToOpen = reverseMap;
      canonical = parseCharacterMap(data$1.canonical, false).map;
      //console.log(`brackets parsed in ${performance.now() - start}ms`)
    }
  }

  function openingToClosingBracket (char) {
    parse$1();
    return openToClose.get(char) || null
  }

  function closingToOpeningBracket (char) {
    parse$1();
    return closeToOpen.get(char) || null
  }

  function getCanonicalBracket (char) {
    parse$1();
    return canonical.get(char) || null
  }

  // Local type aliases
  var TYPE_L = TYPES.L;
  var TYPE_R = TYPES.R;
  var TYPE_EN = TYPES.EN;
  var TYPE_ES = TYPES.ES;
  var TYPE_ET = TYPES.ET;
  var TYPE_AN = TYPES.AN;
  var TYPE_CS = TYPES.CS;
  var TYPE_B = TYPES.B;
  var TYPE_S = TYPES.S;
  var TYPE_ON = TYPES.ON;
  var TYPE_BN = TYPES.BN;
  var TYPE_NSM = TYPES.NSM;
  var TYPE_AL = TYPES.AL;
  var TYPE_LRO = TYPES.LRO;
  var TYPE_RLO = TYPES.RLO;
  var TYPE_LRE = TYPES.LRE;
  var TYPE_RLE = TYPES.RLE;
  var TYPE_PDF = TYPES.PDF;
  var TYPE_LRI = TYPES.LRI;
  var TYPE_RLI = TYPES.RLI;
  var TYPE_FSI = TYPES.FSI;
  var TYPE_PDI = TYPES.PDI;

  /**
   * @typedef {object} GetEmbeddingLevelsResult
   * @property {{start, end, level}[]} paragraphs
   * @property {Uint8Array} levels
   */

  /**
   * This function applies the Bidirectional Algorithm to a string, returning the resolved embedding levels
   * in a single Uint8Array plus a list of objects holding each paragraph's start and end indices and resolved
   * base embedding level.
   *
   * @param {string} string - The input string
   * @param {"ltr"|"rtl"|"auto"} [baseDirection] - Use "ltr" or "rtl" to force a base paragraph direction,
   *        otherwise a direction will be chosen automatically from each paragraph's contents.
   * @return {GetEmbeddingLevelsResult}
   */
  function getEmbeddingLevels (string, baseDirection) {
    var MAX_DEPTH = 125;

    // Start by mapping all characters to their unicode type, as a bitmask integer
    var charTypes = new Uint32Array(string.length);
    for (var i = 0; i < string.length; i++) {
      charTypes[i] = getBidiCharType(string[i]);
    }

    var charTypeCounts = new Map(); //will be cleared at start of each paragraph
    function changeCharType(i, type) {
      var oldType = charTypes[i];
      charTypes[i] = type;
      charTypeCounts.set(oldType, charTypeCounts.get(oldType) - 1);
      if (oldType & NEUTRAL_ISOLATE_TYPES) {
        charTypeCounts.set(NEUTRAL_ISOLATE_TYPES, charTypeCounts.get(NEUTRAL_ISOLATE_TYPES) - 1);
      }
      charTypeCounts.set(type, (charTypeCounts.get(type) || 0) + 1);
      if (type & NEUTRAL_ISOLATE_TYPES) {
        charTypeCounts.set(NEUTRAL_ISOLATE_TYPES, (charTypeCounts.get(NEUTRAL_ISOLATE_TYPES) || 0) + 1);
      }
    }

    var embedLevels = new Uint8Array(string.length);
    var isolationPairs = new Map(); //init->pdi and pdi->init

    // === 3.3.1 The Paragraph Level ===
    // 3.3.1 P1: Split the text into paragraphs
    var paragraphs = []; // [{start, end, level}, ...]
    var paragraph = null;
    for (var i$1 = 0; i$1 < string.length; i$1++) {
      if (!paragraph) {
        paragraphs.push(paragraph = {
          start: i$1,
          end: string.length - 1,
          // 3.3.1 P2-P3: Determine the paragraph level
          level: baseDirection === 'rtl' ? 1 : baseDirection === 'ltr' ? 0 : determineAutoEmbedLevel(i$1, false)
        });
      }
      if (charTypes[i$1] & TYPE_B) {
        paragraph.end = i$1;
        paragraph = null;
      }
    }

    var FORMATTING_TYPES = TYPE_RLE | TYPE_LRE | TYPE_RLO | TYPE_LRO | ISOLATE_INIT_TYPES | TYPE_PDI | TYPE_PDF | TYPE_B;
    var nextEven = function (n) { return n + ((n & 1) ? 1 : 2); };
    var nextOdd = function (n) { return n + ((n & 1) ? 2 : 1); };

    // Everything from here on will operate per paragraph.
    for (var paraIdx = 0; paraIdx < paragraphs.length; paraIdx++) {
      paragraph = paragraphs[paraIdx];
      var statusStack = [{
        _level: paragraph.level,
        _override: 0, //0=neutral, 1=L, 2=R
        _isolate: 0 //bool
      }];
      var stackTop = (void 0);
      var overflowIsolateCount = 0;
      var overflowEmbeddingCount = 0;
      var validIsolateCount = 0;
      charTypeCounts.clear();

      // === 3.3.2 Explicit Levels and Directions ===
      for (var i$2 = paragraph.start; i$2 <= paragraph.end; i$2++) {
        var charType = charTypes[i$2];
        stackTop = statusStack[statusStack.length - 1];

        // Set initial counts
        charTypeCounts.set(charType, (charTypeCounts.get(charType) || 0) + 1);
        if (charType & NEUTRAL_ISOLATE_TYPES) {
          charTypeCounts.set(NEUTRAL_ISOLATE_TYPES, (charTypeCounts.get(NEUTRAL_ISOLATE_TYPES) || 0) + 1);
        }

        // Explicit Embeddings: 3.3.2 X2 - X3
        if (charType & FORMATTING_TYPES) { //prefilter all formatters
          if (charType & (TYPE_RLE | TYPE_LRE)) {
            embedLevels[i$2] = stackTop._level; // 5.2
            var level = (charType === TYPE_RLE ? nextOdd : nextEven)(stackTop._level);
            if (level <= MAX_DEPTH && !overflowIsolateCount && !overflowEmbeddingCount) {
              statusStack.push({
                _level: level,
                _override: 0,
                _isolate: 0
              });
            } else if (!overflowIsolateCount) {
              overflowEmbeddingCount++;
            }
          }

          // Explicit Overrides: 3.3.2 X4 - X5
          else if (charType & (TYPE_RLO | TYPE_LRO)) {
            embedLevels[i$2] = stackTop._level; // 5.2
            var level$1 = (charType === TYPE_RLO ? nextOdd : nextEven)(stackTop._level);
            if (level$1 <= MAX_DEPTH && !overflowIsolateCount && !overflowEmbeddingCount) {
              statusStack.push({
                _level: level$1,
                _override: (charType & TYPE_RLO) ? TYPE_R : TYPE_L,
                _isolate: 0
              });
            } else if (!overflowIsolateCount) {
              overflowEmbeddingCount++;
            }
          }

          // Isolates: 3.3.2 X5a - X5c
          else if (charType & ISOLATE_INIT_TYPES) {
            // X5c - FSI becomes either RLI or LRI
            if (charType & TYPE_FSI) {
              charType = determineAutoEmbedLevel(i$2 + 1, true) === 1 ? TYPE_RLI : TYPE_LRI;
            }

            embedLevels[i$2] = stackTop._level;
            if (stackTop._override) {
              changeCharType(i$2, stackTop._override);
            }
            var level$2 = (charType === TYPE_RLI ? nextOdd : nextEven)(stackTop._level);
            if (level$2 <= MAX_DEPTH && overflowIsolateCount === 0 && overflowEmbeddingCount === 0) {
              validIsolateCount++;
              statusStack.push({
                _level: level$2,
                _override: 0,
                _isolate: 1,
                _isolInitIndex: i$2
              });
            } else {
              overflowIsolateCount++;
            }
          }

          // Terminating Isolates: 3.3.2 X6a
          else if (charType & TYPE_PDI) {
            if (overflowIsolateCount > 0) {
              overflowIsolateCount--;
            } else if (validIsolateCount > 0) {
              overflowEmbeddingCount = 0;
              while (!statusStack[statusStack.length - 1]._isolate) {
                statusStack.pop();
              }
              // Add to isolation pairs bidirectional mapping:
              var isolInitIndex = statusStack[statusStack.length - 1]._isolInitIndex;
              if (isolInitIndex != null) {
                isolationPairs.set(isolInitIndex, i$2);
                isolationPairs.set(i$2, isolInitIndex);
              }
              statusStack.pop();
              validIsolateCount--;
            }
            stackTop = statusStack[statusStack.length - 1];
            embedLevels[i$2] = stackTop._level;
            if (stackTop._override) {
              changeCharType(i$2, stackTop._override);
            }
          }


          // Terminating Embeddings and Overrides: 3.3.2 X7
          else if (charType & TYPE_PDF) {
            if (overflowIsolateCount === 0) {
              if (overflowEmbeddingCount > 0) {
                overflowEmbeddingCount--;
              } else if (!stackTop._isolate && statusStack.length > 1) {
                statusStack.pop();
                stackTop = statusStack[statusStack.length - 1];
              }
            }
            embedLevels[i$2] = stackTop._level; // 5.2
          }

          // End of Paragraph: 3.3.2 X8
          else if (charType & TYPE_B) {
            embedLevels[i$2] = paragraph.level;
          }
        }

        // Non-formatting characters: 3.3.2 X6
        else {
          embedLevels[i$2] = stackTop._level;
          // NOTE: This exclusion of BN seems to go against what section 5.2 says, but is required for test passage
          if (stackTop._override && charType !== TYPE_BN) {
            changeCharType(i$2, stackTop._override);
          }
        }
      }

      // === 3.3.3 Preparations for Implicit Processing ===

      // Remove all RLE, LRE, RLO, LRO, PDF, and BN characters: 3.3.3 X9
      // Note: Due to section 5.2, we won't remove them, but we'll use the BN_LIKE_TYPES bitset to
      // easily ignore them all from here on out.

      // 3.3.3 X10
      // Compute the set of isolating run sequences as specified by BD13
      var levelRuns = [];
      var currentRun = null;
      for (var i$3 = paragraph.start; i$3 <= paragraph.end; i$3++) {
        var charType$1 = charTypes[i$3];
        if (!(charType$1 & BN_LIKE_TYPES)) {
          var lvl = embedLevels[i$3];
          var isIsolInit = charType$1 & ISOLATE_INIT_TYPES;
          var isPDI = charType$1 === TYPE_PDI;
          if (currentRun && lvl === currentRun._level) {
            currentRun._end = i$3;
            currentRun._endsWithIsolInit = isIsolInit;
          } else {
            levelRuns.push(currentRun = {
              _start: i$3,
              _end: i$3,
              _level: lvl,
              _startsWithPDI: isPDI,
              _endsWithIsolInit: isIsolInit
            });
          }
        }
      }
      var isolatingRunSeqs = []; // [{seqIndices: [], sosType: L|R, eosType: L|R}]
      for (var runIdx = 0; runIdx < levelRuns.length; runIdx++) {
        var run = levelRuns[runIdx];
        if (!run._startsWithPDI || (run._startsWithPDI && !isolationPairs.has(run._start))) {
          var seqRuns = [currentRun = run];
          for (var pdiIndex = (void 0); currentRun && currentRun._endsWithIsolInit && (pdiIndex = isolationPairs.get(currentRun._end)) != null;) {
            for (var i$4 = runIdx + 1; i$4 < levelRuns.length; i$4++) {
              if (levelRuns[i$4]._start === pdiIndex) {
                seqRuns.push(currentRun = levelRuns[i$4]);
                break
              }
            }
          }
          // build flat list of indices across all runs:
          var seqIndices = [];
          for (var i$5 = 0; i$5 < seqRuns.length; i$5++) {
            var run$1 = seqRuns[i$5];
            for (var j = run$1._start; j <= run$1._end; j++) {
              seqIndices.push(j);
            }
          }
          // determine the sos/eos types:
          var firstLevel = embedLevels[seqIndices[0]];
          var prevLevel = paragraph.level;
          for (var i$6 = seqIndices[0] - 1; i$6 >= 0; i$6--) {
            if (!(charTypes[i$6] & BN_LIKE_TYPES)) { //5.2
              prevLevel = embedLevels[i$6];
              break
            }
          }
          var lastIndex = seqIndices[seqIndices.length - 1];
          var lastLevel = embedLevels[lastIndex];
          var nextLevel = paragraph.level;
          if (!(charTypes[lastIndex] & ISOLATE_INIT_TYPES)) {
            for (var i$7 = lastIndex + 1; i$7 <= paragraph.end; i$7++) {
              if (!(charTypes[i$7] & BN_LIKE_TYPES)) { //5.2
                nextLevel = embedLevels[i$7];
                break
              }
            }
          }
          isolatingRunSeqs.push({
            _seqIndices: seqIndices,
            _sosType: Math.max(prevLevel, firstLevel) % 2 ? TYPE_R : TYPE_L,
            _eosType: Math.max(nextLevel, lastLevel) % 2 ? TYPE_R : TYPE_L
          });
        }
      }

      // The next steps are done per isolating run sequence
      for (var seqIdx = 0; seqIdx < isolatingRunSeqs.length; seqIdx++) {
        var ref = isolatingRunSeqs[seqIdx];
        var seqIndices$1 = ref._seqIndices;
        var sosType = ref._sosType;
        var eosType = ref._eosType;
        /**
         * All the level runs in an isolating run sequence have the same embedding level.
         * 
         * DO NOT change any `embedLevels[i]` within the current scope.
         */
        var embedDirection = ((embedLevels[seqIndices$1[0]]) & 1) ? TYPE_R : TYPE_L;

        // === 3.3.4 Resolving Weak Types ===

        // W1 + 5.2. Search backward from each NSM to the first character in the isolating run sequence whose
        // bidirectional type is not BN, and set the NSM to ON if it is an isolate initiator or PDI, and to its
        // type otherwise. If the NSM is the first non-BN character, change the NSM to the type of sos.
        if (charTypeCounts.get(TYPE_NSM)) {
          for (var si = 0; si < seqIndices$1.length; si++) {
            var i$8 = seqIndices$1[si];
            if (charTypes[i$8] & TYPE_NSM) {
              var prevType = sosType;
              for (var sj = si - 1; sj >= 0; sj--) {
                if (!(charTypes[seqIndices$1[sj]] & BN_LIKE_TYPES)) { //5.2 scan back to first non-BN
                  prevType = charTypes[seqIndices$1[sj]];
                  break
                }
              }
              changeCharType(i$8, (prevType & (ISOLATE_INIT_TYPES | TYPE_PDI)) ? TYPE_ON : prevType);
            }
          }
        }

        // W2. Search backward from each instance of a European number until the first strong type (R, L, AL, or sos)
        // is found. If an AL is found, change the type of the European number to Arabic number.
        if (charTypeCounts.get(TYPE_EN)) {
          for (var si$1 = 0; si$1 < seqIndices$1.length; si$1++) {
            var i$9 = seqIndices$1[si$1];
            if (charTypes[i$9] & TYPE_EN) {
              for (var sj$1 = si$1 - 1; sj$1 >= -1; sj$1--) {
                var prevCharType = sj$1 === -1 ? sosType : charTypes[seqIndices$1[sj$1]];
                if (prevCharType & STRONG_TYPES) {
                  if (prevCharType === TYPE_AL) {
                    changeCharType(i$9, TYPE_AN);
                  }
                  break
                }
              }
            }
          }
        }

        // W3. Change all ALs to R
        if (charTypeCounts.get(TYPE_AL)) {
          for (var si$2 = 0; si$2 < seqIndices$1.length; si$2++) {
            var i$10 = seqIndices$1[si$2];
            if (charTypes[i$10] & TYPE_AL) {
              changeCharType(i$10, TYPE_R);
            }
          }
        }

        // W4. A single European separator between two European numbers changes to a European number. A single common
        // separator between two numbers of the same type changes to that type.
        if (charTypeCounts.get(TYPE_ES) || charTypeCounts.get(TYPE_CS)) {
          for (var si$3 = 1; si$3 < seqIndices$1.length - 1; si$3++) {
            var i$11 = seqIndices$1[si$3];
            if (charTypes[i$11] & (TYPE_ES | TYPE_CS)) {
              var prevType$1 = 0, nextType = 0;
              for (var sj$2 = si$3 - 1; sj$2 >= 0; sj$2--) {
                prevType$1 = charTypes[seqIndices$1[sj$2]];
                if (!(prevType$1 & BN_LIKE_TYPES)) { //5.2
                  break
                }
              }
              for (var sj$3 = si$3 + 1; sj$3 < seqIndices$1.length; sj$3++) {
                nextType = charTypes[seqIndices$1[sj$3]];
                if (!(nextType & BN_LIKE_TYPES)) { //5.2
                  break
                }
              }
              if (prevType$1 === nextType && (charTypes[i$11] === TYPE_ES ? prevType$1 === TYPE_EN : (prevType$1 & (TYPE_EN | TYPE_AN)))) {
                changeCharType(i$11, prevType$1);
              }
            }
          }
        }

        // W5. A sequence of European terminators adjacent to European numbers changes to all European numbers.
        if (charTypeCounts.get(TYPE_EN)) {
          for (var si$4 = 0; si$4 < seqIndices$1.length; si$4++) {
            var i$12 = seqIndices$1[si$4];
            if (charTypes[i$12] & TYPE_EN) {
              for (var sj$4 = si$4 - 1; sj$4 >= 0 && (charTypes[seqIndices$1[sj$4]] & (TYPE_ET | BN_LIKE_TYPES)); sj$4--) {
                changeCharType(seqIndices$1[sj$4], TYPE_EN);
              }
              for (si$4++; si$4 < seqIndices$1.length && (charTypes[seqIndices$1[si$4]] & (TYPE_ET | BN_LIKE_TYPES | TYPE_EN)); si$4++) {
                if (charTypes[seqIndices$1[si$4]] !== TYPE_EN) {
                  changeCharType(seqIndices$1[si$4], TYPE_EN);
                }
              }
            }
          }
        }

        // W6. Otherwise, separators and terminators change to Other Neutral.
        if (charTypeCounts.get(TYPE_ET) || charTypeCounts.get(TYPE_ES) || charTypeCounts.get(TYPE_CS)) {
          for (var si$5 = 0; si$5 < seqIndices$1.length; si$5++) {
            var i$13 = seqIndices$1[si$5];
            if (charTypes[i$13] & (TYPE_ET | TYPE_ES | TYPE_CS)) {
              changeCharType(i$13, TYPE_ON);
              // 5.2 transform adjacent BNs too:
              for (var sj$5 = si$5 - 1; sj$5 >= 0 && (charTypes[seqIndices$1[sj$5]] & BN_LIKE_TYPES); sj$5--) {
                changeCharType(seqIndices$1[sj$5], TYPE_ON);
              }
              for (var sj$6 = si$5 + 1; sj$6 < seqIndices$1.length && (charTypes[seqIndices$1[sj$6]] & BN_LIKE_TYPES); sj$6++) {
                changeCharType(seqIndices$1[sj$6], TYPE_ON);
              }
            }
          }
        }

        // W7. Search backward from each instance of a European number until the first strong type (R, L, or sos)
        // is found. If an L is found, then change the type of the European number to L.
        // NOTE: implemented in single forward pass for efficiency
        if (charTypeCounts.get(TYPE_EN)) {
          for (var si$6 = 0, prevStrongType = sosType; si$6 < seqIndices$1.length; si$6++) {
            var i$14 = seqIndices$1[si$6];
            var type = charTypes[i$14];
            if (type & TYPE_EN) {
              if (prevStrongType === TYPE_L) {
                changeCharType(i$14, TYPE_L);
              }
            } else if (type & STRONG_TYPES) {
              prevStrongType = type;
            }
          }
        }

        // === 3.3.5 Resolving Neutral and Isolate Formatting Types ===

        if (charTypeCounts.get(NEUTRAL_ISOLATE_TYPES)) {
          // N0. Process bracket pairs in an isolating run sequence sequentially in the logical order of the text
          // positions of the opening paired brackets using the logic given below. Within this scope, bidirectional
          // types EN and AN are treated as R.
          var R_TYPES_FOR_N_STEPS = (TYPE_R | TYPE_EN | TYPE_AN);
          var STRONG_TYPES_FOR_N_STEPS = R_TYPES_FOR_N_STEPS | TYPE_L;

          // * Identify the bracket pairs in the current isolating run sequence according to BD16.
          var bracketPairs = [];
          {
            var openerStack = [];
            for (var si$7 = 0; si$7 < seqIndices$1.length; si$7++) {
              // NOTE: for any potential bracket character we also test that it still carries a NI
              // type, as that may have been changed earlier. This doesn't seem to be explicitly
              // called out in the spec, but is required for passage of certain tests.
              if (charTypes[seqIndices$1[si$7]] & NEUTRAL_ISOLATE_TYPES) {
                var char = string[seqIndices$1[si$7]];
                var oppositeBracket = (void 0);
                // Opening bracket
                if (openingToClosingBracket(char) !== null) {
                  if (openerStack.length < 63) {
                    openerStack.push({ char: char, seqIndex: si$7 });
                  } else {
                    break
                  }
                }
                // Closing bracket
                else if ((oppositeBracket = closingToOpeningBracket(char)) !== null) {
                  for (var stackIdx = openerStack.length - 1; stackIdx >= 0; stackIdx--) {
                    var stackChar = openerStack[stackIdx].char;
                    if (stackChar === oppositeBracket ||
                      stackChar === closingToOpeningBracket(getCanonicalBracket(char)) ||
                      openingToClosingBracket(getCanonicalBracket(stackChar)) === char
                    ) {
                      bracketPairs.push([openerStack[stackIdx].seqIndex, si$7]);
                      openerStack.length = stackIdx; //pop the matching bracket and all following
                      break
                    }
                  }
                }
              }
            }
            bracketPairs.sort(function (a, b) { return a[0] - b[0]; });
          }
          // * For each bracket-pair element in the list of pairs of text positions
          for (var pairIdx = 0; pairIdx < bracketPairs.length; pairIdx++) {
            var ref$1 = bracketPairs[pairIdx];
            var openSeqIdx = ref$1[0];
            var closeSeqIdx = ref$1[1];
            // a. Inspect the bidirectional types of the characters enclosed within the bracket pair.
            // b. If any strong type (either L or R) matching the embedding direction is found, set the type for both
            // brackets in the pair to match the embedding direction.
            var foundStrongType = false;
            var useStrongType = 0;
            for (var si$8 = openSeqIdx + 1; si$8 < closeSeqIdx; si$8++) {
              var i$15 = seqIndices$1[si$8];
              if (charTypes[i$15] & STRONG_TYPES_FOR_N_STEPS) {
                foundStrongType = true;
                var lr = (charTypes[i$15] & R_TYPES_FOR_N_STEPS) ? TYPE_R : TYPE_L;
                if (lr === embedDirection) {
                  useStrongType = lr;
                  break
                }
              }
            }
            // c. Otherwise, if there is a strong type it must be opposite the embedding direction. Therefore, test
            // for an established context with a preceding strong type by checking backwards before the opening paired
            // bracket until the first strong type (L, R, or sos) is found.
            //    1. If the preceding strong type is also opposite the embedding direction, context is established, so
            //    set the type for both brackets in the pair to that direction.
            //    2. Otherwise set the type for both brackets in the pair to the embedding direction.
            if (foundStrongType && !useStrongType) {
              useStrongType = sosType;
              for (var si$9 = openSeqIdx - 1; si$9 >= 0; si$9--) {
                var i$16 = seqIndices$1[si$9];
                if (charTypes[i$16] & STRONG_TYPES_FOR_N_STEPS) {
                  var lr$1 = (charTypes[i$16] & R_TYPES_FOR_N_STEPS) ? TYPE_R : TYPE_L;
                  if (lr$1 !== embedDirection) {
                    useStrongType = lr$1;
                  } else {
                    useStrongType = embedDirection;
                  }
                  break
                }
              }
            }
            if (useStrongType) {
              charTypes[seqIndices$1[openSeqIdx]] = charTypes[seqIndices$1[closeSeqIdx]] = useStrongType;
              // * Any number of characters that had original bidirectional character type NSM prior to the application
              // of W1 that immediately follow a paired bracket which changed to L or R under N0 should change to match
              // the type of their preceding bracket.
              if (useStrongType !== embedDirection) {
                for (var si$10 = openSeqIdx + 1; si$10 < seqIndices$1.length; si$10++) {
                  if (!(charTypes[seqIndices$1[si$10]] & BN_LIKE_TYPES)) {
                    if (getBidiCharType(string[seqIndices$1[si$10]]) & TYPE_NSM) {
                      charTypes[seqIndices$1[si$10]] = useStrongType;
                    }
                    break
                  }
                }
              }
              if (useStrongType !== embedDirection) {
                for (var si$11 = closeSeqIdx + 1; si$11 < seqIndices$1.length; si$11++) {
                  if (!(charTypes[seqIndices$1[si$11]] & BN_LIKE_TYPES)) {
                    if (getBidiCharType(string[seqIndices$1[si$11]]) & TYPE_NSM) {
                      charTypes[seqIndices$1[si$11]] = useStrongType;
                    }
                    break
                  }
                }
              }
            }
          }

          // N1. A sequence of NIs takes the direction of the surrounding strong text if the text on both sides has the
          // same direction.
          // N2. Any remaining NIs take the embedding direction.
          for (var si$12 = 0; si$12 < seqIndices$1.length; si$12++) {
            if (charTypes[seqIndices$1[si$12]] & NEUTRAL_ISOLATE_TYPES) {
              var niRunStart = si$12, niRunEnd = si$12;
              var prevType$2 = sosType; //si === 0 ? sosType : (charTypes[seqIndices[si - 1]] & R_TYPES_FOR_N_STEPS) ? TYPE_R : TYPE_L
              for (var si2 = si$12 - 1; si2 >= 0; si2--) {
                if (charTypes[seqIndices$1[si2]] & BN_LIKE_TYPES) {
                  niRunStart = si2; //5.2 treat BNs adjacent to NIs as NIs
                } else {
                  prevType$2 = (charTypes[seqIndices$1[si2]] & R_TYPES_FOR_N_STEPS) ? TYPE_R : TYPE_L;
                  break
                }
              }
              var nextType$1 = eosType;
              for (var si2$1 = si$12 + 1; si2$1 < seqIndices$1.length; si2$1++) {
                if (charTypes[seqIndices$1[si2$1]] & (NEUTRAL_ISOLATE_TYPES | BN_LIKE_TYPES)) {
                  niRunEnd = si2$1;
                } else {
                  nextType$1 = (charTypes[seqIndices$1[si2$1]] & R_TYPES_FOR_N_STEPS) ? TYPE_R : TYPE_L;
                  break
                }
              }
              for (var sj$7 = niRunStart; sj$7 <= niRunEnd; sj$7++) {
                charTypes[seqIndices$1[sj$7]] = prevType$2 === nextType$1 ? prevType$2 : embedDirection;
              }
              si$12 = niRunEnd;
            }
          }
        }
      }

      // === 3.3.6 Resolving Implicit Levels ===

      for (var i$17 = paragraph.start; i$17 <= paragraph.end; i$17++) {
        var level$3 = embedLevels[i$17];
        var type$1 = charTypes[i$17];
        // I2. For all characters with an odd (right-to-left) embedding level, those of type L, EN or AN go up one level.
        if (level$3 & 1) {
          if (type$1 & (TYPE_L | TYPE_EN | TYPE_AN)) {
            embedLevels[i$17]++;
          }
        }
          // I1. For all characters with an even (left-to-right) embedding level, those of type R go up one level
        // and those of type AN or EN go up two levels.
        else {
          if (type$1 & TYPE_R) {
            embedLevels[i$17]++;
          } else if (type$1 & (TYPE_AN | TYPE_EN)) {
            embedLevels[i$17] += 2;
          }
        }

        // 5.2: Resolve any LRE, RLE, LRO, RLO, PDF, or BN to the level of the preceding character if there is one,
        // and otherwise to the base level.
        if (type$1 & BN_LIKE_TYPES) {
          embedLevels[i$17] = i$17 === 0 ? paragraph.level : embedLevels[i$17 - 1];
        }

        // 3.4 L1.1-4: Reset the embedding level of segment/paragraph separators, and any sequence of whitespace or
        // isolate formatting characters preceding them or the end of the paragraph, to the paragraph level.
        // NOTE: this will also need to be applied to each individual line ending after line wrapping occurs.
        if (i$17 === paragraph.end || getBidiCharType(string[i$17]) & (TYPE_S | TYPE_B)) {
          for (var j$1 = i$17; j$1 >= 0 && (getBidiCharType(string[j$1]) & TRAILING_TYPES); j$1--) {
            embedLevels[j$1] = paragraph.level;
          }
        }
      }
    }

    // DONE! The resolved levels can then be used, after line wrapping, to flip runs of characters
    // according to section 3.4 Reordering Resolved Levels
    return {
      levels: embedLevels,
      paragraphs: paragraphs
    }

    function determineAutoEmbedLevel (start, isFSI) {
      // 3.3.1 P2 - P3
      for (var i = start; i < string.length; i++) {
        var charType = charTypes[i];
        if (charType & (TYPE_R | TYPE_AL)) {
          return 1
        }
        if ((charType & (TYPE_B | TYPE_L)) || (isFSI && charType === TYPE_PDI)) {
          return 0
        }
        if (charType & ISOLATE_INIT_TYPES) {
          var pdi = indexOfMatchingPDI(i);
          i = pdi === -1 ? string.length : pdi;
        }
      }
      return 0
    }

    function indexOfMatchingPDI (isolateStart) {
      // 3.1.2 BD9
      var isolationLevel = 1;
      for (var i = isolateStart + 1; i < string.length; i++) {
        var charType = charTypes[i];
        if (charType & TYPE_B) {
          break
        }
        if (charType & TYPE_PDI) {
          if (--isolationLevel === 0) {
            return i
          }
        } else if (charType & ISOLATE_INIT_TYPES) {
          isolationLevel++;
        }
      }
      return -1
    }
  }

  // Bidi mirrored chars data, auto generated
  var data = "14>1,j>2,t>2,u>2,1a>g,2v3>1,1>1,1ge>1,1wd>1,b>1,1j>1,f>1,ai>3,-2>3,+1,8>1k0,-1jq>1y7,-1y6>1hf,-1he>1h6,-1h5>1ha,-1h8>1qi,-1pu>1,6>3u,-3s>7,6>1,1>1,f>1,1>1,+2,3>1,1>1,+13,4>1,1>1,6>1eo,-1ee>1,3>1mg,-1me>1mk,-1mj>1mi,-1mg>1mi,-1md>1,1>1,+2,1>10k,-103>1,1>1,4>1,5>1,1>1,+10,3>1,1>8,-7>8,+1,-6>7,+1,a>1,1>1,u>1,u6>1,1>1,+5,26>1,1>1,2>1,2>2,8>1,7>1,4>1,1>1,+5,b8>1,1>1,+3,1>3,-2>1,2>1,1>1,+2,c>1,3>1,1>1,+2,h>1,3>1,a>1,1>1,2>1,3>1,1>1,d>1,f>1,3>1,1a>1,1>1,6>1,7>1,13>1,k>1,1>1,+19,4>1,1>1,+2,2>1,1>1,+18,m>1,a>1,1>1,lk>1,1>1,4>1,2>1,f>1,3>1,1>1,+3,db>1,1>1,+3,3>1,1>1,+2,14qm>1,1>1,+1,6>1,4j>1,j>2,t>2,u>2,2>1,+1";

  var mirrorMap;

  function parse () {
    if (!mirrorMap) {
      //const start = performance.now()
      var ref = parseCharacterMap(data, true);
      var map = ref.map;
      var reverseMap = ref.reverseMap;
      // Combine both maps into one
      reverseMap.forEach(function (value, key) {
        map.set(key, value);
      });
      mirrorMap = map;
      //console.log(`mirrored chars parsed in ${performance.now() - start}ms`)
    }
  }

  function getMirroredCharacter (char) {
    parse();
    return mirrorMap.get(char) || null
  }

  /**
   * Given a string and its resolved embedding levels, build a map of indices to replacement chars
   * for any characters in right-to-left segments that have defined mirrored characters.
   * @param string
   * @param embeddingLevels
   * @param [start]
   * @param [end]
   * @return {Map<number, string>}
   */
  function getMirroredCharactersMap(string, embeddingLevels, start, end) {
    var strLen = string.length;
    start = Math.max(0, start == null ? 0 : +start);
    end = Math.min(strLen - 1, end == null ? strLen - 1 : +end);

    var map = new Map();
    for (var i = start; i <= end; i++) {
      if (embeddingLevels[i] & 1) { //only odd (rtl) levels
        var mirror = getMirroredCharacter(string[i]);
        if (mirror !== null) {
          map.set(i, mirror);
        }
      }
    }
    return map
  }

  /**
   * Given a start and end denoting a single line within a string, and a set of precalculated
   * bidi embedding levels, produce a list of segments whose ordering should be flipped, in sequence.
   * @param {string} string - the full input string
   * @param {GetEmbeddingLevelsResult} embeddingLevelsResult - the result object from getEmbeddingLevels
   * @param {number} [start] - first character in a subset of the full string
   * @param {number} [end] - last character in a subset of the full string
   * @return {number[][]} - the list of start/end segments that should be flipped, in order.
   */
  function getReorderSegments(string, embeddingLevelsResult, start, end) {
    var strLen = string.length;
    start = Math.max(0, start == null ? 0 : +start);
    end = Math.min(strLen - 1, end == null ? strLen - 1 : +end);

    var segments = [];
    embeddingLevelsResult.paragraphs.forEach(function (paragraph) {
      var lineStart = Math.max(start, paragraph.start);
      var lineEnd = Math.min(end, paragraph.end);
      if (lineStart < lineEnd) {
        // Local slice for mutation
        var lineLevels = embeddingLevelsResult.levels.slice(lineStart, lineEnd + 1);

        // 3.4 L1.4: Reset any sequence of whitespace characters and/or isolate formatting characters at the
        // end of the line to the paragraph level.
        for (var i = lineEnd; i >= lineStart && (getBidiCharType(string[i]) & TRAILING_TYPES); i--) {
          lineLevels[i] = paragraph.level;
        }

        // L2. From the highest level found in the text to the lowest odd level on each line, including intermediate levels
        // not actually present in the text, reverse any contiguous sequence of characters that are at that level or higher.
        var maxLevel = paragraph.level;
        var minOddLevel = Infinity;
        for (var i$1 = 0; i$1 < lineLevels.length; i$1++) {
          var level = lineLevels[i$1];
          if (level > maxLevel) { maxLevel = level; }
          if (level < minOddLevel) { minOddLevel = level | 1; }
        }
        for (var lvl = maxLevel; lvl >= minOddLevel; lvl--) {
          for (var i$2 = 0; i$2 < lineLevels.length; i$2++) {
            if (lineLevels[i$2] >= lvl) {
              var segStart = i$2;
              while (i$2 + 1 < lineLevels.length && lineLevels[i$2 + 1] >= lvl) {
                i$2++;
              }
              if (i$2 > segStart) {
                segments.push([segStart + lineStart, i$2 + lineStart]);
              }
            }
          }
        }
      }
    });
    return segments
  }

  /**
   * @param {string} string
   * @param {GetEmbeddingLevelsResult} embedLevelsResult
   * @param {number} [start]
   * @param {number} [end]
   * @return {string} the new string with bidi segments reordered
   */
  function getReorderedString(string, embedLevelsResult, start, end) {
    var indices = getReorderedIndices(string, embedLevelsResult, start, end);
    var chars = [].concat( string );
    indices.forEach(function (charIndex, i) {
      chars[i] = (
        (embedLevelsResult.levels[charIndex] & 1) ? getMirroredCharacter(string[charIndex]) : null
      ) || string[charIndex];
    });
    return chars.join('')
  }

  /**
   * @param {string} string
   * @param {GetEmbeddingLevelsResult} embedLevelsResult
   * @param {number} [start]
   * @param {number} [end]
   * @return {number[]} an array with character indices in their new bidi order
   */
  function getReorderedIndices(string, embedLevelsResult, start, end) {
    var segments = getReorderSegments(string, embedLevelsResult, start, end);
    // Fill an array with indices
    var indices = [];
    for (var i = 0; i < string.length; i++) {
      indices[i] = i;
    }
    // Reverse each segment in order
    segments.forEach(function (ref) {
      var start = ref[0];
      var end = ref[1];

      var slice = indices.slice(start, end + 1);
      for (var i = slice.length; i--;) {
        indices[end - i] = slice[i];
      }
    });
    return indices
  }

  exports.closingToOpeningBracket = closingToOpeningBracket;
  exports.getBidiCharType = getBidiCharType;
  exports.getBidiCharTypeName = getBidiCharTypeName;
  exports.getCanonicalBracket = getCanonicalBracket;
  exports.getEmbeddingLevels = getEmbeddingLevels;
  exports.getMirroredCharacter = getMirroredCharacter;
  exports.getMirroredCharactersMap = getMirroredCharactersMap;
  exports.getReorderSegments = getReorderSegments;
  exports.getReorderedIndices = getReorderedIndices;
  exports.getReorderedString = getReorderedString;
  exports.openingToClosingBracket = openingToClosingBracket;

  Object.defineProperty(exports, '__esModule', { value: true });

  return exports;

}({}));
return bidi}

/**
 * Regular expression for matching the `void main() {` opener line in GLSL.
 * @type {RegExp}
 */
const voidMainRegExp = /\bvoid\s+main\s*\(\s*\)\s*{/g;

/**
 * Recursively expands all `#include <xyz>` statements within string of shader code.
 * Copied from three's WebGLProgram#parseIncludes for external use.
 *
 * @param {string} source - The GLSL source code to evaluate
 * @return {string} The GLSL code with all includes expanded
 */
function expandShaderIncludes( source ) {
  const pattern = /^[ \t]*#include +<([\w\d./]+)>/gm;
  function replace(match, include) {
    let chunk = ShaderChunk[include];
    return chunk ? expandShaderIncludes(chunk) : match
  }
  return source.replace( pattern, replace )
}

/*
 * This is a direct copy of MathUtils.generateUUID from Three.js, to preserve compatibility with three
 * versions before 0.113.0 as it was changed from Math to MathUtils in that version.
 * https://github.com/mrdoob/three.js/blob/dd8b5aa3b270c17096b90945cd2d6d1b13aaec53/src/math/MathUtils.js#L16
 */

const _lut = [];

for (let i = 0; i < 256; i++) {
  _lut[i] = (i < 16 ? '0' : '') + (i).toString(16);
}

function generateUUID() {

  // http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/21963136#21963136

  const d0 = Math.random() * 0xffffffff | 0;
  const d1 = Math.random() * 0xffffffff | 0;
  const d2 = Math.random() * 0xffffffff | 0;
  const d3 = Math.random() * 0xffffffff | 0;
  const uuid = _lut[d0 & 0xff] + _lut[d0 >> 8 & 0xff] + _lut[d0 >> 16 & 0xff] + _lut[d0 >> 24 & 0xff] + '-' +
    _lut[d1 & 0xff] + _lut[d1 >> 8 & 0xff] + '-' + _lut[d1 >> 16 & 0x0f | 0x40] + _lut[d1 >> 24 & 0xff] + '-' +
    _lut[d2 & 0x3f | 0x80] + _lut[d2 >> 8 & 0xff] + '-' + _lut[d2 >> 16 & 0xff] + _lut[d2 >> 24 & 0xff] +
    _lut[d3 & 0xff] + _lut[d3 >> 8 & 0xff] + _lut[d3 >> 16 & 0xff] + _lut[d3 >> 24 & 0xff];

  // .toUpperCase() here flattens concatenated strings to save heap memory space.
  return uuid.toUpperCase()

}

// Local assign polyfill to avoid importing troika-core
const assign$1 = Object.assign || function(/*target, ...sources*/) {
  let target = arguments[0];
  for (let i = 1, len = arguments.length; i < len; i++) {
    let source = arguments[i];
    if (source) {
      for (let prop in source) {
        if (Object.prototype.hasOwnProperty.call(source, prop)) {
          target[prop] = source[prop];
        }
      }
    }
  }
  return target
};


const epoch = Date.now();
const CONSTRUCTOR_CACHE = new WeakMap();
const SHADER_UPGRADE_CACHE = new Map();

// Material ids must be integers, but we can't access the increment from Three's `Material` module,
// so let's choose a sufficiently large starting value that should theoretically never collide.
let materialInstanceId = 1e10;

/**
 * A utility for creating a custom shader material derived from another material's
 * shaders. This allows you to inject custom shader logic and transforms into the
 * builtin ThreeJS materials without having to recreate them from scratch.
 *
 * @param {THREE.Material} baseMaterial - the original material to derive from
 *
 * @param {Object} options - How the base material should be modified.
 * @param {Object} options.defines - Custom `defines` for the material
 * @param {Object} options.extensions - Custom `extensions` for the material, e.g. `{derivatives: true}`
 * @param {Object} options.uniforms - Custom `uniforms` for use in the modified shader. These can
 *        be accessed and manipulated via the resulting material's `uniforms` property, just like
 *        in a ShaderMaterial. You do not need to repeat the base material's own uniforms here.
 * @param {String} options.timeUniform - If specified, a uniform of this name will be injected into
 *        both shaders, and it will automatically be updated on each render frame with a number of
 *        elapsed milliseconds. The "zero" epoch time is not significant so don't rely on this as a
 *        true calendar time.
 * @param {String} options.vertexDefs - Custom GLSL code to inject into the vertex shader's top-level
 *        definitions, above the `void main()` function.
 * @param {String} options.vertexMainIntro - Custom GLSL code to inject at the top of the vertex
 *        shader's `void main` function.
 * @param {String} options.vertexMainOutro - Custom GLSL code to inject at the end of the vertex
 *        shader's `void main` function.
 * @param {String} options.vertexTransform - Custom GLSL code to manipulate the `position`, `normal`,
 *        and/or `uv` vertex attributes. This code will be wrapped within a standalone function with
 *        those attributes exposed by their normal names as read/write values.
 * @param {String} options.fragmentDefs - Custom GLSL code to inject into the fragment shader's top-level
 *        definitions, above the `void main()` function.
 * @param {String} options.fragmentMainIntro - Custom GLSL code to inject at the top of the fragment
 *        shader's `void main` function.
 * @param {String} options.fragmentMainOutro - Custom GLSL code to inject at the end of the fragment
 *        shader's `void main` function. You can manipulate `gl_FragColor` here but keep in mind it goes
 *        after any of ThreeJS's color postprocessing shader chunks (tonemapping, fog, etc.), so if you
 *        want those to apply to your changes use `fragmentColorTransform` instead.
 * @param {String} options.fragmentColorTransform - Custom GLSL code to manipulate the `gl_FragColor`
 *        output value. Will be injected near the end of the `void main` function, but before any
 *        of ThreeJS's color postprocessing shader chunks (tonemapping, fog, etc.), and before the
 *        `fragmentMainOutro`.
 * @param {function<{vertexShader,fragmentShader}>:{vertexShader,fragmentShader}} options.customRewriter - A function
 *        for performing custom rewrites of the full shader code. Useful if you need to do something
 *        special that's not covered by the other builtin options. This function will be executed before
 *        any other transforms are applied.
 * @param {boolean} options.chained - Set to `true` to prototype-chain the derived material to the base
 *        material, rather than the default behavior of copying it. This allows the derived material to
 *        automatically pick up changes made to the base material and its properties. This can be useful
 *        where the derived material is hidden from the user as an implementation detail, allowing them
 *        to work with the original material like normal. But it can result in unexpected behavior if not
 *        handled carefully.
 *
 * @return {THREE.Material}
 *
 * The returned material will also have two new methods, `getDepthMaterial()` and `getDistanceMaterial()`,
 * which can be called to get a variant of the derived material for use in shadow casting. If the
 * target mesh is expected to cast shadows, then you can assign these to the mesh's `customDepthMaterial`
 * (for directional and spot lights) and/or `customDistanceMaterial` (for point lights) properties to
 * allow the cast shadow to honor your derived shader's vertex transforms and discarded fragments. These
 * will also set a custom `#define IS_DEPTH_MATERIAL` or `#define IS_DISTANCE_MATERIAL` that you can look
 * for in your derived shaders with `#ifdef` to customize their behavior for the depth or distance
 * scenarios, e.g. skipping antialiasing or expensive shader logic.
 */
function createDerivedMaterial(baseMaterial, options) {
  // Generate a key that is unique to the content of these `options`. We'll use this
  // throughout for caching and for generating the upgraded shader code. This increases
  // the likelihood that the resulting shaders will line up across multiple calls so
  // their GL programs can be shared and cached.
  const optionsKey = getKeyForOptions(options);

  // First check to see if we've already derived from this baseMaterial using this
  // unique set of options, and if so reuse the constructor to avoid some allocations.
  let ctorsByDerivation = CONSTRUCTOR_CACHE.get(baseMaterial);
  if (!ctorsByDerivation) {
    CONSTRUCTOR_CACHE.set(baseMaterial, (ctorsByDerivation = Object.create(null)));
  }
  if (ctorsByDerivation[optionsKey]) {
    return new ctorsByDerivation[optionsKey]()
  }

  const privateBeforeCompileProp = `_onBeforeCompile${optionsKey}`;

  // Private onBeforeCompile handler that injects the modified shaders and uniforms when
  // the renderer switches to this material's program
  const onBeforeCompile = function (shaderInfo, renderer) {
    baseMaterial.onBeforeCompile.call(this, shaderInfo, renderer);

    // Upgrade the shaders, caching the result by incoming source code
    const cacheKey = this.customProgramCacheKey() + '|' + shaderInfo.vertexShader + '|' + shaderInfo.fragmentShader;
    let upgradedShaders = SHADER_UPGRADE_CACHE[cacheKey];
    if (!upgradedShaders) {
      const upgraded = upgradeShaders(this, shaderInfo, options, optionsKey);
      upgradedShaders = SHADER_UPGRADE_CACHE[cacheKey] = upgraded;
    }

    // Inject upgraded shaders and uniforms into the program
    shaderInfo.vertexShader = upgradedShaders.vertexShader;
    shaderInfo.fragmentShader = upgradedShaders.fragmentShader;
    assign$1(shaderInfo.uniforms, this.uniforms);

    // Inject auto-updating time uniform if requested
    if (options.timeUniform) {
      shaderInfo.uniforms[options.timeUniform] = {
        get value() {return Date.now() - epoch}
      };
    }

    // Users can still add their own handlers on top of ours
    if (this[privateBeforeCompileProp]) {
      this[privateBeforeCompileProp](shaderInfo);
    }
  };

  const DerivedMaterial = function DerivedMaterial() {
    return derive(options.chained ? baseMaterial : baseMaterial.clone())
  };

  const derive = function(base) {
    // Prototype chain to the base material
    const derived = Object.create(base, descriptor);

    // Store the baseMaterial for reference; this is always the original even when cloning
    Object.defineProperty(derived, 'baseMaterial', { value: baseMaterial });

    // Needs its own ids
    Object.defineProperty(derived, 'id', { value: materialInstanceId++ });
    derived.uuid = generateUUID();

    // Merge uniforms, defines, and extensions
    derived.uniforms = assign$1({}, base.uniforms, options.uniforms);
    derived.defines = assign$1({}, base.defines, options.defines);
    derived.defines[`TROIKA_DERIVED_MATERIAL_${optionsKey}`] = ''; //force a program change from the base material
    derived.extensions = assign$1({}, base.extensions, options.extensions);

    // Don't inherit EventDispatcher listeners
    derived._listeners = undefined;

    return derived
  };

  const descriptor = {
    constructor: {value: DerivedMaterial},
    isDerivedMaterial: {value: true},

    customProgramCacheKey: {
      writable: true,
      configurable: true,
      value: function () {
        return baseMaterial.customProgramCacheKey() + '|' + optionsKey
      }
    },

    onBeforeCompile: {
      get() {
        return onBeforeCompile
      },
      set(fn) {
        this[privateBeforeCompileProp] = fn;
      }
    },

    copy: {
      writable: true,
      configurable: true,
      value: function (source) {
        baseMaterial.copy.call(this, source);
        if (!baseMaterial.isShaderMaterial && !baseMaterial.isDerivedMaterial) {
          assign$1(this.extensions, source.extensions);
          assign$1(this.defines, source.defines);
          assign$1(this.uniforms, UniformsUtils.clone(source.uniforms));
        }
        return this
      }
    },

    clone: {
      writable: true,
      configurable: true,
      value: function () {
        const newBase = new baseMaterial.constructor();
        return derive(newBase).copy(this)
      }
    },

    /**
     * Utility to get a MeshDepthMaterial that will honor this derived material's vertex
     * transformations and discarded fragments.
     */
    getDepthMaterial: {
      writable: true,
      configurable: true,
      value: function() {
        let depthMaterial = this._depthMaterial;
        if (!depthMaterial) {
          depthMaterial = this._depthMaterial = createDerivedMaterial(
            baseMaterial.isDerivedMaterial
              ? baseMaterial.getDepthMaterial()
              : new MeshDepthMaterial({ depthPacking: RGBADepthPacking }),
            options
          );
          depthMaterial.defines.IS_DEPTH_MATERIAL = '';
          depthMaterial.uniforms = this.uniforms; //automatically recieve same uniform values
        }
        return depthMaterial
      }
    },

    /**
     * Utility to get a MeshDistanceMaterial that will honor this derived material's vertex
     * transformations and discarded fragments.
     */
    getDistanceMaterial: {
      writable: true,
      configurable: true,
      value: function() {
        let distanceMaterial = this._distanceMaterial;
        if (!distanceMaterial) {
          distanceMaterial = this._distanceMaterial = createDerivedMaterial(
            baseMaterial.isDerivedMaterial
              ? baseMaterial.getDistanceMaterial()
              : new MeshDistanceMaterial(),
            options
          );
          distanceMaterial.defines.IS_DISTANCE_MATERIAL = '';
          distanceMaterial.uniforms = this.uniforms; //automatically recieve same uniform values
        }
        return distanceMaterial
      }
    },

    dispose: {
      writable: true,
      configurable: true,
      value() {
        const {_depthMaterial, _distanceMaterial} = this;
        if (_depthMaterial) _depthMaterial.dispose();
        if (_distanceMaterial) _distanceMaterial.dispose();
        baseMaterial.dispose.call(this);
      }
    }
  };

  ctorsByDerivation[optionsKey] = DerivedMaterial;
  return new DerivedMaterial()
}


function upgradeShaders(material, {vertexShader, fragmentShader}, options, key) {
  let {
    vertexDefs,
    vertexMainIntro,
    vertexMainOutro,
    vertexTransform,
    fragmentDefs,
    fragmentMainIntro,
    fragmentMainOutro,
    fragmentColorTransform,
    customRewriter,
    timeUniform
  } = options;

  vertexDefs = vertexDefs || '';
  vertexMainIntro = vertexMainIntro || '';
  vertexMainOutro = vertexMainOutro || '';
  fragmentDefs = fragmentDefs || '';
  fragmentMainIntro = fragmentMainIntro || '';
  fragmentMainOutro = fragmentMainOutro || '';

  // Expand includes if needed
  if (vertexTransform || customRewriter) {
    vertexShader = expandShaderIncludes(vertexShader);
  }
  if (fragmentColorTransform || customRewriter) {
    // We need to be able to find postprocessing chunks after include expansion in order to
    // put them after the fragmentColorTransform, so mark them with comments first. Even if
    // this particular derivation doesn't have a fragmentColorTransform, other derivations may,
    // so we still mark them.
    fragmentShader = fragmentShader.replace(
      /^[ \t]*#include <((?:tonemapping|encodings|fog|premultiplied_alpha|dithering)_fragment)>/gm,
      '\n//!BEGIN_POST_CHUNK $1\n$&\n//!END_POST_CHUNK\n'
    );
    fragmentShader = expandShaderIncludes(fragmentShader);
  }

  // Apply custom rewriter function
  if (customRewriter) {
    let res = customRewriter({vertexShader, fragmentShader});
    vertexShader = res.vertexShader;
    fragmentShader = res.fragmentShader;
  }

  // The fragmentColorTransform needs to go before any postprocessing chunks, so extract
  // those and re-insert them into the outro in the correct place:
  if (fragmentColorTransform) {
    let postChunks = [];
    fragmentShader = fragmentShader.replace(
      /^\/\/!BEGIN_POST_CHUNK[^]+?^\/\/!END_POST_CHUNK/gm, // [^]+? = non-greedy match of any chars including newlines
      match => {
        postChunks.push(match);
        return ''
      }
    );
    fragmentMainOutro = `${fragmentColorTransform}\n${postChunks.join('\n')}\n${fragmentMainOutro}`;
  }

  // Inject auto-updating time uniform if requested
  if (timeUniform) {
    const code = `\nuniform float ${timeUniform};\n`;
    vertexDefs = code + vertexDefs;
    fragmentDefs = code + fragmentDefs;
  }

  // Inject a function for the vertexTransform and rename all usages of position/normal/uv
  if (vertexTransform) {
    // Hoist these defs to the very top so they work in other function defs
    vertexShader = `vec3 troika_position_${key};
vec3 troika_normal_${key};
vec2 troika_uv_${key};
${vertexShader}
`;
    vertexDefs = `${vertexDefs}
void troikaVertexTransform${key}(inout vec3 position, inout vec3 normal, inout vec2 uv) {
  ${vertexTransform}
}
`;
    vertexMainIntro = `
troika_position_${key} = vec3(position);
troika_normal_${key} = vec3(normal);
troika_uv_${key} = vec2(uv);
troikaVertexTransform${key}(troika_position_${key}, troika_normal_${key}, troika_uv_${key});
${vertexMainIntro}
`;
    vertexShader = vertexShader.replace(/\b(position|normal|uv)\b/g, (match, match1, index, fullStr) => {
      return /\battribute\s+vec[23]\s+$/.test(fullStr.substr(0, index)) ? match1 : `troika_${match1}_${key}`
    });

    // Three r152 introduced the MAP_UV token, replace it too if it's pointing to the main 'uv'
    // Perhaps the other textures too going forward?
    if (!(material.map && material.map.channel > 0)) {
      vertexShader = vertexShader.replace(/\bMAP_UV\b/g, `troika_uv_${key}`);
    }
  }

  // Inject defs and intro/outro snippets
  vertexShader = injectIntoShaderCode(vertexShader, key, vertexDefs, vertexMainIntro, vertexMainOutro);
  fragmentShader = injectIntoShaderCode(fragmentShader, key, fragmentDefs, fragmentMainIntro, fragmentMainOutro);

  return {
    vertexShader,
    fragmentShader
  }
}

function injectIntoShaderCode(shaderCode, id, defs, intro, outro) {
  if (intro || outro || defs) {
    shaderCode = shaderCode.replace(voidMainRegExp, `
${defs}
void troikaOrigMain${id}() {`
    );
    shaderCode += `
void main() {
  ${intro}
  troikaOrigMain${id}();
  ${outro}
}`;
  }
  return shaderCode
}


function optionsJsonReplacer(key, value) {
  return key === 'uniforms' ? undefined : typeof value === 'function' ? value.toString() : value
}

let _idCtr = 0;
const optionsHashesToIds = new Map();
function getKeyForOptions(options) {
  const optionsHash = JSON.stringify(options, optionsJsonReplacer);
  let id = optionsHashesToIds.get(optionsHash);
  if (id == null) {
    optionsHashesToIds.set(optionsHash, (id = ++_idCtr));
  }
  return id
}

/*!
Custom build of Typr.ts (https://github.com/fredli74/Typr.ts) for use in Troika text rendering.
Original MIT license applies: https://github.com/fredli74/Typr.ts/blob/master/LICENSE
*/
function typrFactory(){return "undefined"==typeof window&&(self.window=self),function(r){var e={parse:function(r){var t=e._bin,a=new Uint8Array(r);if("ttcf"==t.readASCII(a,0,4)){var n=4;t.readUshort(a,n),n+=2,t.readUshort(a,n),n+=2;var o=t.readUint(a,n);n+=4;for(var s=[],i=0;i<o;i++){var h=t.readUint(a,n);n+=4,s.push(e._readFont(a,h));}return s}return [e._readFont(a,0)]},_readFont:function(r,t){var a=e._bin,n=t;a.readFixed(r,t),t+=4;var o=a.readUshort(r,t);t+=2,a.readUshort(r,t),t+=2,a.readUshort(r,t),t+=2,a.readUshort(r,t),t+=2;for(var s=["cmap","head","hhea","maxp","hmtx","name","OS/2","post","loca","glyf","kern","CFF ","GDEF","GPOS","GSUB","SVG "],i={_data:r,_offset:n},h={},d=0;d<o;d++){var f=a.readASCII(r,t,4);t+=4,a.readUint(r,t),t+=4;var u=a.readUint(r,t);t+=4;var l=a.readUint(r,t);t+=4,h[f]={offset:u,length:l};}for(d=0;d<s.length;d++){var v=s[d];h[v]&&(i[v.trim()]=e[v.trim()].parse(r,h[v].offset,h[v].length,i));}return i},_tabOffset:function(r,t,a){for(var n=e._bin,o=n.readUshort(r,a+4),s=a+12,i=0;i<o;i++){var h=n.readASCII(r,s,4);s+=4,n.readUint(r,s),s+=4;var d=n.readUint(r,s);if(s+=4,n.readUint(r,s),s+=4,h==t)return d}return 0}};e._bin={readFixed:function(r,e){return (r[e]<<8|r[e+1])+(r[e+2]<<8|r[e+3])/65540},readF2dot14:function(r,t){return e._bin.readShort(r,t)/16384},readInt:function(r,t){return e._bin._view(r).getInt32(t)},readInt8:function(r,t){return e._bin._view(r).getInt8(t)},readShort:function(r,t){return e._bin._view(r).getInt16(t)},readUshort:function(r,t){return e._bin._view(r).getUint16(t)},readUshorts:function(r,t,a){for(var n=[],o=0;o<a;o++)n.push(e._bin.readUshort(r,t+2*o));return n},readUint:function(r,t){return e._bin._view(r).getUint32(t)},readUint64:function(r,t){return 4294967296*e._bin.readUint(r,t)+e._bin.readUint(r,t+4)},readASCII:function(r,e,t){for(var a="",n=0;n<t;n++)a+=String.fromCharCode(r[e+n]);return a},readUnicode:function(r,e,t){for(var a="",n=0;n<t;n++){var o=r[e++]<<8|r[e++];a+=String.fromCharCode(o);}return a},_tdec:"undefined"!=typeof window&&window.TextDecoder?new window.TextDecoder:null,readUTF8:function(r,t,a){var n=e._bin._tdec;return n&&0==t&&a==r.length?n.decode(r):e._bin.readASCII(r,t,a)},readBytes:function(r,e,t){for(var a=[],n=0;n<t;n++)a.push(r[e+n]);return a},readASCIIArray:function(r,e,t){for(var a=[],n=0;n<t;n++)a.push(String.fromCharCode(r[e+n]));return a},_view:function(r){return r._dataView||(r._dataView=r.buffer?new DataView(r.buffer,r.byteOffset,r.byteLength):new DataView(new Uint8Array(r).buffer))}},e._lctf={},e._lctf.parse=function(r,t,a,n,o){var s=e._bin,i={},h=t;s.readFixed(r,t),t+=4;var d=s.readUshort(r,t);t+=2;var f=s.readUshort(r,t);t+=2;var u=s.readUshort(r,t);return t+=2,i.scriptList=e._lctf.readScriptList(r,h+d),i.featureList=e._lctf.readFeatureList(r,h+f),i.lookupList=e._lctf.readLookupList(r,h+u,o),i},e._lctf.readLookupList=function(r,t,a){var n=e._bin,o=t,s=[],i=n.readUshort(r,t);t+=2;for(var h=0;h<i;h++){var d=n.readUshort(r,t);t+=2;var f=e._lctf.readLookupTable(r,o+d,a);s.push(f);}return s},e._lctf.readLookupTable=function(r,t,a){var n=e._bin,o=t,s={tabs:[]};s.ltype=n.readUshort(r,t),t+=2,s.flag=n.readUshort(r,t),t+=2;var i=n.readUshort(r,t);t+=2;for(var h=s.ltype,d=0;d<i;d++){var f=n.readUshort(r,t);t+=2;var u=a(r,h,o+f,s);s.tabs.push(u);}return s},e._lctf.numOfOnes=function(r){for(var e=0,t=0;t<32;t++)0!=(r>>>t&1)&&e++;return e},e._lctf.readClassDef=function(r,t){var a=e._bin,n=[],o=a.readUshort(r,t);if(t+=2,1==o){var s=a.readUshort(r,t);t+=2;var i=a.readUshort(r,t);t+=2;for(var h=0;h<i;h++)n.push(s+h),n.push(s+h),n.push(a.readUshort(r,t)),t+=2;}if(2==o){var d=a.readUshort(r,t);t+=2;for(h=0;h<d;h++)n.push(a.readUshort(r,t)),t+=2,n.push(a.readUshort(r,t)),t+=2,n.push(a.readUshort(r,t)),t+=2;}return n},e._lctf.getInterval=function(r,e){for(var t=0;t<r.length;t+=3){var a=r[t],n=r[t+1];if(r[t+2],a<=e&&e<=n)return t}return -1},e._lctf.readCoverage=function(r,t){var a=e._bin,n={};n.fmt=a.readUshort(r,t),t+=2;var o=a.readUshort(r,t);return t+=2,1==n.fmt&&(n.tab=a.readUshorts(r,t,o)),2==n.fmt&&(n.tab=a.readUshorts(r,t,3*o)),n},e._lctf.coverageIndex=function(r,t){var a=r.tab;if(1==r.fmt)return a.indexOf(t);if(2==r.fmt){var n=e._lctf.getInterval(a,t);if(-1!=n)return a[n+2]+(t-a[n])}return -1},e._lctf.readFeatureList=function(r,t){var a=e._bin,n=t,o=[],s=a.readUshort(r,t);t+=2;for(var i=0;i<s;i++){var h=a.readASCII(r,t,4);t+=4;var d=a.readUshort(r,t);t+=2;var f=e._lctf.readFeatureTable(r,n+d);f.tag=h.trim(),o.push(f);}return o},e._lctf.readFeatureTable=function(r,t){var a=e._bin,n=t,o={},s=a.readUshort(r,t);t+=2,s>0&&(o.featureParams=n+s);var i=a.readUshort(r,t);t+=2,o.tab=[];for(var h=0;h<i;h++)o.tab.push(a.readUshort(r,t+2*h));return o},e._lctf.readScriptList=function(r,t){var a=e._bin,n=t,o={},s=a.readUshort(r,t);t+=2;for(var i=0;i<s;i++){var h=a.readASCII(r,t,4);t+=4;var d=a.readUshort(r,t);t+=2,o[h.trim()]=e._lctf.readScriptTable(r,n+d);}return o},e._lctf.readScriptTable=function(r,t){var a=e._bin,n=t,o={},s=a.readUshort(r,t);t+=2,s>0&&(o.default=e._lctf.readLangSysTable(r,n+s));var i=a.readUshort(r,t);t+=2;for(var h=0;h<i;h++){var d=a.readASCII(r,t,4);t+=4;var f=a.readUshort(r,t);t+=2,o[d.trim()]=e._lctf.readLangSysTable(r,n+f);}return o},e._lctf.readLangSysTable=function(r,t){var a=e._bin,n={};a.readUshort(r,t),t+=2,n.reqFeature=a.readUshort(r,t),t+=2;var o=a.readUshort(r,t);return t+=2,n.features=a.readUshorts(r,t,o),n},e.CFF={},e.CFF.parse=function(r,t,a){var n=e._bin;(r=new Uint8Array(r.buffer,t,a))[t=0],r[++t],r[++t],r[++t],t++;var o=[];t=e.CFF.readIndex(r,t,o);for(var s=[],i=0;i<o.length-1;i++)s.push(n.readASCII(r,t+o[i],o[i+1]-o[i]));t+=o[o.length-1];var h=[];t=e.CFF.readIndex(r,t,h);var d=[];for(i=0;i<h.length-1;i++)d.push(e.CFF.readDict(r,t+h[i],t+h[i+1]));t+=h[h.length-1];var f=d[0],u=[];t=e.CFF.readIndex(r,t,u);var l=[];for(i=0;i<u.length-1;i++)l.push(n.readASCII(r,t+u[i],u[i+1]-u[i]));if(t+=u[u.length-1],e.CFF.readSubrs(r,t,f),f.CharStrings){t=f.CharStrings;u=[];t=e.CFF.readIndex(r,t,u);var v=[];for(i=0;i<u.length-1;i++)v.push(n.readBytes(r,t+u[i],u[i+1]-u[i]));f.CharStrings=v;}if(f.ROS){t=f.FDArray;var c=[];t=e.CFF.readIndex(r,t,c),f.FDArray=[];for(i=0;i<c.length-1;i++){var p=e.CFF.readDict(r,t+c[i],t+c[i+1]);e.CFF._readFDict(r,p,l),f.FDArray.push(p);}t+=c[c.length-1],t=f.FDSelect,f.FDSelect=[];var U=r[t];if(t++,3!=U)throw U;var g=n.readUshort(r,t);t+=2;for(i=0;i<g+1;i++)f.FDSelect.push(n.readUshort(r,t),r[t+2]),t+=3;}return f.Encoding&&(f.Encoding=e.CFF.readEncoding(r,f.Encoding,f.CharStrings.length)),f.charset&&(f.charset=e.CFF.readCharset(r,f.charset,f.CharStrings.length)),e.CFF._readFDict(r,f,l),f},e.CFF._readFDict=function(r,t,a){var n;for(var o in t.Private&&(n=t.Private[1],t.Private=e.CFF.readDict(r,n,n+t.Private[0]),t.Private.Subrs&&e.CFF.readSubrs(r,n+t.Private.Subrs,t.Private)),t)-1!=["FamilyName","FontName","FullName","Notice","version","Copyright"].indexOf(o)&&(t[o]=a[t[o]-426+35]);},e.CFF.readSubrs=function(r,t,a){var n=e._bin,o=[];t=e.CFF.readIndex(r,t,o);var s,i=o.length;s=i<1240?107:i<33900?1131:32768,a.Bias=s,a.Subrs=[];for(var h=0;h<o.length-1;h++)a.Subrs.push(n.readBytes(r,t+o[h],o[h+1]-o[h]));},e.CFF.tableSE=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,0,111,112,113,114,0,115,116,117,118,119,120,121,122,0,123,0,124,125,126,127,128,129,130,131,0,132,133,0,134,135,136,137,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,138,0,139,0,0,0,0,140,141,142,143,0,0,0,0,0,144,0,0,0,145,0,0,146,147,148,149,0,0,0,0],e.CFF.glyphByUnicode=function(r,e){for(var t=0;t<r.charset.length;t++)if(r.charset[t]==e)return t;return -1},e.CFF.glyphBySE=function(r,t){return t<0||t>255?-1:e.CFF.glyphByUnicode(r,e.CFF.tableSE[t])},e.CFF.readEncoding=function(r,t,a){e._bin;var n=[".notdef"],o=r[t];if(t++,0!=o)throw "error: unknown encoding format: "+o;var s=r[t];t++;for(var i=0;i<s;i++)n.push(r[t+i]);return n},e.CFF.readCharset=function(r,t,a){var n=e._bin,o=[".notdef"],s=r[t];if(t++,0==s)for(var i=0;i<a;i++){var h=n.readUshort(r,t);t+=2,o.push(h);}else {if(1!=s&&2!=s)throw "error: format: "+s;for(;o.length<a;){h=n.readUshort(r,t);t+=2;var d=0;1==s?(d=r[t],t++):(d=n.readUshort(r,t),t+=2);for(i=0;i<=d;i++)o.push(h),h++;}}return o},e.CFF.readIndex=function(r,t,a){var n=e._bin,o=n.readUshort(r,t)+1,s=r[t+=2];if(t++,1==s)for(var i=0;i<o;i++)a.push(r[t+i]);else if(2==s)for(i=0;i<o;i++)a.push(n.readUshort(r,t+2*i));else if(3==s)for(i=0;i<o;i++)a.push(16777215&n.readUint(r,t+3*i-1));else if(1!=o)throw "unsupported offset size: "+s+", count: "+o;return (t+=o*s)-1},e.CFF.getCharString=function(r,t,a){var n=e._bin,o=r[t],s=r[t+1];r[t+2],r[t+3],r[t+4];var i=1,h=null,d=null;o<=20&&(h=o,i=1),12==o&&(h=100*o+s,i=2),21<=o&&o<=27&&(h=o,i=1),28==o&&(d=n.readShort(r,t+1),i=3),29<=o&&o<=31&&(h=o,i=1),32<=o&&o<=246&&(d=o-139,i=1),247<=o&&o<=250&&(d=256*(o-247)+s+108,i=2),251<=o&&o<=254&&(d=256*-(o-251)-s-108,i=2),255==o&&(d=n.readInt(r,t+1)/65535,i=5),a.val=null!=d?d:"o"+h,a.size=i;},e.CFF.readCharString=function(r,t,a){for(var n=t+a,o=e._bin,s=[];t<n;){var i=r[t],h=r[t+1];r[t+2],r[t+3],r[t+4];var d=1,f=null,u=null;i<=20&&(f=i,d=1),12==i&&(f=100*i+h,d=2),19!=i&&20!=i||(f=i,d=2),21<=i&&i<=27&&(f=i,d=1),28==i&&(u=o.readShort(r,t+1),d=3),29<=i&&i<=31&&(f=i,d=1),32<=i&&i<=246&&(u=i-139,d=1),247<=i&&i<=250&&(u=256*(i-247)+h+108,d=2),251<=i&&i<=254&&(u=256*-(i-251)-h-108,d=2),255==i&&(u=o.readInt(r,t+1)/65535,d=5),s.push(null!=u?u:"o"+f),t+=d;}return s},e.CFF.readDict=function(r,t,a){for(var n=e._bin,o={},s=[];t<a;){var i=r[t],h=r[t+1];r[t+2],r[t+3],r[t+4];var d=1,f=null,u=null;if(28==i&&(u=n.readShort(r,t+1),d=3),29==i&&(u=n.readInt(r,t+1),d=5),32<=i&&i<=246&&(u=i-139,d=1),247<=i&&i<=250&&(u=256*(i-247)+h+108,d=2),251<=i&&i<=254&&(u=256*-(i-251)-h-108,d=2),255==i)throw u=n.readInt(r,t+1)/65535,d=5,"unknown number";if(30==i){var l=[];for(d=1;;){var v=r[t+d];d++;var c=v>>4,p=15&v;if(15!=c&&l.push(c),15!=p&&l.push(p),15==p)break}for(var U="",g=[0,1,2,3,4,5,6,7,8,9,".","e","e-","reserved","-","endOfNumber"],S=0;S<l.length;S++)U+=g[l[S]];u=parseFloat(U);}if(i<=21)if(f=["version","Notice","FullName","FamilyName","Weight","FontBBox","BlueValues","OtherBlues","FamilyBlues","FamilyOtherBlues","StdHW","StdVW","escape","UniqueID","XUID","charset","Encoding","CharStrings","Private","Subrs","defaultWidthX","nominalWidthX"][i],d=1,12==i)f=["Copyright","isFixedPitch","ItalicAngle","UnderlinePosition","UnderlineThickness","PaintType","CharstringType","FontMatrix","StrokeWidth","BlueScale","BlueShift","BlueFuzz","StemSnapH","StemSnapV","ForceBold",0,0,"LanguageGroup","ExpansionFactor","initialRandomSeed","SyntheticBase","PostScript","BaseFontName","BaseFontBlend",0,0,0,0,0,0,"ROS","CIDFontVersion","CIDFontRevision","CIDFontType","CIDCount","UIDBase","FDArray","FDSelect","FontName"][h],d=2;null!=f?(o[f]=1==s.length?s[0]:s,s=[]):s.push(u),t+=d;}return o},e.cmap={},e.cmap.parse=function(r,t,a){r=new Uint8Array(r.buffer,t,a),t=0;var n=e._bin,o={};n.readUshort(r,t),t+=2;var s=n.readUshort(r,t);t+=2;var i=[];o.tables=[];for(var h=0;h<s;h++){var d=n.readUshort(r,t);t+=2;var f=n.readUshort(r,t);t+=2;var u=n.readUint(r,t);t+=4;var l="p"+d+"e"+f,v=i.indexOf(u);if(-1==v){var c;v=o.tables.length,i.push(u);var p=n.readUshort(r,u);0==p?c=e.cmap.parse0(r,u):4==p?c=e.cmap.parse4(r,u):6==p?c=e.cmap.parse6(r,u):12==p?c=e.cmap.parse12(r,u):console.debug("unknown format: "+p,d,f,u),o.tables.push(c);}if(null!=o[l])throw "multiple tables for one platform+encoding";o[l]=v;}return o},e.cmap.parse0=function(r,t){var a=e._bin,n={};n.format=a.readUshort(r,t),t+=2;var o=a.readUshort(r,t);t+=2,a.readUshort(r,t),t+=2,n.map=[];for(var s=0;s<o-6;s++)n.map.push(r[t+s]);return n},e.cmap.parse4=function(r,t){var a=e._bin,n=t,o={};o.format=a.readUshort(r,t),t+=2;var s=a.readUshort(r,t);t+=2,a.readUshort(r,t),t+=2;var i=a.readUshort(r,t);t+=2;var h=i/2;o.searchRange=a.readUshort(r,t),t+=2,o.entrySelector=a.readUshort(r,t),t+=2,o.rangeShift=a.readUshort(r,t),t+=2,o.endCount=a.readUshorts(r,t,h),t+=2*h,t+=2,o.startCount=a.readUshorts(r,t,h),t+=2*h,o.idDelta=[];for(var d=0;d<h;d++)o.idDelta.push(a.readShort(r,t)),t+=2;for(o.idRangeOffset=a.readUshorts(r,t,h),t+=2*h,o.glyphIdArray=[];t<n+s;)o.glyphIdArray.push(a.readUshort(r,t)),t+=2;return o},e.cmap.parse6=function(r,t){var a=e._bin,n={};n.format=a.readUshort(r,t),t+=2,a.readUshort(r,t),t+=2,a.readUshort(r,t),t+=2,n.firstCode=a.readUshort(r,t),t+=2;var o=a.readUshort(r,t);t+=2,n.glyphIdArray=[];for(var s=0;s<o;s++)n.glyphIdArray.push(a.readUshort(r,t)),t+=2;return n},e.cmap.parse12=function(r,t){var a=e._bin,n={};n.format=a.readUshort(r,t),t+=2,t+=2,a.readUint(r,t),t+=4,a.readUint(r,t),t+=4;var o=a.readUint(r,t);t+=4,n.groups=[];for(var s=0;s<o;s++){var i=t+12*s,h=a.readUint(r,i+0),d=a.readUint(r,i+4),f=a.readUint(r,i+8);n.groups.push([h,d,f]);}return n},e.glyf={},e.glyf.parse=function(r,e,t,a){for(var n=[],o=0;o<a.maxp.numGlyphs;o++)n.push(null);return n},e.glyf._parseGlyf=function(r,t){var a=e._bin,n=r._data,o=e._tabOffset(n,"glyf",r._offset)+r.loca[t];if(r.loca[t]==r.loca[t+1])return null;var s={};if(s.noc=a.readShort(n,o),o+=2,s.xMin=a.readShort(n,o),o+=2,s.yMin=a.readShort(n,o),o+=2,s.xMax=a.readShort(n,o),o+=2,s.yMax=a.readShort(n,o),o+=2,s.xMin>=s.xMax||s.yMin>=s.yMax)return null;if(s.noc>0){s.endPts=[];for(var i=0;i<s.noc;i++)s.endPts.push(a.readUshort(n,o)),o+=2;var h=a.readUshort(n,o);if(o+=2,n.length-o<h)return null;s.instructions=a.readBytes(n,o,h),o+=h;var d=s.endPts[s.noc-1]+1;s.flags=[];for(i=0;i<d;i++){var f=n[o];if(o++,s.flags.push(f),0!=(8&f)){var u=n[o];o++;for(var l=0;l<u;l++)s.flags.push(f),i++;}}s.xs=[];for(i=0;i<d;i++){var v=0!=(2&s.flags[i]),c=0!=(16&s.flags[i]);v?(s.xs.push(c?n[o]:-n[o]),o++):c?s.xs.push(0):(s.xs.push(a.readShort(n,o)),o+=2);}s.ys=[];for(i=0;i<d;i++){v=0!=(4&s.flags[i]),c=0!=(32&s.flags[i]);v?(s.ys.push(c?n[o]:-n[o]),o++):c?s.ys.push(0):(s.ys.push(a.readShort(n,o)),o+=2);}var p=0,U=0;for(i=0;i<d;i++)p+=s.xs[i],U+=s.ys[i],s.xs[i]=p,s.ys[i]=U;}else {var g;s.parts=[];do{g=a.readUshort(n,o),o+=2;var S={m:{a:1,b:0,c:0,d:1,tx:0,ty:0},p1:-1,p2:-1};if(s.parts.push(S),S.glyphIndex=a.readUshort(n,o),o+=2,1&g){var m=a.readShort(n,o);o+=2;var b=a.readShort(n,o);o+=2;}else {m=a.readInt8(n,o);o++;b=a.readInt8(n,o);o++;}2&g?(S.m.tx=m,S.m.ty=b):(S.p1=m,S.p2=b),8&g?(S.m.a=S.m.d=a.readF2dot14(n,o),o+=2):64&g?(S.m.a=a.readF2dot14(n,o),o+=2,S.m.d=a.readF2dot14(n,o),o+=2):128&g&&(S.m.a=a.readF2dot14(n,o),o+=2,S.m.b=a.readF2dot14(n,o),o+=2,S.m.c=a.readF2dot14(n,o),o+=2,S.m.d=a.readF2dot14(n,o),o+=2);}while(32&g);if(256&g){var y=a.readUshort(n,o);o+=2,s.instr=[];for(i=0;i<y;i++)s.instr.push(n[o]),o++;}}return s},e.GDEF={},e.GDEF.parse=function(r,t,a,n){var o=t;t+=4;var s=e._bin.readUshort(r,t);return {glyphClassDef:0===s?null:e._lctf.readClassDef(r,o+s)}},e.GPOS={},e.GPOS.parse=function(r,t,a,n){return e._lctf.parse(r,t,a,n,e.GPOS.subt)},e.GPOS.subt=function(r,t,a,n){var o=e._bin,s=a,i={};if(i.fmt=o.readUshort(r,a),a+=2,1==t||2==t||3==t||7==t||8==t&&i.fmt<=2){var h=o.readUshort(r,a);a+=2,i.coverage=e._lctf.readCoverage(r,h+s);}if(1==t&&1==i.fmt){var d=o.readUshort(r,a);a+=2,0!=d&&(i.pos=e.GPOS.readValueRecord(r,a,d));}else if(2==t&&i.fmt>=1&&i.fmt<=2){d=o.readUshort(r,a);a+=2;var f=o.readUshort(r,a);a+=2;var u=e._lctf.numOfOnes(d),l=e._lctf.numOfOnes(f);if(1==i.fmt){i.pairsets=[];var v=o.readUshort(r,a);a+=2;for(var c=0;c<v;c++){var p=s+o.readUshort(r,a);a+=2;var U=o.readUshort(r,p);p+=2;for(var g=[],S=0;S<U;S++){var m=o.readUshort(r,p);p+=2,0!=d&&(P=e.GPOS.readValueRecord(r,p,d),p+=2*u),0!=f&&(x=e.GPOS.readValueRecord(r,p,f),p+=2*l),g.push({gid2:m,val1:P,val2:x});}i.pairsets.push(g);}}if(2==i.fmt){var b=o.readUshort(r,a);a+=2;var y=o.readUshort(r,a);a+=2;var F=o.readUshort(r,a);a+=2;var C=o.readUshort(r,a);a+=2,i.classDef1=e._lctf.readClassDef(r,s+b),i.classDef2=e._lctf.readClassDef(r,s+y),i.matrix=[];for(c=0;c<F;c++){var _=[];for(S=0;S<C;S++){var P=null,x=null;0!=d&&(P=e.GPOS.readValueRecord(r,a,d),a+=2*u),0!=f&&(x=e.GPOS.readValueRecord(r,a,f),a+=2*l),_.push({val1:P,val2:x});}i.matrix.push(_);}}}else if(4==t&&1==i.fmt)i.markCoverage=e._lctf.readCoverage(r,o.readUshort(r,a)+s),i.baseCoverage=e._lctf.readCoverage(r,o.readUshort(r,a+2)+s),i.markClassCount=o.readUshort(r,a+4),i.markArray=e.GPOS.readMarkArray(r,o.readUshort(r,a+6)+s),i.baseArray=e.GPOS.readBaseArray(r,o.readUshort(r,a+8)+s,i.markClassCount);else if(6==t&&1==i.fmt)i.mark1Coverage=e._lctf.readCoverage(r,o.readUshort(r,a)+s),i.mark2Coverage=e._lctf.readCoverage(r,o.readUshort(r,a+2)+s),i.markClassCount=o.readUshort(r,a+4),i.mark1Array=e.GPOS.readMarkArray(r,o.readUshort(r,a+6)+s),i.mark2Array=e.GPOS.readBaseArray(r,o.readUshort(r,a+8)+s,i.markClassCount);else {if(9==t&&1==i.fmt){var I=o.readUshort(r,a);a+=2;var w=o.readUint(r,a);if(a+=4,9==n.ltype)n.ltype=I;else if(n.ltype!=I)throw "invalid extension substitution";return e.GPOS.subt(r,n.ltype,s+w)}console.debug("unsupported GPOS table LookupType",t,"format",i.fmt);}return i},e.GPOS.readValueRecord=function(r,t,a){var n=e._bin,o=[];return o.push(1&a?n.readShort(r,t):0),t+=1&a?2:0,o.push(2&a?n.readShort(r,t):0),t+=2&a?2:0,o.push(4&a?n.readShort(r,t):0),t+=4&a?2:0,o.push(8&a?n.readShort(r,t):0),t+=8&a?2:0,o},e.GPOS.readBaseArray=function(r,t,a){var n=e._bin,o=[],s=t,i=n.readUshort(r,t);t+=2;for(var h=0;h<i;h++){for(var d=[],f=0;f<a;f++)d.push(e.GPOS.readAnchorRecord(r,s+n.readUshort(r,t))),t+=2;o.push(d);}return o},e.GPOS.readMarkArray=function(r,t){var a=e._bin,n=[],o=t,s=a.readUshort(r,t);t+=2;for(var i=0;i<s;i++){var h=e.GPOS.readAnchorRecord(r,a.readUshort(r,t+2)+o);h.markClass=a.readUshort(r,t),n.push(h),t+=4;}return n},e.GPOS.readAnchorRecord=function(r,t){var a=e._bin,n={};return n.fmt=a.readUshort(r,t),n.x=a.readShort(r,t+2),n.y=a.readShort(r,t+4),n},e.GSUB={},e.GSUB.parse=function(r,t,a,n){return e._lctf.parse(r,t,a,n,e.GSUB.subt)},e.GSUB.subt=function(r,t,a,n){var o=e._bin,s=a,i={};if(i.fmt=o.readUshort(r,a),a+=2,1!=t&&2!=t&&4!=t&&5!=t&&6!=t)return null;if(1==t||2==t||4==t||5==t&&i.fmt<=2||6==t&&i.fmt<=2){var h=o.readUshort(r,a);a+=2,i.coverage=e._lctf.readCoverage(r,s+h);}if(1==t&&i.fmt>=1&&i.fmt<=2){if(1==i.fmt)i.delta=o.readShort(r,a),a+=2;else if(2==i.fmt){var d=o.readUshort(r,a);a+=2,i.newg=o.readUshorts(r,a,d),a+=2*i.newg.length;}}else if(2==t&&1==i.fmt){d=o.readUshort(r,a);a+=2,i.seqs=[];for(var f=0;f<d;f++){var u=o.readUshort(r,a)+s;a+=2;var l=o.readUshort(r,u);i.seqs.push(o.readUshorts(r,u+2,l));}}else if(4==t){i.vals=[];d=o.readUshort(r,a);a+=2;for(f=0;f<d;f++){var v=o.readUshort(r,a);a+=2,i.vals.push(e.GSUB.readLigatureSet(r,s+v));}}else if(5==t&&2==i.fmt){if(2==i.fmt){var c=o.readUshort(r,a);a+=2,i.cDef=e._lctf.readClassDef(r,s+c),i.scset=[];var p=o.readUshort(r,a);a+=2;for(f=0;f<p;f++){var U=o.readUshort(r,a);a+=2,i.scset.push(0==U?null:e.GSUB.readSubClassSet(r,s+U));}}}else if(6==t&&3==i.fmt){if(3==i.fmt){for(f=0;f<3;f++){d=o.readUshort(r,a);a+=2;for(var g=[],S=0;S<d;S++)g.push(e._lctf.readCoverage(r,s+o.readUshort(r,a+2*S)));a+=2*d,0==f&&(i.backCvg=g),1==f&&(i.inptCvg=g),2==f&&(i.ahedCvg=g);}d=o.readUshort(r,a);a+=2,i.lookupRec=e.GSUB.readSubstLookupRecords(r,a,d);}}else {if(7==t&&1==i.fmt){var m=o.readUshort(r,a);a+=2;var b=o.readUint(r,a);if(a+=4,9==n.ltype)n.ltype=m;else if(n.ltype!=m)throw "invalid extension substitution";return e.GSUB.subt(r,n.ltype,s+b)}console.debug("unsupported GSUB table LookupType",t,"format",i.fmt);}return i},e.GSUB.readSubClassSet=function(r,t){var a=e._bin.readUshort,n=t,o=[],s=a(r,t);t+=2;for(var i=0;i<s;i++){var h=a(r,t);t+=2,o.push(e.GSUB.readSubClassRule(r,n+h));}return o},e.GSUB.readSubClassRule=function(r,t){var a=e._bin.readUshort,n={},o=a(r,t),s=a(r,t+=2);t+=2,n.input=[];for(var i=0;i<o-1;i++)n.input.push(a(r,t)),t+=2;return n.substLookupRecords=e.GSUB.readSubstLookupRecords(r,t,s),n},e.GSUB.readSubstLookupRecords=function(r,t,a){for(var n=e._bin.readUshort,o=[],s=0;s<a;s++)o.push(n(r,t),n(r,t+2)),t+=4;return o},e.GSUB.readChainSubClassSet=function(r,t){var a=e._bin,n=t,o=[],s=a.readUshort(r,t);t+=2;for(var i=0;i<s;i++){var h=a.readUshort(r,t);t+=2,o.push(e.GSUB.readChainSubClassRule(r,n+h));}return o},e.GSUB.readChainSubClassRule=function(r,t){for(var a=e._bin,n={},o=["backtrack","input","lookahead"],s=0;s<o.length;s++){var i=a.readUshort(r,t);t+=2,1==s&&i--,n[o[s]]=a.readUshorts(r,t,i),t+=2*n[o[s]].length;}i=a.readUshort(r,t);return t+=2,n.subst=a.readUshorts(r,t,2*i),t+=2*n.subst.length,n},e.GSUB.readLigatureSet=function(r,t){var a=e._bin,n=t,o=[],s=a.readUshort(r,t);t+=2;for(var i=0;i<s;i++){var h=a.readUshort(r,t);t+=2,o.push(e.GSUB.readLigature(r,n+h));}return o},e.GSUB.readLigature=function(r,t){var a=e._bin,n={chain:[]};n.nglyph=a.readUshort(r,t),t+=2;var o=a.readUshort(r,t);t+=2;for(var s=0;s<o-1;s++)n.chain.push(a.readUshort(r,t)),t+=2;return n},e.head={},e.head.parse=function(r,t,a){var n=e._bin,o={};return n.readFixed(r,t),t+=4,o.fontRevision=n.readFixed(r,t),t+=4,n.readUint(r,t),t+=4,n.readUint(r,t),t+=4,o.flags=n.readUshort(r,t),t+=2,o.unitsPerEm=n.readUshort(r,t),t+=2,o.created=n.readUint64(r,t),t+=8,o.modified=n.readUint64(r,t),t+=8,o.xMin=n.readShort(r,t),t+=2,o.yMin=n.readShort(r,t),t+=2,o.xMax=n.readShort(r,t),t+=2,o.yMax=n.readShort(r,t),t+=2,o.macStyle=n.readUshort(r,t),t+=2,o.lowestRecPPEM=n.readUshort(r,t),t+=2,o.fontDirectionHint=n.readShort(r,t),t+=2,o.indexToLocFormat=n.readShort(r,t),t+=2,o.glyphDataFormat=n.readShort(r,t),t+=2,o},e.hhea={},e.hhea.parse=function(r,t,a){var n=e._bin,o={};return n.readFixed(r,t),t+=4,o.ascender=n.readShort(r,t),t+=2,o.descender=n.readShort(r,t),t+=2,o.lineGap=n.readShort(r,t),t+=2,o.advanceWidthMax=n.readUshort(r,t),t+=2,o.minLeftSideBearing=n.readShort(r,t),t+=2,o.minRightSideBearing=n.readShort(r,t),t+=2,o.xMaxExtent=n.readShort(r,t),t+=2,o.caretSlopeRise=n.readShort(r,t),t+=2,o.caretSlopeRun=n.readShort(r,t),t+=2,o.caretOffset=n.readShort(r,t),t+=2,t+=8,o.metricDataFormat=n.readShort(r,t),t+=2,o.numberOfHMetrics=n.readUshort(r,t),t+=2,o},e.hmtx={},e.hmtx.parse=function(r,t,a,n){for(var o=e._bin,s={aWidth:[],lsBearing:[]},i=0,h=0,d=0;d<n.maxp.numGlyphs;d++)d<n.hhea.numberOfHMetrics&&(i=o.readUshort(r,t),t+=2,h=o.readShort(r,t),t+=2),s.aWidth.push(i),s.lsBearing.push(h);return s},e.kern={},e.kern.parse=function(r,t,a,n){var o=e._bin,s=o.readUshort(r,t);if(t+=2,1==s)return e.kern.parseV1(r,t-2,a,n);var i=o.readUshort(r,t);t+=2;for(var h={glyph1:[],rval:[]},d=0;d<i;d++){t+=2;a=o.readUshort(r,t);t+=2;var f=o.readUshort(r,t);t+=2;var u=f>>>8;if(0!=(u&=15))throw "unknown kern table format: "+u;t=e.kern.readFormat0(r,t,h);}return h},e.kern.parseV1=function(r,t,a,n){var o=e._bin;o.readFixed(r,t),t+=4;var s=o.readUint(r,t);t+=4;for(var i={glyph1:[],rval:[]},h=0;h<s;h++){o.readUint(r,t),t+=4;var d=o.readUshort(r,t);t+=2,o.readUshort(r,t),t+=2;var f=d>>>8;if(0!=(f&=15))throw "unknown kern table format: "+f;t=e.kern.readFormat0(r,t,i);}return i},e.kern.readFormat0=function(r,t,a){var n=e._bin,o=-1,s=n.readUshort(r,t);t+=2,n.readUshort(r,t),t+=2,n.readUshort(r,t),t+=2,n.readUshort(r,t),t+=2;for(var i=0;i<s;i++){var h=n.readUshort(r,t);t+=2;var d=n.readUshort(r,t);t+=2;var f=n.readShort(r,t);t+=2,h!=o&&(a.glyph1.push(h),a.rval.push({glyph2:[],vals:[]}));var u=a.rval[a.rval.length-1];u.glyph2.push(d),u.vals.push(f),o=h;}return t},e.loca={},e.loca.parse=function(r,t,a,n){var o=e._bin,s=[],i=n.head.indexToLocFormat,h=n.maxp.numGlyphs+1;if(0==i)for(var d=0;d<h;d++)s.push(o.readUshort(r,t+(d<<1))<<1);if(1==i)for(d=0;d<h;d++)s.push(o.readUint(r,t+(d<<2)));return s},e.maxp={},e.maxp.parse=function(r,t,a){var n=e._bin,o={},s=n.readUint(r,t);return t+=4,o.numGlyphs=n.readUshort(r,t),t+=2,65536==s&&(o.maxPoints=n.readUshort(r,t),t+=2,o.maxContours=n.readUshort(r,t),t+=2,o.maxCompositePoints=n.readUshort(r,t),t+=2,o.maxCompositeContours=n.readUshort(r,t),t+=2,o.maxZones=n.readUshort(r,t),t+=2,o.maxTwilightPoints=n.readUshort(r,t),t+=2,o.maxStorage=n.readUshort(r,t),t+=2,o.maxFunctionDefs=n.readUshort(r,t),t+=2,o.maxInstructionDefs=n.readUshort(r,t),t+=2,o.maxStackElements=n.readUshort(r,t),t+=2,o.maxSizeOfInstructions=n.readUshort(r,t),t+=2,o.maxComponentElements=n.readUshort(r,t),t+=2,o.maxComponentDepth=n.readUshort(r,t),t+=2),o},e.name={},e.name.parse=function(r,t,a){var n=e._bin,o={};n.readUshort(r,t),t+=2;var s=n.readUshort(r,t);t+=2,n.readUshort(r,t);for(var i,h=["copyright","fontFamily","fontSubfamily","ID","fullName","version","postScriptName","trademark","manufacturer","designer","description","urlVendor","urlDesigner","licence","licenceURL","---","typoFamilyName","typoSubfamilyName","compatibleFull","sampleText","postScriptCID","wwsFamilyName","wwsSubfamilyName","lightPalette","darkPalette"],d=t+=2,f=0;f<s;f++){var u=n.readUshort(r,t);t+=2;var l=n.readUshort(r,t);t+=2;var v=n.readUshort(r,t);t+=2;var c=n.readUshort(r,t);t+=2;var p=n.readUshort(r,t);t+=2;var U=n.readUshort(r,t);t+=2;var g,S=h[c],m=d+12*s+U;if(0==u)g=n.readUnicode(r,m,p/2);else if(3==u&&0==l)g=n.readUnicode(r,m,p/2);else if(0==l)g=n.readASCII(r,m,p);else if(1==l)g=n.readUnicode(r,m,p/2);else if(3==l)g=n.readUnicode(r,m,p/2);else {if(1!=u)throw "unknown encoding "+l+", platformID: "+u;g=n.readASCII(r,m,p),console.debug("reading unknown MAC encoding "+l+" as ASCII");}var b="p"+u+","+v.toString(16);null==o[b]&&(o[b]={}),o[b][void 0!==S?S:c]=g,o[b]._lang=v;}for(var y in o)if(null!=o[y].postScriptName&&1033==o[y]._lang)return o[y];for(var y in o)if(null!=o[y].postScriptName&&0==o[y]._lang)return o[y];for(var y in o)if(null!=o[y].postScriptName&&3084==o[y]._lang)return o[y];for(var y in o)if(null!=o[y].postScriptName)return o[y];for(var y in o){i=y;break}return console.debug("returning name table with languageID "+o[i]._lang),o[i]},e["OS/2"]={},e["OS/2"].parse=function(r,t,a){var n=e._bin.readUshort(r,t);t+=2;var o={};if(0==n)e["OS/2"].version0(r,t,o);else if(1==n)e["OS/2"].version1(r,t,o);else if(2==n||3==n||4==n)e["OS/2"].version2(r,t,o);else {if(5!=n)throw "unknown OS/2 table version: "+n;e["OS/2"].version5(r,t,o);}return o},e["OS/2"].version0=function(r,t,a){var n=e._bin;return a.xAvgCharWidth=n.readShort(r,t),t+=2,a.usWeightClass=n.readUshort(r,t),t+=2,a.usWidthClass=n.readUshort(r,t),t+=2,a.fsType=n.readUshort(r,t),t+=2,a.ySubscriptXSize=n.readShort(r,t),t+=2,a.ySubscriptYSize=n.readShort(r,t),t+=2,a.ySubscriptXOffset=n.readShort(r,t),t+=2,a.ySubscriptYOffset=n.readShort(r,t),t+=2,a.ySuperscriptXSize=n.readShort(r,t),t+=2,a.ySuperscriptYSize=n.readShort(r,t),t+=2,a.ySuperscriptXOffset=n.readShort(r,t),t+=2,a.ySuperscriptYOffset=n.readShort(r,t),t+=2,a.yStrikeoutSize=n.readShort(r,t),t+=2,a.yStrikeoutPosition=n.readShort(r,t),t+=2,a.sFamilyClass=n.readShort(r,t),t+=2,a.panose=n.readBytes(r,t,10),t+=10,a.ulUnicodeRange1=n.readUint(r,t),t+=4,a.ulUnicodeRange2=n.readUint(r,t),t+=4,a.ulUnicodeRange3=n.readUint(r,t),t+=4,a.ulUnicodeRange4=n.readUint(r,t),t+=4,a.achVendID=[n.readInt8(r,t),n.readInt8(r,t+1),n.readInt8(r,t+2),n.readInt8(r,t+3)],t+=4,a.fsSelection=n.readUshort(r,t),t+=2,a.usFirstCharIndex=n.readUshort(r,t),t+=2,a.usLastCharIndex=n.readUshort(r,t),t+=2,a.sTypoAscender=n.readShort(r,t),t+=2,a.sTypoDescender=n.readShort(r,t),t+=2,a.sTypoLineGap=n.readShort(r,t),t+=2,a.usWinAscent=n.readUshort(r,t),t+=2,a.usWinDescent=n.readUshort(r,t),t+=2},e["OS/2"].version1=function(r,t,a){var n=e._bin;return t=e["OS/2"].version0(r,t,a),a.ulCodePageRange1=n.readUint(r,t),t+=4,a.ulCodePageRange2=n.readUint(r,t),t+=4},e["OS/2"].version2=function(r,t,a){var n=e._bin;return t=e["OS/2"].version1(r,t,a),a.sxHeight=n.readShort(r,t),t+=2,a.sCapHeight=n.readShort(r,t),t+=2,a.usDefault=n.readUshort(r,t),t+=2,a.usBreak=n.readUshort(r,t),t+=2,a.usMaxContext=n.readUshort(r,t),t+=2},e["OS/2"].version5=function(r,t,a){var n=e._bin;return t=e["OS/2"].version2(r,t,a),a.usLowerOpticalPointSize=n.readUshort(r,t),t+=2,a.usUpperOpticalPointSize=n.readUshort(r,t),t+=2},e.post={},e.post.parse=function(r,t,a){var n=e._bin,o={};return o.version=n.readFixed(r,t),t+=4,o.italicAngle=n.readFixed(r,t),t+=4,o.underlinePosition=n.readShort(r,t),t+=2,o.underlineThickness=n.readShort(r,t),t+=2,o},null==e&&(e={}),null==e.U&&(e.U={}),e.U.codeToGlyph=function(r,e){var t=r.cmap,a=-1;if(null!=t.p0e4?a=t.p0e4:null!=t.p3e1?a=t.p3e1:null!=t.p1e0?a=t.p1e0:null!=t.p0e3&&(a=t.p0e3),-1==a)throw "no familiar platform and encoding!";var n=t.tables[a];if(0==n.format)return e>=n.map.length?0:n.map[e];if(4==n.format){for(var o=-1,s=0;s<n.endCount.length;s++)if(e<=n.endCount[s]){o=s;break}if(-1==o)return 0;if(n.startCount[o]>e)return 0;return 65535&(0!=n.idRangeOffset[o]?n.glyphIdArray[e-n.startCount[o]+(n.idRangeOffset[o]>>1)-(n.idRangeOffset.length-o)]:e+n.idDelta[o])}if(12==n.format){if(e>n.groups[n.groups.length-1][1])return 0;for(s=0;s<n.groups.length;s++){var i=n.groups[s];if(i[0]<=e&&e<=i[1])return i[2]+(e-i[0])}return 0}throw "unknown cmap table format "+n.format},e.U.glyphToPath=function(r,t){var a={cmds:[],crds:[]};if(r.SVG&&r.SVG.entries[t]){var n=r.SVG.entries[t];return null==n?a:("string"==typeof n&&(n=e.SVG.toPath(n),r.SVG.entries[t]=n),n)}if(r.CFF){var o={x:0,y:0,stack:[],nStems:0,haveWidth:!1,width:r.CFF.Private?r.CFF.Private.defaultWidthX:0,open:!1},s=r.CFF,i=r.CFF.Private;if(s.ROS){for(var h=0;s.FDSelect[h+2]<=t;)h+=2;i=s.FDArray[s.FDSelect[h+1]].Private;}e.U._drawCFF(r.CFF.CharStrings[t],o,s,i,a);}else r.glyf&&e.U._drawGlyf(t,r,a);return a},e.U._drawGlyf=function(r,t,a){var n=t.glyf[r];null==n&&(n=t.glyf[r]=e.glyf._parseGlyf(t,r)),null!=n&&(n.noc>-1?e.U._simpleGlyph(n,a):e.U._compoGlyph(n,t,a));},e.U._simpleGlyph=function(r,t){for(var a=0;a<r.noc;a++){for(var n=0==a?0:r.endPts[a-1]+1,o=r.endPts[a],s=n;s<=o;s++){var i=s==n?o:s-1,h=s==o?n:s+1,d=1&r.flags[s],f=1&r.flags[i],u=1&r.flags[h],l=r.xs[s],v=r.ys[s];if(s==n)if(d){if(!f){e.U.P.moveTo(t,l,v);continue}e.U.P.moveTo(t,r.xs[i],r.ys[i]);}else f?e.U.P.moveTo(t,r.xs[i],r.ys[i]):e.U.P.moveTo(t,(r.xs[i]+l)/2,(r.ys[i]+v)/2);d?f&&e.U.P.lineTo(t,l,v):u?e.U.P.qcurveTo(t,l,v,r.xs[h],r.ys[h]):e.U.P.qcurveTo(t,l,v,(l+r.xs[h])/2,(v+r.ys[h])/2);}e.U.P.closePath(t);}},e.U._compoGlyph=function(r,t,a){for(var n=0;n<r.parts.length;n++){var o={cmds:[],crds:[]},s=r.parts[n];e.U._drawGlyf(s.glyphIndex,t,o);for(var i=s.m,h=0;h<o.crds.length;h+=2){var d=o.crds[h],f=o.crds[h+1];a.crds.push(d*i.a+f*i.b+i.tx),a.crds.push(d*i.c+f*i.d+i.ty);}for(h=0;h<o.cmds.length;h++)a.cmds.push(o.cmds[h]);}},e.U._getGlyphClass=function(r,t){var a=e._lctf.getInterval(t,r);return -1==a?0:t[a+2]},e.U._applySubs=function(r,t,a,n){for(var o=r.length-t-1,s=0;s<a.tabs.length;s++)if(null!=a.tabs[s]){var i,h=a.tabs[s];if(!h.coverage||-1!=(i=e._lctf.coverageIndex(h.coverage,r[t])))if(1==a.ltype)r[t],1==h.fmt?r[t]=r[t]+h.delta:r[t]=h.newg[i];else if(4==a.ltype)for(var d=h.vals[i],f=0;f<d.length;f++){var u=d[f],l=u.chain.length;if(!(l>o)){for(var v=!0,c=0,p=0;p<l;p++){for(;-1==r[t+c+(1+p)];)c++;u.chain[p]!=r[t+c+(1+p)]&&(v=!1);}if(v){r[t]=u.nglyph;for(p=0;p<l+c;p++)r[t+p+1]=-1;break}}}else if(5==a.ltype&&2==h.fmt)for(var U=e._lctf.getInterval(h.cDef,r[t]),g=h.cDef[U+2],S=h.scset[g],m=0;m<S.length;m++){var b=S[m],y=b.input;if(!(y.length>o)){for(v=!0,p=0;p<y.length;p++){var F=e._lctf.getInterval(h.cDef,r[t+1+p]);if(-1==U&&h.cDef[F+2]!=y[p]){v=!1;break}}if(v){var C=b.substLookupRecords;for(f=0;f<C.length;f+=2)C[f],C[f+1];}}}else if(6==a.ltype&&3==h.fmt){if(!e.U._glsCovered(r,h.backCvg,t-h.backCvg.length))continue;if(!e.U._glsCovered(r,h.inptCvg,t))continue;if(!e.U._glsCovered(r,h.ahedCvg,t+h.inptCvg.length))continue;var _=h.lookupRec;for(m=0;m<_.length;m+=2){U=_[m];var P=n[_[m+1]];e.U._applySubs(r,t+U,P,n);}}}},e.U._glsCovered=function(r,t,a){for(var n=0;n<t.length;n++){if(-1==e._lctf.coverageIndex(t[n],r[a+n]))return !1}return !0},e.U.glyphsToPath=function(r,t,a){for(var n={cmds:[],crds:[]},o=0,s=0;s<t.length;s++){var i=t[s];if(-1!=i){for(var h=s<t.length-1&&-1!=t[s+1]?t[s+1]:0,d=e.U.glyphToPath(r,i),f=0;f<d.crds.length;f+=2)n.crds.push(d.crds[f]+o),n.crds.push(d.crds[f+1]);a&&n.cmds.push(a);for(f=0;f<d.cmds.length;f++)n.cmds.push(d.cmds[f]);a&&n.cmds.push("X"),o+=r.hmtx.aWidth[i],s<t.length-1&&(o+=e.U.getPairAdjustment(r,i,h));}}return n},e.U.P={},e.U.P.moveTo=function(r,e,t){r.cmds.push("M"),r.crds.push(e,t);},e.U.P.lineTo=function(r,e,t){r.cmds.push("L"),r.crds.push(e,t);},e.U.P.curveTo=function(r,e,t,a,n,o,s){r.cmds.push("C"),r.crds.push(e,t,a,n,o,s);},e.U.P.qcurveTo=function(r,e,t,a,n){r.cmds.push("Q"),r.crds.push(e,t,a,n);},e.U.P.closePath=function(r){r.cmds.push("Z");},e.U._drawCFF=function(r,t,a,n,o){for(var s=t.stack,i=t.nStems,h=t.haveWidth,d=t.width,f=t.open,u=0,l=t.x,v=t.y,c=0,p=0,U=0,g=0,S=0,m=0,b=0,y=0,F=0,C=0,_={val:0,size:0};u<r.length;){e.CFF.getCharString(r,u,_);var P=_.val;if(u+=_.size,"o1"==P||"o18"==P)s.length%2!=0&&!h&&(d=s.shift()+n.nominalWidthX),i+=s.length>>1,s.length=0,h=!0;else if("o3"==P||"o23"==P){s.length%2!=0&&!h&&(d=s.shift()+n.nominalWidthX),i+=s.length>>1,s.length=0,h=!0;}else if("o4"==P)s.length>1&&!h&&(d=s.shift()+n.nominalWidthX,h=!0),f&&e.U.P.closePath(o),v+=s.pop(),e.U.P.moveTo(o,l,v),f=!0;else if("o5"==P)for(;s.length>0;)l+=s.shift(),v+=s.shift(),e.U.P.lineTo(o,l,v);else if("o6"==P||"o7"==P)for(var x=s.length,I="o6"==P,w=0;w<x;w++){var k=s.shift();I?l+=k:v+=k,I=!I,e.U.P.lineTo(o,l,v);}else if("o8"==P||"o24"==P){x=s.length;for(var G=0;G+6<=x;)c=l+s.shift(),p=v+s.shift(),U=c+s.shift(),g=p+s.shift(),l=U+s.shift(),v=g+s.shift(),e.U.P.curveTo(o,c,p,U,g,l,v),G+=6;"o24"==P&&(l+=s.shift(),v+=s.shift(),e.U.P.lineTo(o,l,v));}else {if("o11"==P)break;if("o1234"==P||"o1235"==P||"o1236"==P||"o1237"==P)"o1234"==P&&(p=v,U=(c=l+s.shift())+s.shift(),C=g=p+s.shift(),m=g,y=v,l=(b=(S=(F=U+s.shift())+s.shift())+s.shift())+s.shift(),e.U.P.curveTo(o,c,p,U,g,F,C),e.U.P.curveTo(o,S,m,b,y,l,v)),"o1235"==P&&(c=l+s.shift(),p=v+s.shift(),U=c+s.shift(),g=p+s.shift(),F=U+s.shift(),C=g+s.shift(),S=F+s.shift(),m=C+s.shift(),b=S+s.shift(),y=m+s.shift(),l=b+s.shift(),v=y+s.shift(),s.shift(),e.U.P.curveTo(o,c,p,U,g,F,C),e.U.P.curveTo(o,S,m,b,y,l,v)),"o1236"==P&&(c=l+s.shift(),p=v+s.shift(),U=c+s.shift(),C=g=p+s.shift(),m=g,b=(S=(F=U+s.shift())+s.shift())+s.shift(),y=m+s.shift(),l=b+s.shift(),e.U.P.curveTo(o,c,p,U,g,F,C),e.U.P.curveTo(o,S,m,b,y,l,v)),"o1237"==P&&(c=l+s.shift(),p=v+s.shift(),U=c+s.shift(),g=p+s.shift(),F=U+s.shift(),C=g+s.shift(),S=F+s.shift(),m=C+s.shift(),b=S+s.shift(),y=m+s.shift(),Math.abs(b-l)>Math.abs(y-v)?l=b+s.shift():v=y+s.shift(),e.U.P.curveTo(o,c,p,U,g,F,C),e.U.P.curveTo(o,S,m,b,y,l,v));else if("o14"==P){if(s.length>0&&!h&&(d=s.shift()+a.nominalWidthX,h=!0),4==s.length){var O=s.shift(),T=s.shift(),D=s.shift(),B=s.shift(),A=e.CFF.glyphBySE(a,D),R=e.CFF.glyphBySE(a,B);e.U._drawCFF(a.CharStrings[A],t,a,n,o),t.x=O,t.y=T,e.U._drawCFF(a.CharStrings[R],t,a,n,o);}f&&(e.U.P.closePath(o),f=!1);}else if("o19"==P||"o20"==P){s.length%2!=0&&!h&&(d=s.shift()+n.nominalWidthX),i+=s.length>>1,s.length=0,h=!0,u+=i+7>>3;}else if("o21"==P)s.length>2&&!h&&(d=s.shift()+n.nominalWidthX,h=!0),v+=s.pop(),l+=s.pop(),f&&e.U.P.closePath(o),e.U.P.moveTo(o,l,v),f=!0;else if("o22"==P)s.length>1&&!h&&(d=s.shift()+n.nominalWidthX,h=!0),l+=s.pop(),f&&e.U.P.closePath(o),e.U.P.moveTo(o,l,v),f=!0;else if("o25"==P){for(;s.length>6;)l+=s.shift(),v+=s.shift(),e.U.P.lineTo(o,l,v);c=l+s.shift(),p=v+s.shift(),U=c+s.shift(),g=p+s.shift(),l=U+s.shift(),v=g+s.shift(),e.U.P.curveTo(o,c,p,U,g,l,v);}else if("o26"==P)for(s.length%2&&(l+=s.shift());s.length>0;)c=l,p=v+s.shift(),l=U=c+s.shift(),v=(g=p+s.shift())+s.shift(),e.U.P.curveTo(o,c,p,U,g,l,v);else if("o27"==P)for(s.length%2&&(v+=s.shift());s.length>0;)p=v,U=(c=l+s.shift())+s.shift(),g=p+s.shift(),l=U+s.shift(),v=g,e.U.P.curveTo(o,c,p,U,g,l,v);else if("o10"==P||"o29"==P){var L="o10"==P?n:a;if(0==s.length)console.debug("error: empty stack");else {var W=s.pop(),M=L.Subrs[W+L.Bias];t.x=l,t.y=v,t.nStems=i,t.haveWidth=h,t.width=d,t.open=f,e.U._drawCFF(M,t,a,n,o),l=t.x,v=t.y,i=t.nStems,h=t.haveWidth,d=t.width,f=t.open;}}else if("o30"==P||"o31"==P){var V=s.length,E=(G=0,"o31"==P);for(G+=V-(x=-3&V);G<x;)E?(p=v,U=(c=l+s.shift())+s.shift(),v=(g=p+s.shift())+s.shift(),x-G==5?(l=U+s.shift(),G++):l=U,E=!1):(c=l,p=v+s.shift(),U=c+s.shift(),g=p+s.shift(),l=U+s.shift(),x-G==5?(v=g+s.shift(),G++):v=g,E=!0),e.U.P.curveTo(o,c,p,U,g,l,v),G+=4;}else {if("o"==(P+"").charAt(0))throw console.debug("Unknown operation: "+P,r),P;s.push(P);}}}t.x=l,t.y=v,t.nStems=i,t.haveWidth=h,t.width=d,t.open=f;};var t=e,a={Typr:t};return r.Typr=t,r.default=a,Object.defineProperty(r,"__esModule",{value:!0}),r}({}).Typr}

/*!
Custom bundle of woff2otf (https://github.com/arty-name/woff2otf) with fflate
(https://github.com/101arrowz/fflate) for use in Troika text rendering. 
Original licenses apply: 
- fflate: https://github.com/101arrowz/fflate/blob/master/LICENSE (MIT)
- woff2otf.js: https://github.com/arty-name/woff2otf/blob/master/woff2otf.js (Apache2)
*/
function woff2otfFactory(){return function(r){var e=Uint8Array,n=Uint16Array,t=Uint32Array,a=new e([0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0,0,0,0]),i=new e([0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13,0,0]),o=new e([16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15]),f=function(r,e){for(var a=new n(31),i=0;i<31;++i)a[i]=e+=1<<r[i-1];var o=new t(a[30]);for(i=1;i<30;++i)for(var f=a[i];f<a[i+1];++f)o[f]=f-a[i]<<5|i;return [a,o]},u=f(a,2),v=u[0],s=u[1];v[28]=258,s[258]=28;for(var l=f(i,0)[0],c=new n(32768),g=0;g<32768;++g){var h=(43690&g)>>>1|(21845&g)<<1;h=(61680&(h=(52428&h)>>>2|(13107&h)<<2))>>>4|(3855&h)<<4,c[g]=((65280&h)>>>8|(255&h)<<8)>>>1;}var w=function(r,e,t){for(var a=r.length,i=0,o=new n(e);i<a;++i)++o[r[i]-1];var f,u=new n(e);for(i=0;i<e;++i)u[i]=u[i-1]+o[i-1]<<1;if(t){f=new n(1<<e);var v=15-e;for(i=0;i<a;++i)if(r[i])for(var s=i<<4|r[i],l=e-r[i],g=u[r[i]-1]++<<l,h=g|(1<<l)-1;g<=h;++g)f[c[g]>>>v]=s;}else for(f=new n(a),i=0;i<a;++i)r[i]&&(f[i]=c[u[r[i]-1]++]>>>15-r[i]);return f},d=new e(288);for(g=0;g<144;++g)d[g]=8;for(g=144;g<256;++g)d[g]=9;for(g=256;g<280;++g)d[g]=7;for(g=280;g<288;++g)d[g]=8;var m=new e(32);for(g=0;g<32;++g)m[g]=5;var b=w(d,9,1),p=w(m,5,1),y=function(r){for(var e=r[0],n=1;n<r.length;++n)r[n]>e&&(e=r[n]);return e},L=function(r,e,n){var t=e/8|0;return (r[t]|r[t+1]<<8)>>(7&e)&n},U=function(r,e){var n=e/8|0;return (r[n]|r[n+1]<<8|r[n+2]<<16)>>(7&e)},k=["unexpected EOF","invalid block type","invalid length/literal","invalid distance","stream finished","no stream handler",,"no callback","invalid UTF-8 data","extra field too long","date not in range 1980-2099","filename too long","stream finishing","invalid zip data"],T=function(r,e,n){var t=new Error(e||k[r]);if(t.code=r,Error.captureStackTrace&&Error.captureStackTrace(t,T),!n)throw t;return t},O=function(r,f,u){var s=r.length;if(!s||u&&!u.l&&s<5)return f||new e(0);var c=!f||u,g=!u||u.i;u||(u={}),f||(f=new e(3*s));var h,d=function(r){var n=f.length;if(r>n){var t=new e(Math.max(2*n,r));t.set(f),f=t;}},m=u.f||0,k=u.p||0,O=u.b||0,A=u.l,x=u.d,E=u.m,D=u.n,M=8*s;do{if(!A){u.f=m=L(r,k,1);var S=L(r,k+1,3);if(k+=3,!S){var V=r[(I=((h=k)/8|0)+(7&h&&1)+4)-4]|r[I-3]<<8,_=I+V;if(_>s){g&&T(0);break}c&&d(O+V),f.set(r.subarray(I,_),O),u.b=O+=V,u.p=k=8*_;continue}if(1==S)A=b,x=p,E=9,D=5;else if(2==S){var j=L(r,k,31)+257,z=L(r,k+10,15)+4,C=j+L(r,k+5,31)+1;k+=14;for(var F=new e(C),P=new e(19),q=0;q<z;++q)P[o[q]]=L(r,k+3*q,7);k+=3*z;var B=y(P),G=(1<<B)-1,H=w(P,B,1);for(q=0;q<C;){var I,J=H[L(r,k,G)];if(k+=15&J,(I=J>>>4)<16)F[q++]=I;else {var K=0,N=0;for(16==I?(N=3+L(r,k,3),k+=2,K=F[q-1]):17==I?(N=3+L(r,k,7),k+=3):18==I&&(N=11+L(r,k,127),k+=7);N--;)F[q++]=K;}}var Q=F.subarray(0,j),R=F.subarray(j);E=y(Q),D=y(R),A=w(Q,E,1),x=w(R,D,1);}else T(1);if(k>M){g&&T(0);break}}c&&d(O+131072);for(var W=(1<<E)-1,X=(1<<D)-1,Y=k;;Y=k){var Z=(K=A[U(r,k)&W])>>>4;if((k+=15&K)>M){g&&T(0);break}if(K||T(2),Z<256)f[O++]=Z;else {if(256==Z){Y=k,A=null;break}var $=Z-254;if(Z>264){var rr=a[q=Z-257];$=L(r,k,(1<<rr)-1)+v[q],k+=rr;}var er=x[U(r,k)&X],nr=er>>>4;er||T(3),k+=15&er;R=l[nr];if(nr>3){rr=i[nr];R+=U(r,k)&(1<<rr)-1,k+=rr;}if(k>M){g&&T(0);break}c&&d(O+131072);for(var tr=O+$;O<tr;O+=4)f[O]=f[O-R],f[O+1]=f[O+1-R],f[O+2]=f[O+2-R],f[O+3]=f[O+3-R];O=tr;}}u.l=A,u.p=Y,u.b=O,A&&(m=1,u.m=E,u.d=x,u.n=D);}while(!m);return O==f.length?f:function(r,a,i){(null==a||a<0)&&(a=0),(null==i||i>r.length)&&(i=r.length);var o=new(r instanceof n?n:r instanceof t?t:e)(i-a);return o.set(r.subarray(a,i)),o}(f,0,O)},A=new e(0);var x="undefined"!=typeof TextDecoder&&new TextDecoder;try{x.decode(A,{stream:!0}),1;}catch(r){}return r.convert_streams=function(r){var e=new DataView(r),n=0;function t(){var r=e.getUint16(n);return n+=2,r}function a(){var r=e.getUint32(n);return n+=4,r}function i(r){m.setUint16(b,r),b+=2;}function o(r){m.setUint32(b,r),b+=4;}for(var f={signature:a(),flavor:a(),length:a(),numTables:t(),reserved:t(),totalSfntSize:a(),majorVersion:t(),minorVersion:t(),metaOffset:a(),metaLength:a(),metaOrigLength:a(),privOffset:a(),privLength:a()},u=0;Math.pow(2,u)<=f.numTables;)u++;u--;for(var v=16*Math.pow(2,u),s=16*f.numTables-v,l=12,c=[],g=0;g<f.numTables;g++)c.push({tag:a(),offset:a(),compLength:a(),origLength:a(),origChecksum:a()}),l+=16;var h,w=new Uint8Array(12+16*c.length+c.reduce((function(r,e){return r+e.origLength+4}),0)),d=w.buffer,m=new DataView(d),b=0;return o(f.flavor),i(f.numTables),i(v),i(u),i(s),c.forEach((function(r){o(r.tag),o(r.origChecksum),o(l),o(r.origLength),r.outOffset=l,(l+=r.origLength)%4!=0&&(l+=4-l%4);})),c.forEach((function(e){var n,t=r.slice(e.offset,e.offset+e.compLength);if(e.compLength!=e.origLength){var a=new Uint8Array(e.origLength);n=new Uint8Array(t,2),O(n,a);}else a=new Uint8Array(t);w.set(a,e.outOffset);var i=0;(l=e.outOffset+e.origLength)%4!=0&&(i=4-l%4),w.set(new Uint8Array(i).buffer,e.outOffset+e.origLength),h=l+i;})),d.slice(0,h)},Object.defineProperty(r,"__esModule",{value:!0}),r}({}).convert_streams}

/**
 * A factory wrapper parsing a font file using Typr.
 * Also adds support for WOFF files (not WOFF2).
 */

/**
 * @typedef ParsedFont
 * @property {number} ascender
 * @property {number} descender
 * @property {number} xHeight
 * @property {(number) => boolean} supportsCodePoint
 * @property {(text:string, fontSize:number, letterSpacing:number, callback) => number} forEachGlyph
 * @property {number} lineGap
 * @property {number} capHeight
 * @property {number} unitsPerEm
 */

/**
 * @typedef {(buffer: ArrayBuffer) => ParsedFont} FontParser
 */

/**
 * @returns {FontParser}
 */
function parserFactory(Typr, woff2otf) {
  const cmdArgLengths = {
    M: 2,
    L: 2,
    Q: 4,
    C: 6,
    Z: 0
  };

  // {joinType: "skip+step,..."}
  const joiningTypeRawData = {"C":"18g,ca,368,1kz","D":"17k,6,2,2+4,5+c,2+6,2+1,10+1,9+f,j+11,2+1,a,2,2+1,15+2,3,j+2,6+3,2+8,2,2,2+1,w+a,4+e,3+3,2,3+2,3+5,23+w,2f+4,3,2+9,2,b,2+3,3,1k+9,6+1,3+1,2+2,2+d,30g,p+y,1,1+1g,f+x,2,sd2+1d,jf3+4,f+3,2+4,2+2,b+3,42,2,4+2,2+1,2,3,t+1,9f+w,2,el+2,2+g,d+2,2l,2+1,5,3+1,2+1,2,3,6,16wm+1v","R":"17m+3,2,2,6+3,m,15+2,2+2,h+h,13,3+8,2,2,3+1,2,p+1,x,5+4,5,a,2,2,3,u,c+2,g+1,5,2+1,4+1,5j,6+1,2,b,2+2,f,2+1,1s+2,2,3+1,7,1ez0,2,2+1,4+4,b,4,3,b,42,2+2,4,3,2+1,2,o+3,ae,ep,x,2o+2,3+1,3,5+1,6","L":"x9u,jff,a,fd,jv","T":"4t,gj+33,7o+4,1+1,7c+18,2,2+1,2+1,2,21+a,2,1b+k,h,2u+6,3+5,3+1,2+3,y,2,v+q,2k+a,1n+8,a,p+3,2+8,2+2,2+4,18+2,3c+e,2+v,1k,2,5+7,5,4+6,b+1,u,1n,5+3,9,l+1,r,3+1,1m,5+1,5+1,3+2,4,v+1,4,c+1,1m,5+4,2+1,5,l+1,n+5,2,1n,3,2+3,9,8+1,c+1,v,1q,d,1f,4,1m+2,6+2,2+3,8+1,c+1,u,1n,3,7,6+1,l+1,t+1,1m+1,5+3,9,l+1,u,21,8+2,2,2j,3+6,d+7,2r,3+8,c+5,23+1,s,2,2,1k+d,2+4,2+1,6+a,2+z,a,2v+3,2+5,2+1,3+1,q+1,5+2,h+3,e,3+1,7,g,jk+2,qb+2,u+2,u+1,v+1,1t+1,2+6,9,3+a,a,1a+2,3c+1,z,3b+2,5+1,a,7+2,64+1,3,1n,2+6,2,2,3+7,7+9,3,1d+d,1,1+1,1s+3,1d,2+4,2,6,15+8,d+1,x+3,3+1,2+2,1l,2+1,4,2+2,1n+7,3+1,49+2,2+c,2+6,5,7,4+1,5j+1l,2+4,ek,3+1,r+4,1e+4,6+5,2p+c,1+3,1,1+2,1+b,2db+2,3y,2p+v,ff+3,30+1,n9x,1+2,2+9,x+1,29+1,7l,4,5,q+1,6,48+1,r+h,e,13+7,q+a,1b+2,1d,3+3,3+1,14,1w+5,3+1,3+1,d,9,1c,1g,2+2,3+1,6+1,2,17+1,9,6n,3,5,fn5,ki+f,h+f,5s,6y+2,ea,6b,46+4,1af+2,2+1,6+3,15+2,5,4m+1,fy+3,as+1,4a+a,4x,1j+e,1l+2,1e+3,3+1,1y+2,11+4,2+7,1r,d+1,1h+8,b+3,3,2o+2,3,2+1,7,4h,4+7,m+1,1m+1,4,12+6,4+4,5g+7,3+2,2,o,2d+5,2,5+1,2+1,6n+3,7+1,2+1,s+1,2e+7,3,2+1,2z,2,3+5,2,2u+2,3+3,2+4,78+8,2+1,75+1,2,5,41+3,3+1,5,x+9,15+5,3+3,9,a+5,3+2,1b+c,2+1,bb+6,2+5,2,2b+l,3+6,2+1,2+1,3f+5,4,2+1,2+6,2,21+1,4,2,9o+1,470+8,at4+4,1o+6,t5,1s+3,2a,f5l+1,2+3,43o+2,a+7,1+7,3+6,v+3,45+2,1j0+1i,5+1d,9,f,n+4,2+e,11t+6,2+g,3+6,2+1,2+4,7a+6,c6+3,15t+6,32+6,1,gzau,v+2n,3l+6n"};

  const JT_LEFT = 1, //indicates that a character joins with the subsequent character, but does not join with the preceding character.
    JT_RIGHT = 2, //indicates that a character joins with the preceding character, but does not join with the subsequent character.
    JT_DUAL = 4, //indicates that a character joins with the preceding character and joins with the subsequent character.
    JT_TRANSPARENT = 8, //indicates that the character does not join with adjacent characters and that the character must be skipped over when the shaping engine is evaluating the joining positions in a sequence of characters. When a JT_TRANSPARENT character is encountered in a sequence, the JOINING_TYPE of the preceding character passes through. Diacritical marks are frequently assigned this value.
    JT_JOIN_CAUSING = 16, //indicates that the character forces the use of joining forms with the preceding and subsequent characters. Kashidas and the Zero Width Joiner (U+200D) are both JOIN_CAUSING characters.
    JT_NON_JOINING = 32; //indicates that a character does not join with the preceding or with the subsequent character.,

  let joiningTypeMap;
  function getCharJoiningType(ch) {
    if (!joiningTypeMap) {
      const m = {
        R: JT_RIGHT,
        L: JT_LEFT,
        D: JT_DUAL,
        C: JT_JOIN_CAUSING,
        U: JT_NON_JOINING,
        T: JT_TRANSPARENT
      };
      joiningTypeMap = new Map();
      for (let type in joiningTypeRawData) {
        let lastCode = 0;
        joiningTypeRawData[type].split(',').forEach(range => {
          let [skip, step] = range.split('+');
          skip = parseInt(skip,36);
          step = step ? parseInt(step, 36) : 0;
          joiningTypeMap.set(lastCode += skip, m[type]);
          for (let i = step; i--;) {
            joiningTypeMap.set(++lastCode, m[type]);
          }
        });
      }
    }
    return joiningTypeMap.get(ch) || JT_NON_JOINING
  }

  const ISOL = 1, INIT = 2, FINA = 3, MEDI = 4;
  const formsToFeatures = [null, 'isol', 'init', 'fina', 'medi'];

  function detectJoiningForms(str) {
    // This implements the algorithm described here:
    // https://github.com/n8willis/opentype-shaping-documents/blob/master/opentype-shaping-arabic-general.md
    const joiningForms = new Uint8Array(str.length);
    let prevJoiningType = JT_NON_JOINING;
    let prevForm = ISOL;
    let prevIndex = -1;
    for (let i = 0; i < str.length; i++) {
      const code = str.codePointAt(i);
      let joiningType = getCharJoiningType(code) | 0;
      let form = ISOL;
      if (joiningType & JT_TRANSPARENT) {
        continue
      }
      if (prevJoiningType & (JT_LEFT | JT_DUAL | JT_JOIN_CAUSING)) {
        if (joiningType & (JT_RIGHT | JT_DUAL | JT_JOIN_CAUSING)) {
          form = FINA;
          // isol->init, fina->medi
          if (prevForm === ISOL || prevForm === FINA) {
            joiningForms[prevIndex]++;
          }
        }
        else if (joiningType & (JT_LEFT | JT_NON_JOINING)) {
          // medi->fina, init->isol
          if (prevForm === INIT || prevForm === MEDI) {
            joiningForms[prevIndex]--;
          }
        }
      }
      else if (prevJoiningType & (JT_RIGHT | JT_NON_JOINING)) {
        // medi->fina, init->isol
        if (prevForm === INIT || prevForm === MEDI) {
          joiningForms[prevIndex]--;
        }
      }
      prevForm = joiningForms[i] = form;
      prevJoiningType = joiningType;
      prevIndex = i;
      if (code > 0xffff) i++;
    }
    // console.log(str.split('').map(ch => ch.codePointAt(0).toString(16)))
    // console.log(str.split('').map(ch => getCharJoiningType(ch.codePointAt(0))))
    // console.log(Array.from(joiningForms).map(f => formsToFeatures[f] || 'none'))
    return joiningForms
  }

  function stringToGlyphs (font, str) {
    const glyphIds = [];
    for (let i = 0; i < str.length; i++) {
      const cc = str.codePointAt(i);
      if (cc > 0xffff) i++;
      glyphIds.push(Typr.U.codeToGlyph(font, cc));
    }

    const gsub = font['GSUB'];
    if (gsub) {
      const {lookupList, featureList} = gsub;
      let joiningForms;
      const supportedFeatures = /^(rlig|liga|mset|isol|init|fina|medi|half|pres|blws|ccmp)$/;
      const usedLookups = [];
      featureList.forEach(feature => {
        if (supportedFeatures.test(feature.tag)) {
          for (let ti = 0; ti < feature.tab.length; ti++) {
            if (usedLookups[feature.tab[ti]]) continue
            usedLookups[feature.tab[ti]] = true;
            const tab = lookupList[feature.tab[ti]];
            const isJoiningFeature = /^(isol|init|fina|medi)$/.test(feature.tag);
            if (isJoiningFeature && !joiningForms) { //lazy
              joiningForms = detectJoiningForms(str);
            }
            for (let ci = 0; ci < glyphIds.length; ci++) {
              if (!joiningForms || !isJoiningFeature || formsToFeatures[joiningForms[ci]] === feature.tag) {
                Typr.U._applySubs(glyphIds, ci, tab, lookupList);
              }
            }
          }
        }
      });
    }

    return glyphIds
  }

  // Calculate advances and x/y offsets for each glyph, e.g. kerning and mark
  // attachments. This is a more complete version of Typr.U.getPairAdjustment
  // and should become an upstream replacement eventually.
  function calcGlyphPositions(font, glyphIds) {
    const positions = new Int16Array(glyphIds.length * 3); // [offsetX, offsetY, advanceX, ...]
    let glyphIndex = 0;
    for (; glyphIndex < glyphIds.length; glyphIndex++) {
      const glyphId = glyphIds[glyphIndex];
      if (glyphId === -1) continue;

      positions[glyphIndex * 3 + 2] = font.hmtx.aWidth[glyphId]; // populate advanceX in...advance.

      const gpos = font.GPOS;
      if (gpos) {
        const llist = gpos.lookupList;
        for (let i = 0; i < llist.length; i++) {
          const lookup = llist[i];
          for (let j = 0; j < lookup.tabs.length; j++) {
            const tab = lookup.tabs[j];
            // Single char placement
            if (lookup.ltype === 1) {
              const ind = Typr._lctf.coverageIndex(tab.coverage, glyphId);
              if (ind !== -1 && tab.pos) {
                applyValueRecord(tab.pos, glyphIndex);
                break
              }
            }
            // Pairs (kerning)
            else if (lookup.ltype === 2) {
              let adj = null;
              let prevGlyphIndex = getPrevGlyphIndex();
              if (prevGlyphIndex !== -1) {
                const coverageIndex = Typr._lctf.coverageIndex(tab.coverage, glyphIds[prevGlyphIndex]);
                if (coverageIndex !== -1) {
                  if (tab.fmt === 1) {
                    const right = tab.pairsets[coverageIndex];
                    for (let k = 0; k < right.length; k++) {
                      if (right[k].gid2 === glyphId) adj = right[k];
                    }
                  } else if (tab.fmt === 2) {
                    const c1 = Typr.U._getGlyphClass(glyphIds[prevGlyphIndex], tab.classDef1);
                    const c2 = Typr.U._getGlyphClass(glyphId, tab.classDef2);
                    adj = tab.matrix[c1][c2];
                  }
                  if (adj) {
                    if (adj.val1) applyValueRecord(adj.val1, prevGlyphIndex);
                    if (adj.val2) applyValueRecord(adj.val2, glyphIndex);
                    break
                  }
                }
              }
            }
            // Mark to base
            else if (lookup.ltype === 4) {
              const markArrIndex = Typr._lctf.coverageIndex(tab.markCoverage, glyphId);
              if (markArrIndex !== -1) {
                const baseGlyphIndex = getPrevGlyphIndex(isBaseGlyph);
                const baseArrIndex = baseGlyphIndex === -1 ? -1 : Typr._lctf.coverageIndex(tab.baseCoverage, glyphIds[baseGlyphIndex]);
                if (baseArrIndex !== -1) {
                  const markRecord = tab.markArray[markArrIndex];
                  const baseAnchor = tab.baseArray[baseArrIndex][markRecord.markClass];
                  positions[glyphIndex * 3] = baseAnchor.x - markRecord.x + positions[baseGlyphIndex * 3] - positions[baseGlyphIndex * 3 + 2];
                  positions[glyphIndex * 3 + 1] = baseAnchor.y - markRecord.y + positions[baseGlyphIndex * 3 + 1];
                  break;
                }
              }
            }
            // Mark to mark
            else if (lookup.ltype === 6) {
              const mark1ArrIndex = Typr._lctf.coverageIndex(tab.mark1Coverage, glyphId);
              if (mark1ArrIndex !== -1) {
                const prevGlyphIndex = getPrevGlyphIndex();
                if (prevGlyphIndex !== -1) {
                  const prevGlyphId = glyphIds[prevGlyphIndex];
                  if (getGlyphClass(font, prevGlyphId) === 3) { // only check mark glyphs
                    const mark2ArrIndex = Typr._lctf.coverageIndex(tab.mark2Coverage, prevGlyphId);
                    if (mark2ArrIndex !== -1) {
                      const mark1Record = tab.mark1Array[mark1ArrIndex];
                      const mark2Anchor = tab.mark2Array[mark2ArrIndex][mark1Record.markClass];
                      positions[glyphIndex * 3] = mark2Anchor.x - mark1Record.x + positions[prevGlyphIndex * 3] - positions[prevGlyphIndex * 3 + 2];
                      positions[glyphIndex * 3 + 1] = mark2Anchor.y - mark1Record.y + positions[prevGlyphIndex * 3 + 1];
                      break;
                    }
                  }
                }
              }
            }
          }
        }
      }
      // Check kern table if no GPOS
      else if (font.kern && !font.cff) {
        const prevGlyphIndex = getPrevGlyphIndex();
        if (prevGlyphIndex !== -1) {
          const ind1 = font.kern.glyph1.indexOf(glyphIds[prevGlyphIndex]);
          if (ind1 !== -1) {
            const ind2 = font.kern.rval[ind1].glyph2.indexOf(glyphId);
            if (ind2 !== -1) {
              positions[prevGlyphIndex * 3 + 2] += font.kern.rval[ind1].vals[ind2];
            }
          }
        }
      }
    }

    return positions;

    function getPrevGlyphIndex(filter) {
      for (let i = glyphIndex - 1; i >=0; i--) {
        if (glyphIds[i] !== -1 && (!filter || filter(glyphIds[i]))) {
          return i
        }
      }
      return -1;
    }

    function isBaseGlyph(glyphId) {
      return getGlyphClass(font, glyphId) === 1;
    }

    function applyValueRecord(source, gi) {
      for (let i = 0; i < 3; i++) {
        positions[gi * 3 + i] += source[i] || 0;
      }
    }
  }

  function getGlyphClass(font, glyphId) {
    const classDef = font.GDEF && font.GDEF.glyphClassDef;
    return classDef ? Typr.U._getGlyphClass(glyphId, classDef) : 0;
  }

  function firstNum(...args) {
    for (let i = 0; i < args.length; i++) {
      if (typeof args[i] === 'number') {
        return args[i]
      }
    }
  }

  /**
   * @returns ParsedFont
   */
  function wrapFontObj(typrFont) {
    const glyphMap = Object.create(null);

    const os2 = typrFont['OS/2'];
    const hhea = typrFont.hhea;
    const unitsPerEm = typrFont.head.unitsPerEm;
    const ascender = firstNum(os2 && os2.sTypoAscender, hhea && hhea.ascender, unitsPerEm);

    /** @type ParsedFont */
    const fontObj = {
      unitsPerEm,
      ascender,
      descender: firstNum(os2 && os2.sTypoDescender, hhea && hhea.descender, 0),
      capHeight: firstNum(os2 && os2.sCapHeight, ascender),
      xHeight: firstNum(os2 && os2.sxHeight, ascender),
      lineGap: firstNum(os2 && os2.sTypoLineGap, hhea && hhea.lineGap),
      supportsCodePoint(code) {
        return Typr.U.codeToGlyph(typrFont, code) > 0
      },
      forEachGlyph(text, fontSize, letterSpacing, callback) {
        let penX = 0;
        const fontScale = 1 / fontObj.unitsPerEm * fontSize;

        const glyphIds = stringToGlyphs(typrFont, text);
        let charIndex = 0;
        const positions = calcGlyphPositions(typrFont, glyphIds);

        glyphIds.forEach((glyphId, i) => {
          // Typr returns a glyph index per string codepoint, with -1s in place of those that
          // were omitted due to ligature substitution. So we can track original index in the
          // string via simple increment, and skip everything else when seeing a -1.
          if (glyphId !== -1) {
            let glyphObj = glyphMap[glyphId];
            if (!glyphObj) {
              const {cmds, crds} = Typr.U.glyphToPath(typrFont, glyphId);

              // Build path string
              let path = '';
              let crdsIdx = 0;
              for (let i = 0, len = cmds.length; i < len; i++) {
                const numArgs = cmdArgLengths[cmds[i]];
                path += cmds[i];
                for (let j = 1; j <= numArgs; j++) {
                  path += (j > 1 ? ',' : '') + crds[crdsIdx++];
                }
              }

              // Find extents - Glyf gives this in metadata but not CFF, and Typr doesn't
              // normalize the two, so it's simplest just to iterate ourselves.
              let xMin, yMin, xMax, yMax;
              if (crds.length) {
                xMin = yMin = Infinity;
                xMax = yMax = -Infinity;
                for (let i = 0, len = crds.length; i < len; i += 2) {
                  let x = crds[i];
                  let y = crds[i + 1];
                  if (x < xMin) xMin = x;
                  if (y < yMin) yMin = y;
                  if (x > xMax) xMax = x;
                  if (y > yMax) yMax = y;
                }
              } else {
                xMin = xMax = yMin = yMax = 0;
              }

              glyphObj = glyphMap[glyphId] = {
                index: glyphId,
                advanceWidth: typrFont.hmtx.aWidth[glyphId],
                xMin,
                yMin,
                xMax,
                yMax,
                path,
              };
            }

            callback.call(
              null,
              glyphObj,
              penX + positions[i * 3] * fontScale,
              positions[i * 3 + 1] * fontScale,
              charIndex
            );

            penX += positions[i * 3 + 2] * fontScale;
            if (letterSpacing) {
              penX += letterSpacing * fontSize;
            }
          }
          charIndex += (text.codePointAt(charIndex) > 0xffff ? 2 : 1);
        });

        return penX
      }
    };

    return fontObj
  }

  /**
   * @type FontParser
   */
  return function parse(buffer) {
    // Look to see if we have a WOFF file and convert it if so:
    const peek = new Uint8Array(buffer, 0, 4);
    const tag = Typr._bin.readASCII(peek, 0, 4);
    if (tag === 'wOFF') {
      buffer = woff2otf(buffer);
    } else if (tag === 'wOF2') {
      throw new Error('woff2 fonts not supported')
    }
    return wrapFontObj(Typr.parse(buffer)[0])
  }
}


const workerModule = /*#__PURE__*/defineWorkerModule({
  name: 'Typr Font Parser',
  dependencies: [typrFactory, woff2otfFactory, parserFactory],
  init(typrFactory, woff2otfFactory, parserFactory) {
    const Typr = typrFactory();
    const woff2otf = woff2otfFactory();
    return parserFactory(Typr, woff2otf)
  }
});

/*!
Custom bundle of @unicode-font-resolver/client v1.0.2 (https://github.com/lojjic/unicode-font-resolver)
for use in Troika text rendering. 
Original MIT license applies
*/
function unicodeFontResolverClientFactory(){return function(t){var n=function(){this.buckets=new Map;};n.prototype.add=function(t){var n=t>>5;this.buckets.set(n,(this.buckets.get(n)||0)|1<<(31&t));},n.prototype.has=function(t){var n=this.buckets.get(t>>5);return void 0!==n&&0!=(n&1<<(31&t))},n.prototype.serialize=function(){var t=[];return this.buckets.forEach((function(n,r){t.push((+r).toString(36)+":"+n.toString(36));})),t.join(",")},n.prototype.deserialize=function(t){var n=this;this.buckets.clear(),t.split(",").forEach((function(t){var r=t.split(":");n.buckets.set(parseInt(r[0],36),parseInt(r[1],36));}));};var r=Math.pow(2,8),e=r-1,o=~e;function a(t){var n=function(t){return t&o}(t).toString(16),e=function(t){return (t&o)+r-1}(t).toString(16);return "codepoint-index/plane"+(t>>16)+"/"+n+"-"+e+".json"}function i(t,n){var r=t&e,o=n.codePointAt(r/6|0);return 0!=((o=(o||48)-48)&1<<r%6)}function u(t,n){var r;(r=t,r.replace(/U\+/gi,"").replace(/^,+|,+$/g,"").split(/,+/).map((function(t){return t.split("-").map((function(t){return parseInt(t.trim(),16)}))}))).forEach((function(t){var r=t[0],e=t[1];void 0===e&&(e=r),n(r,e);}));}function c(t,n){u(t,(function(t,r){for(var e=t;e<=r;e++)n(e);}));}var s={},f={},l=new WeakMap,v="https://cdn.jsdelivr.net/gh/lojjic/unicode-font-resolver@v1.0.1/packages/data";function d(t){var r=l.get(t);return r||(r=new n,c(t.ranges,(function(t){return r.add(t)})),l.set(t,r)),r}var h,p=new Map;function g(t,n,r){return t[n]?n:t[r]?r:function(t){for(var n in t)return n}(t)}function w(t,n){var r=n;if(!t.includes(r)){r=1/0;for(var e=0;e<t.length;e++)Math.abs(t[e]-n)<Math.abs(r-n)&&(r=t[e]);}return r}function k(t){return h||(h=new Set,c("9-D,20,85,A0,1680,2000-200A,2028-202F,205F,3000",(function(t){h.add(t);}))),h.has(t)}return t.CodePointSet=n,t.clearCache=function(){s={},f={};},t.getFontsForString=function(t,n){void 0===n&&(n={});var r,e=n.lang;void 0===e&&(e=/\p{Script=Hangul}/u.test(r=t)?"ko":/\p{Script=Hiragana}|\p{Script=Katakana}/u.test(r)?"ja":"en");var o=n.category;void 0===o&&(o="sans-serif");var u=n.style;void 0===u&&(u="normal");var c=n.weight;void 0===c&&(c=400);var l=(n.dataUrl||v).replace(/\/$/g,""),h=new Map,y=new Uint8Array(t.length),b={},m={},A=new Array(t.length),S=new Map,j=!1;function M(t){var n=p.get(t);return n||(n=fetch(l+"/"+t).then((function(t){if(!t.ok)throw new Error(t.statusText);return t.json().then((function(t){if(!Array.isArray(t)||1!==t[0])throw new Error("Incorrect schema version; need 1, got "+t[0]);return t[1]}))})).catch((function(n){if(l!==v)return j||(console.error('unicode-font-resolver: Failed loading from dataUrl "'+l+'", trying default CDN. '+n.message),j=!0),l=v,p.delete(t),M(t);throw n})),p.set(t,n)),n}for(var P=function(n){var r=t.codePointAt(n),e=a(r);A[n]=e,s[e]||S.has(e)||S.set(e,M(e).then((function(t){s[e]=t;}))),r>65535&&(n++,E=n);},E=0;E<t.length;E++)P(E);return Promise.all(S.values()).then((function(){S.clear();for(var n=function(n){var o=t.codePointAt(n),a=null,u=s[A[n]],c=void 0;for(var l in u){var v=m[l];if(void 0===v&&(v=m[l]=new RegExp(l).test(e||"en")),v){for(var d in c=l,u[l])if(i(o,u[l][d])){a=d;break}break}}if(!a)t:for(var h in u)if(h!==c)for(var p in u[h])if(i(o,u[h][p])){a=p;break t}a||(console.debug("No font coverage for U+"+o.toString(16)),a="latin"),A[n]=a,f[a]||S.has(a)||S.set(a,M("font-meta/"+a+".json").then((function(t){f[a]=t;}))),o>65535&&(n++,r=n);},r=0;r<t.length;r++)n(r);return Promise.all(S.values())})).then((function(){for(var n,r=null,e=0;e<t.length;e++){var a=t.codePointAt(e);if(r&&(k(a)||d(r).has(a)))y[e]=y[e-1];else {r=f[A[e]];var i=b[r.id];if(!i){var s=r.typeforms,v=g(s,o,"sans-serif"),p=g(s[v],u,"normal"),m=w(null===(n=s[v])||void 0===n?void 0:n[p],c);i=b[r.id]=l+"/font-files/"+r.id+"/"+v+"."+p+"."+m+".woff";}var S=h.get(i);null==S&&(S=h.size,h.set(i,S)),y[e]=S;}a>65535&&(e++,y[e]=y[e-1]);}return {fontUrls:Array.from(h.keys()),chars:y}}))},Object.defineProperty(t,"__esModule",{value:!0}),t}({})}

/**
 * @typedef {string | {src:string, label?:string, unicodeRange?:string, lang?:string}} UserFont
 */

/**
 * @typedef {ClientOptions} FontResolverOptions
 * @property {Array<UserFont>|UserFont} [fonts]
 * @property {'normal'|'italic'} [style]
 * @property {'normal'|'bold'|number} [style]
 * @property {string} [unicodeFontsURL]
 */

/**
 * @typedef {Object} FontResolverResult
 * @property {Uint8Array} chars
 * @property {Array<ParsedFont & {src:string}>} fonts
 */

/**
 * @typedef {function} FontResolver
 * @param {string} text
 * @param {(FontResolverResult) => void} callback
 * @param {FontResolverOptions} [options]
 */

/**
 * Factory for the FontResolver function.
 * @param {FontParser} fontParser
 * @param {{getFontsForString: function, CodePointSet: function}} unicodeFontResolverClient
 * @return {FontResolver}
 */
function createFontResolver(fontParser, unicodeFontResolverClient) {
  /**
   * @type {Record<string, ParsedFont>}
   */
  const parsedFonts = Object.create(null);

  /**
   * @type {Record<string, Array<(ParsedFont) => void>>}
   */
  const loadingFonts = Object.create(null);

  /**
   * Load a given font url
   */
  function doLoadFont(url, callback) {
    const onError = err => {
      console.error(`Failure loading font ${url}`, err);
    };
    try {
      const request = new XMLHttpRequest();
      request.open('get', url, true);
      request.responseType = 'arraybuffer';
      request.onload = function () {
        if (request.status >= 400) {
          onError(new Error(request.statusText));
        }
        else if (request.status > 0) {
          try {
            const fontObj = fontParser(request.response);
            fontObj.src = url;
            callback(fontObj);
          } catch (e) {
            onError(e);
          }
        }
      };
      request.onerror = onError;
      request.send();
    } catch(err) {
      onError(err);
    }
  }


  /**
   * Load a given font url if needed, invoking a callback when it's loaded. If already
   * loaded, the callback will be called synchronously.
   * @param {string} fontUrl
   * @param {(font: ParsedFont) => void} callback
   */
  function loadFont(fontUrl, callback) {
    let font = parsedFonts[fontUrl];
    if (font) {
      callback(font);
    } else if (loadingFonts[fontUrl]) {
      loadingFonts[fontUrl].push(callback);
    } else {
      loadingFonts[fontUrl] = [callback];
      doLoadFont(fontUrl, fontObj => {
        fontObj.src = fontUrl;
        parsedFonts[fontUrl] = fontObj;
        loadingFonts[fontUrl].forEach(cb => cb(fontObj));
        delete loadingFonts[fontUrl];
      });
    }
  }

  /**
   * For a given string of text, determine which fonts are required to fully render it and
   * ensure those fonts are loaded.
   */
  return function (text, callback, {
    lang,
    fonts: userFonts = [],
    style = 'normal',
    weight = 'normal',
    unicodeFontsURL
  } = {}) {
    const charResolutions = new Uint8Array(text.length);
    const fontResolutions = [];
    if (!text.length) {
      allDone();
    }

    const fontIndices = new Map();
    const fallbackRanges = []; // [[start, end], ...]

    if (style !== 'italic') style = 'normal';
    if (typeof weight !== 'number') {
      weight = weight === 'bold' ? 700 : 400;
    }

    if (userFonts && !Array.isArray(userFonts)) {
      userFonts = [userFonts];
    }
    userFonts = userFonts.slice()
      // filter by language
      .filter(def => !def.lang || def.lang.test(lang))
      // switch order for easier iteration
      .reverse();
    if (userFonts.length) {
      const UNKNOWN = 0;
      const RESOLVED = 1;
      const NEEDS_FALLBACK = 2;
      let prevCharResult = UNKNOWN

      ;(function resolveUserFonts (startIndex = 0) {
        for (let i = startIndex, iLen = text.length; i < iLen; i++) {
          const codePoint = text.codePointAt(i);
          // Carry previous character's result forward if:
          // - it resolved to a font that also covers this character
          // - this character is whitespace
          if (
            (prevCharResult === RESOLVED && fontResolutions[charResolutions[i - 1]].supportsCodePoint(codePoint)) ||
            /\s/.test(text[i])
          ) {
            charResolutions[i] = charResolutions[i - 1];
            if (prevCharResult === NEEDS_FALLBACK) {
              fallbackRanges[fallbackRanges.length - 1][1] = i;
            }
          }  else {
            for (let j = charResolutions[i], jLen = userFonts.length; j <= jLen; j++) {
              if (j === jLen) {
                // none of the user fonts matched; needs fallback
                const range = prevCharResult === NEEDS_FALLBACK ?
                  fallbackRanges[fallbackRanges.length - 1] :
                  (fallbackRanges[fallbackRanges.length] = [i, i]);
                range[1] = i;
                prevCharResult = NEEDS_FALLBACK;
              } else {
                charResolutions[i] = j;
                const { src, unicodeRange } = userFonts[j];
                // filter by optional explicit unicode ranges
                if (!unicodeRange || isCodeInRanges(codePoint, unicodeRange)) {
                  const fontObj = parsedFonts[src];
                  // font not yet loaded, load it and resume
                  if (!fontObj) {
                    loadFont(src, () => {
                      resolveUserFonts(i);
                    });
                    return;
                  }
                  // if the font actually contains a glyph for this char, lock it in
                  if (fontObj.supportsCodePoint(codePoint)) {
                    let fontIndex = fontIndices.get(fontObj);
                    if (typeof fontIndex !== 'number') {
                      fontIndex = fontResolutions.length;
                      fontResolutions.push(fontObj);
                      fontIndices.set(fontObj, fontIndex);
                    }
                    charResolutions[i] = fontIndex;
                    prevCharResult = RESOLVED;
                    break;
                  }
                }
              }
            }
          }

          if (codePoint > 0xffff && i + 1 < iLen) {
            charResolutions[i + 1] = charResolutions[i];
            i++;
            if (prevCharResult === NEEDS_FALLBACK) {
              fallbackRanges[fallbackRanges.length - 1][1] = i;
            }
          }
        }
        resolveFallbacks();
      })();
    } else {
      fallbackRanges.push([0, text.length - 1]);
      resolveFallbacks();
    }

    function resolveFallbacks() {
      if (fallbackRanges.length) {
        // Combine all fallback substrings into a single string for querying
        const fallbackString = fallbackRanges.map(range => text.substring(range[0], range[1] + 1)).join('\n');
        unicodeFontResolverClient.getFontsForString(fallbackString, {
          lang: lang || undefined,
          style,
          weight,
          dataUrl: unicodeFontsURL
        }).then(({fontUrls, chars}) => {
          // Extract results and put them back in the main array
          const fontIndexOffset = fontResolutions.length;
          let charIdx = 0;
          fallbackRanges.forEach(range => {
            for (let i = 0, endIdx = range[1] - range[0]; i <= endIdx; i++) {
              charResolutions[range[0] + i] = chars[charIdx++] + fontIndexOffset;
            }
            charIdx++; //skip segment separator
          });

          // Load and parse the fallback fonts - avoiding Promise here to prevent polyfills in the worker
          let loadedCount = 0;
          fontUrls.forEach((url, i) => {
            loadFont(url, fontObj => {
              fontResolutions[i + fontIndexOffset] = fontObj;
              if (++loadedCount === fontUrls.length) {
                allDone();
              }
            });
          });
        });
      } else {
        allDone();
      }
    }

    function allDone() {
      callback({
        chars: charResolutions,
        fonts: fontResolutions
      });
    }

    function isCodeInRanges(code, ranges) {
      // todo optimize search - CodePointSet from unicode-font-resolver?
      for (let k = 0; k < ranges.length; k++) {
        const [start, end = start] = ranges[k];
        if (start <= code && code <= end) {
          return true
        }
      }
      return false
    }
  }
}

const fontResolverWorkerModule = /*#__PURE__*/defineWorkerModule({
  name: 'FontResolver',
  dependencies: [
    createFontResolver,
    workerModule,
    unicodeFontResolverClientFactory,
  ],
  init(createFontResolver, fontParser, unicodeFontResolverClientFactory) {
    return createFontResolver(fontParser, unicodeFontResolverClientFactory());
  }
});

/**
 * @typedef {number|'left'|'center'|'right'} AnchorXValue
 */
/**
 * @typedef {number|'top'|'top-baseline'|'top-cap'|'top-ex'|'middle'|'bottom-baseline'|'bottom'} AnchorYValue
 */

/**
 * @typedef {object} TypesetParams
 * @property {string} text
 * @property {UserFont|UserFont[]} [font]
 * @property {string} [lang]
 * @property {number} [sdfGlyphSize=64]
 * @property {number} [fontSize=1]
 * @property {number|'normal'|'bold'} [fontWeight='normal']
 * @property {'normal'|'italic'} [fontStyle='normal']
 * @property {number} [letterSpacing=0]
 * @property {'normal'|number} [lineHeight='normal']
 * @property {number} [maxWidth]
 * @property {'ltr'|'rtl'} [direction='ltr']
 * @property {string} [textAlign='left']
 * @property {number} [textIndent=0]
 * @property {'normal'|'nowrap'} [whiteSpace='normal']
 * @property {'normal'|'break-word'} [overflowWrap='normal']
 * @property {AnchorXValue} [anchorX=0]
 * @property {AnchorYValue} [anchorY=0]
 * @property {boolean} [metricsOnly=false]
 * @property {string} [unicodeFontsURL]
 * @property {FontResolverResult} [preResolvedFonts]
 * @property {boolean} [includeCaretPositions=false]
 * @property {number} [chunkedBoundsSize=8192]
 * @property {{[rangeStartIndex]: number}} [colorRanges]
 */

/**
 * @typedef {object} TypesetResult
 * @property {Uint16Array} glyphIds id for each glyph, specific to that glyph's font
 * @property {Uint8Array} glyphFontIndices index into fontData for each glyph
 * @property {Float32Array} glyphPositions x,y of each glyph's origin in layout
 * @property {{[font]: {[glyphId]: {path: string, pathBounds: number[]}}}} glyphData data about each glyph appearing in the text
 * @property {TypesetFontData[]} fontData data about each font used in the text
 * @property {Float32Array} [caretPositions] startX,endX,bottomY caret positions for each char
 * @property {Uint8Array} [glyphColors] color for each glyph, if color ranges supplied
 *         chunkedBounds, //total rects per (n=chunkedBoundsSize) consecutive glyphs
 *         fontSize, //calculated em height
 *         topBaseline: anchorYOffset + lines[0].baseline, //y coordinate of the top line's baseline
 *         blockBounds: [ //bounds for the whole block of text, including vertical padding for lineHeight
 *           anchorXOffset,
 *           anchorYOffset - totalHeight,
 *           anchorXOffset + maxLineWidth,
 *           anchorYOffset
 *         ],
 *         visibleBounds, //total bounds of visible text paths, may be larger or smaller than blockBounds
 *         timings
 */

/**
 * @typedef {object} TypesetFontData
 * @property src
 * @property unitsPerEm
 * @property ascender
 * @property descender
 * @property lineHeight
 * @property capHeight
 * @property xHeight
 */

/**
 * @typedef {function} TypesetterTypesetFunction - compute fonts and layout for some text.
 * @param {TypesetParams} params
 * @param {(TypesetResult) => void} callback - function called when typesetting is complete.
 *    If the params included `preResolvedFonts`, this will be called synchronously.
 */

/**
 * @typedef {function} TypesetterMeasureFunction - compute width/height for some text.
 * @param {TypesetParams} params
 * @param {(width:number, height:number) => void} callback - function called when measurement is complete.
 *    If the params included `preResolvedFonts`, this will be called synchronously.
 */


/**
 * Factory function that creates a self-contained environment for processing text typesetting requests.
 *
 * It is important that this function has no closure dependencies, so that it can be easily injected
 * into the source for a Worker without requiring a build step or complex dependency loading. All its
 * dependencies must be passed in at initialization.
 *
 * @param {FontResolver} resolveFonts - function to resolve a string to parsed fonts
 * @param {object} bidi - the bidi.js implementation object
 * @return {{typeset: TypesetterTypesetFunction, measure: TypesetterMeasureFunction}}
 */
function createTypesetter(resolveFonts, bidi) {
  const INF = Infinity;

  // Set of Unicode Default_Ignorable_Code_Point characters, these will not produce visible glyphs
  // eslint-disable-next-line no-misleading-character-class
  const DEFAULT_IGNORABLE_CHARS = /[\u00AD\u034F\u061C\u115F-\u1160\u17B4-\u17B5\u180B-\u180E\u200B-\u200F\u202A-\u202E\u2060-\u206F\u3164\uFE00-\uFE0F\uFEFF\uFFA0\uFFF0-\uFFF8]/;

  // This regex (instead of /\s/) allows us to select all whitespace EXCEPT for non-breaking white spaces
  const lineBreakingWhiteSpace = `[^\\S\\u00A0]`;

  // Incomplete set of characters that allow line breaking after them
  // In the future we may consider a full Unicode line breaking algorithm impl: https://www.unicode.org/reports/tr14
  const BREAK_AFTER_CHARS = new RegExp(`${lineBreakingWhiteSpace}|[\\-\\u007C\\u00AD\\u2010\\u2012-\\u2014\\u2027\\u2056\\u2E17\\u2E40]`);

  /**
   * Load and parse all the necessary fonts to render a given string of text, then group
   * them into consecutive runs of characters sharing a font.
   */
  function calculateFontRuns({text, lang, fonts, style, weight, preResolvedFonts, unicodeFontsURL}, onDone) {
    const onResolved = ({chars, fonts: parsedFonts}) => {
      let curRun, prevVal;
      const runs = [];
      for (let i = 0; i < chars.length; i++) {
        if (chars[i] !== prevVal) {
          prevVal = chars[i];
          runs.push(curRun = { start: i, end: i, fontObj: parsedFonts[chars[i]]});
        } else {
          curRun.end = i;
        }
      }
      onDone(runs);
    };
    if (preResolvedFonts) {
      onResolved(preResolvedFonts);
    } else {
      resolveFonts(
        text,
        onResolved,
        { lang, fonts, style, weight, unicodeFontsURL }
      );
    }
  }

  /**
   * Main entry point.
   * Process a text string with given font and formatting parameters, and return all info
   * necessary to render all its glyphs.
   * @type TypesetterTypesetFunction
   */
  function typeset(
    {
      text='',
      font,
      lang,
      sdfGlyphSize=64,
      fontSize=400,
      fontWeight=1,
      fontStyle='normal',
      letterSpacing=0,
      lineHeight='normal',
      maxWidth=INF,
      direction,
      textAlign='left',
      textIndent=0,
      whiteSpace='normal',
      overflowWrap='normal',
      anchorX = 0,
      anchorY = 0,
      metricsOnly=false,
      unicodeFontsURL,
      preResolvedFonts=null,
      includeCaretPositions=false,
      chunkedBoundsSize=8192,
      colorRanges=null
    },
    callback
  ) {
    const mainStart = now();
    const timings = {fontLoad: 0, typesetting: 0};

    // Ensure newlines are normalized
    if (text.indexOf('\r') > -1) {
      console.info('Typesetter: got text with \\r chars; normalizing to \\n');
      text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    }

    // Ensure we've got numbers not strings
    fontSize = +fontSize;
    letterSpacing = +letterSpacing;
    maxWidth = +maxWidth;
    lineHeight = lineHeight || 'normal';
    textIndent = +textIndent;

    calculateFontRuns({
      text,
      lang,
      style: fontStyle,
      weight: fontWeight,
      fonts: typeof font === 'string' ? [{src: font}] : font,
      unicodeFontsURL,
      preResolvedFonts
    }, runs => {
      timings.fontLoad = now() - mainStart;
      const hasMaxWidth = isFinite(maxWidth);
      let glyphIds = null;
      let glyphFontIndices = null;
      let glyphPositions = null;
      let glyphData = null;
      let glyphColors = null;
      let caretPositions = null;
      let visibleBounds = null;
      let chunkedBounds = null;
      let maxLineWidth = 0;
      let renderableGlyphCount = 0;
      let canWrap = whiteSpace !== 'nowrap';
      const metricsByFont = new Map(); // fontObj -> metrics
      const typesetStart = now();

      // Distribute glyphs into lines based on wrapping
      let lineXOffset = textIndent;
      let prevRunEndX = 0;
      let currentLine = new TextLine();
      const lines = [currentLine];
      runs.forEach(run => {
        const { fontObj } = run;
        const { ascender, descender, unitsPerEm, lineGap, capHeight, xHeight } = fontObj;

        // Calculate metrics for each font used
        let fontData = metricsByFont.get(fontObj);
        if (!fontData) {
          // Find conversion between native font units and fontSize units
          const fontSizeMult = fontSize / unitsPerEm;

          // Determine appropriate value for 'normal' line height based on the font's actual metrics
          // This does not guarantee individual glyphs won't exceed the line height, e.g. Roboto; should we use yMin/Max instead?
          const calcLineHeight = lineHeight === 'normal' ?
            (ascender - descender + lineGap) * fontSizeMult : lineHeight * fontSize;

          // Determine line height and leading adjustments
          const halfLeading = (calcLineHeight - (ascender - descender) * fontSizeMult) / 2;
          const caretHeight = Math.min(calcLineHeight, (ascender - descender) * fontSizeMult);
          const caretTop = (ascender + descender) / 2 * fontSizeMult + caretHeight / 2;
          fontData = {
            index: metricsByFont.size,
            src: fontObj.src,
            fontObj,
            fontSizeMult,
            unitsPerEm,
            ascender: ascender * fontSizeMult,
            descender: descender * fontSizeMult,
            capHeight: capHeight * fontSizeMult,
            xHeight: xHeight * fontSizeMult,
            lineHeight: calcLineHeight,
            baseline: -halfLeading - ascender * fontSizeMult, // baseline offset from top of line height
            // cap: -halfLeading - capHeight * fontSizeMult, // cap from top of line height
            // ex: -halfLeading - xHeight * fontSizeMult, // ex from top of line height
            caretTop: (ascender + descender) / 2 * fontSizeMult + caretHeight / 2,
            caretBottom: caretTop - caretHeight
          };
          metricsByFont.set(fontObj, fontData);
        }
        const { fontSizeMult } = fontData;

        const runText = text.slice(run.start, run.end + 1);
        let prevGlyphX, prevGlyphObj;
        fontObj.forEachGlyph(runText, fontSize, letterSpacing, (glyphObj, glyphX, glyphY, charIndex) => {
          glyphX += prevRunEndX;
          charIndex += run.start;
          prevGlyphX = glyphX;
          prevGlyphObj = glyphObj;
          const char = text.charAt(charIndex);
          const glyphWidth = glyphObj.advanceWidth * fontSizeMult;
          const curLineCount = currentLine.count;
          let nextLine;

          // Calc isWhitespace and isEmpty once per glyphObj
          if (!('isEmpty' in glyphObj)) {
            glyphObj.isWhitespace = !!char && new RegExp(lineBreakingWhiteSpace).test(char);
            glyphObj.canBreakAfter = !!char && BREAK_AFTER_CHARS.test(char);
            glyphObj.isEmpty = glyphObj.xMin === glyphObj.xMax || glyphObj.yMin === glyphObj.yMax || DEFAULT_IGNORABLE_CHARS.test(char);
          }
          if (!glyphObj.isWhitespace && !glyphObj.isEmpty) {
            renderableGlyphCount++;
          }

          // If a non-whitespace character overflows the max width, we need to soft-wrap
          if (canWrap && hasMaxWidth && !glyphObj.isWhitespace && glyphX + glyphWidth + lineXOffset > maxWidth && curLineCount) {
            // If it's the first char after a whitespace, start a new line
            if (currentLine.glyphAt(curLineCount - 1).glyphObj.canBreakAfter) {
              nextLine = new TextLine();
              lineXOffset = -glyphX;
            } else {
              // Back up looking for a whitespace character to wrap at
              for (let i = curLineCount; i--;) {
                // If we got the start of the line there's no soft break point; make hard break if overflowWrap='break-word'
                if (i === 0 && overflowWrap === 'break-word') {
                  nextLine = new TextLine();
                  lineXOffset = -glyphX;
                  break
                }
                // Found a soft break point; move all chars since it to a new line
                else if (currentLine.glyphAt(i).glyphObj.canBreakAfter) {
                  nextLine = currentLine.splitAt(i + 1);
                  const adjustX = nextLine.glyphAt(0).x;
                  lineXOffset -= adjustX;
                  for (let j = nextLine.count; j--;) {
                    nextLine.glyphAt(j).x -= adjustX;
                  }
                  break
                }
              }
            }
            if (nextLine) {
              currentLine.isSoftWrapped = true;
              currentLine = nextLine;
              lines.push(currentLine);
              maxLineWidth = maxWidth; //after soft wrapping use maxWidth as calculated width
            }
          }

          let fly = currentLine.glyphAt(currentLine.count);
          fly.glyphObj = glyphObj;
          fly.x = glyphX + lineXOffset;
          fly.y = glyphY;
          fly.width = glyphWidth;
          fly.charIndex = charIndex;
          fly.fontData = fontData;

          // Handle hard line breaks
          if (char === '\n') {
            currentLine = new TextLine();
            lines.push(currentLine);
            lineXOffset = -(glyphX + glyphWidth + (letterSpacing * fontSize)) + textIndent;
          }
        });
        // At the end of a run we must capture the x position as the starting point for the next run
        prevRunEndX = prevGlyphX + prevGlyphObj.advanceWidth * fontSizeMult + letterSpacing * fontSize;
      });

      // Calculate width/height/baseline of each line (excluding trailing whitespace) and maximum block width
      let totalHeight = 0;
      lines.forEach(line => {
        let isTrailingWhitespace = true;
        for (let i = line.count; i--;) {
          const glyphInfo = line.glyphAt(i);
          // omit trailing whitespace from width calculation
          if (isTrailingWhitespace && !glyphInfo.glyphObj.isWhitespace) {
            line.width = glyphInfo.x + glyphInfo.width;
            if (line.width > maxLineWidth) {
              maxLineWidth = line.width;
            }
            isTrailingWhitespace = false;
          }
          // use the tallest line height, lowest baseline, and highest cap/ex
          let {lineHeight, capHeight, xHeight, baseline} = glyphInfo.fontData;
          if (lineHeight > line.lineHeight) line.lineHeight = lineHeight;
          const baselineDiff = baseline - line.baseline;
          if (baselineDiff < 0) { //shift all metrics down
            line.baseline += baselineDiff;
            line.cap += baselineDiff;
            line.ex += baselineDiff;
          }
          // compare cap/ex based on new lowest baseline
          line.cap = Math.max(line.cap, line.baseline + capHeight);
          line.ex = Math.max(line.ex, line.baseline + xHeight);
        }
        line.baseline -= totalHeight;
        line.cap -= totalHeight;
        line.ex -= totalHeight;
        totalHeight += line.lineHeight;
      });

      // Find overall position adjustments for anchoring
      let anchorXOffset = 0;
      let anchorYOffset = 0;
      if (anchorX) {
        if (typeof anchorX === 'number') {
          anchorXOffset = -anchorX;
        }
        else if (typeof anchorX === 'string') {
          anchorXOffset = -maxLineWidth * (
            anchorX === 'left' ? 0 :
            anchorX === 'center' ? 0.5 :
            anchorX === 'right' ? 1 :
            parsePercent(anchorX)
          );
        }
      }
      if (anchorY) {
        if (typeof anchorY === 'number') {
          anchorYOffset = -anchorY;
        }
        else if (typeof anchorY === 'string') {
          anchorYOffset = anchorY === 'top' ? 0 :
            anchorY === 'top-baseline' ? -lines[0].baseline :
            anchorY === 'top-cap' ? -lines[0].cap :
            anchorY === 'top-ex' ? -lines[0].ex :
            anchorY === 'middle' ? totalHeight / 2 :
            anchorY === 'bottom' ? totalHeight :
            anchorY === 'bottom-baseline' ? lines[lines.length - 1].baseline :
            parsePercent(anchorY) * totalHeight;
        }
      }

      if (!metricsOnly) {
        // Resolve bidi levels
        const bidiLevelsResult = bidi.getEmbeddingLevels(text, direction);

        // Process each line, applying alignment offsets, adding each glyph to the atlas, and
        // collecting all renderable glyphs into a single collection.
        glyphIds = new Uint16Array(renderableGlyphCount);
        glyphFontIndices = new Uint8Array(renderableGlyphCount);
        glyphPositions = new Float32Array(renderableGlyphCount * 2);
        glyphData = {};
        visibleBounds = [INF, INF, -INF, -INF];
        chunkedBounds = [];
        if (includeCaretPositions) {
          caretPositions = new Float32Array(text.length * 4);
        }
        if (colorRanges) {
          glyphColors = new Uint8Array(renderableGlyphCount * 3);
        }
        let renderableGlyphIndex = 0;
        let prevCharIndex = -1;
        let colorCharIndex = -1;
        let chunk;
        let currentColor;
        lines.forEach((line, lineIndex) => {
          let {count:lineGlyphCount, width:lineWidth} = line;

          // Ignore empty lines
          if (lineGlyphCount > 0) {
            // Count trailing whitespaces, we want to ignore these for certain things
            let trailingWhitespaceCount = 0;
            for (let i = lineGlyphCount; i-- && line.glyphAt(i).glyphObj.isWhitespace;) {
              trailingWhitespaceCount++;
            }

            // Apply horizontal alignment adjustments
            let lineXOffset = 0;
            let justifyAdjust = 0;
            if (textAlign === 'center') {
              lineXOffset = (maxLineWidth - lineWidth) / 2;
            } else if (textAlign === 'right') {
              lineXOffset = maxLineWidth - lineWidth;
            } else if (textAlign === 'justify' && line.isSoftWrapped) {
              // count non-trailing whitespace characters, and we'll adjust the offsets per character in the next loop
              let whitespaceCount = 0;
              for (let i = lineGlyphCount - trailingWhitespaceCount; i--;) {
                if (line.glyphAt(i).glyphObj.isWhitespace) {
                  whitespaceCount++;
                }
              }
              justifyAdjust = (maxLineWidth - lineWidth) / whitespaceCount;
            }
            if (justifyAdjust || lineXOffset) {
              let justifyOffset = 0;
              for (let i = 0; i < lineGlyphCount; i++) {
                let glyphInfo = line.glyphAt(i);
                const glyphObj = glyphInfo.glyphObj;
                glyphInfo.x += lineXOffset + justifyOffset;
                // Expand non-trailing whitespaces for justify alignment
                if (justifyAdjust !== 0 && glyphObj.isWhitespace && i < lineGlyphCount - trailingWhitespaceCount) {
                  justifyOffset += justifyAdjust;
                  glyphInfo.width += justifyAdjust;
                }
              }
            }

            // Perform bidi range flipping
            const flips = bidi.getReorderSegments(
              text, bidiLevelsResult, line.glyphAt(0).charIndex, line.glyphAt(line.count - 1).charIndex
            );
            for (let fi = 0; fi < flips.length; fi++) {
              const [start, end] = flips[fi];
              // Map start/end string indices to indices in the line
              let left = Infinity, right = -Infinity;
              for (let i = 0; i < lineGlyphCount; i++) {
                if (line.glyphAt(i).charIndex >= start) { // gte to handle removed characters
                  let startInLine = i, endInLine = i;
                  for (; endInLine < lineGlyphCount; endInLine++) {
                    let info = line.glyphAt(endInLine);
                    if (info.charIndex > end) {
                      break
                    }
                    if (endInLine < lineGlyphCount - trailingWhitespaceCount) { //don't include trailing ws in flip width
                      left = Math.min(left, info.x);
                      right = Math.max(right, info.x + info.width);
                    }
                  }
                  for (let j = startInLine; j < endInLine; j++) {
                    const glyphInfo = line.glyphAt(j);
                    glyphInfo.x = right - (glyphInfo.x + glyphInfo.width - left);
                  }
                  break
                }
              }
            }

            // Assemble final data arrays
            let glyphObj;
            const setGlyphObj = g => glyphObj = g;
            for (let i = 0; i < lineGlyphCount; i++) {
              const glyphInfo = line.glyphAt(i);
              glyphObj = glyphInfo.glyphObj;
              const glyphId = glyphObj.index;

              // Replace mirrored characters in rtl
              const rtl = bidiLevelsResult.levels[glyphInfo.charIndex] & 1; //odd level means rtl
              if (rtl) {
                const mirrored = bidi.getMirroredCharacter(text[glyphInfo.charIndex]);
                if (mirrored) {
                  glyphInfo.fontData.fontObj.forEachGlyph(mirrored, 0, 0, setGlyphObj);
                }
              }

              // Add caret positions
              if (includeCaretPositions) {
                const {charIndex, fontData} = glyphInfo;
                const caretLeft = glyphInfo.x + anchorXOffset;
                const caretRight = glyphInfo.x + glyphInfo.width + anchorXOffset;
                caretPositions[charIndex * 4] = rtl ? caretRight : caretLeft; //start edge x
                caretPositions[charIndex * 4 + 1] = rtl ? caretLeft : caretRight; //end edge x
                caretPositions[charIndex * 4 + 2] = line.baseline + fontData.caretBottom + anchorYOffset; //common bottom y
                caretPositions[charIndex * 4 + 3] = line.baseline + fontData.caretTop + anchorYOffset; //common top y

                // If we skipped any chars from the previous glyph (due to ligature subs), fill in caret
                // positions for those missing char indices; currently this uses a best-guess by dividing
                // the ligature's width evenly. In the future we may try to use the font's LigatureCaretList
                // table to get better interior caret positions.
                const ligCount = charIndex - prevCharIndex;
                if (ligCount > 1) {
                  fillLigatureCaretPositions(caretPositions, prevCharIndex, ligCount);
                }
                prevCharIndex = charIndex;
              }

              // Track current color range
              if (colorRanges) {
                const {charIndex} = glyphInfo;
                while(charIndex > colorCharIndex) {
                  colorCharIndex++;
                  if (colorRanges.hasOwnProperty(colorCharIndex)) {
                    currentColor = colorRanges[colorCharIndex];
                  }
                }
              }

              // Get atlas data for renderable glyphs
              if (!glyphObj.isWhitespace && !glyphObj.isEmpty) {
                const idx = renderableGlyphIndex++;
                const {fontSizeMult, src: fontSrc, index: fontIndex} = glyphInfo.fontData;

                // Add this glyph's path data
                const fontGlyphData = glyphData[fontSrc] || (glyphData[fontSrc] = {});
                if (!fontGlyphData[glyphId]) {
                  fontGlyphData[glyphId] = {
                    path: glyphObj.path,
                    pathBounds: [glyphObj.xMin, glyphObj.yMin, glyphObj.xMax, glyphObj.yMax]
                  };
                }

                // Determine final glyph position and add to glyphPositions array
                const glyphX = glyphInfo.x + anchorXOffset;
                const glyphY = glyphInfo.y + line.baseline + anchorYOffset;
                glyphPositions[idx * 2] = glyphX;
                glyphPositions[idx * 2 + 1] = glyphY;

                // Track total visible bounds
                const visX0 = glyphX + glyphObj.xMin * fontSizeMult;
                const visY0 = glyphY + glyphObj.yMin * fontSizeMult;
                const visX1 = glyphX + glyphObj.xMax * fontSizeMult;
                const visY1 = glyphY + glyphObj.yMax * fontSizeMult;
                if (visX0 < visibleBounds[0]) visibleBounds[0] = visX0;
                if (visY0 < visibleBounds[1]) visibleBounds[1] = visY0;
                if (visX1 > visibleBounds[2]) visibleBounds[2] = visX1;
                if (visY1 > visibleBounds[3]) visibleBounds[3] = visY1;

                // Track bounding rects for each chunk of N glyphs
                if (idx % chunkedBoundsSize === 0) {
                  chunk = {start: idx, end: idx, rect: [INF, INF, -INF, -INF]};
                  chunkedBounds.push(chunk);
                }
                chunk.end++;
                const chunkRect = chunk.rect;
                if (visX0 < chunkRect[0]) chunkRect[0] = visX0;
                if (visY0 < chunkRect[1]) chunkRect[1] = visY0;
                if (visX1 > chunkRect[2]) chunkRect[2] = visX1;
                if (visY1 > chunkRect[3]) chunkRect[3] = visY1;

                // Add to glyph ids and font indices arrays
                glyphIds[idx] = glyphId;
                glyphFontIndices[idx] = fontIndex;

                // Add colors
                if (colorRanges) {
                  const start = idx * 3;
                  glyphColors[start] = currentColor >> 16 & 255;
                  glyphColors[start + 1] = currentColor >> 8 & 255;
                  glyphColors[start + 2] = currentColor & 255;
                }
              }
            }
          }
        });

        // Fill in remaining caret positions in case the final character was a ligature
        if (caretPositions) {
          const ligCount = text.length - prevCharIndex;
          if (ligCount > 1) {
            fillLigatureCaretPositions(caretPositions, prevCharIndex, ligCount);
          }
        }
      }

      // Assemble final data about each font used
      const fontData = [];
      metricsByFont.forEach(({index, src, unitsPerEm, ascender, descender, lineHeight, capHeight, xHeight}) => {
        fontData[index] = {src, unitsPerEm, ascender, descender, lineHeight, capHeight, xHeight};
      });

      // Timing stats
      timings.typesetting = now() - typesetStart;

      callback({
        glyphIds, //id for each glyph, specific to that glyph's font
        glyphFontIndices, //index into fontData for each glyph
        glyphPositions, //x,y of each glyph's origin in layout
        glyphData, //dict holding data about each glyph appearing in the text
        fontData, //data about each font used in the text
        caretPositions, //startX,endX,bottomY caret positions for each char
        // caretHeight, //height of cursor from bottom to top - todo per glyph?
        glyphColors, //color for each glyph, if color ranges supplied
        chunkedBounds, //total rects per (n=chunkedBoundsSize) consecutive glyphs
        fontSize, //calculated em height
        topBaseline: anchorYOffset + lines[0].baseline, //y coordinate of the top line's baseline
        blockBounds: [ //bounds for the whole block of text, including vertical padding for lineHeight
          anchorXOffset,
          anchorYOffset - totalHeight,
          anchorXOffset + maxLineWidth,
          anchorYOffset
        ],
        visibleBounds, //total bounds of visible text paths, may be larger or smaller than blockBounds
        timings
      });
    });
  }


  /**
   * For a given text string and font parameters, determine the resulting block dimensions
   * after wrapping for the given maxWidth.
   * @param args
   * @param callback
   */
  function measure(args, callback) {
    typeset({...args, metricsOnly: true}, (result) => {
      const [x0, y0, x1, y1] = result.blockBounds;
      callback({
        width: x1 - x0,
        height: y1 - y0
      });
    });
  }

  function parsePercent(str) {
    let match = str.match(/^([\d.]+)%$/);
    let pct = match ? parseFloat(match[1]) : NaN;
    return isNaN(pct) ? 0 : pct / 100
  }

  function fillLigatureCaretPositions(caretPositions, ligStartIndex, ligCount) {
    const ligStartX = caretPositions[ligStartIndex * 4];
    const ligEndX = caretPositions[ligStartIndex * 4 + 1];
    const ligBottom = caretPositions[ligStartIndex * 4 + 2];
    const ligTop = caretPositions[ligStartIndex * 4 + 3];
    const guessedAdvanceX = (ligEndX - ligStartX) / ligCount;
    for (let i = 0; i < ligCount; i++) {
      const startIndex = (ligStartIndex + i) * 4;
      caretPositions[startIndex] = ligStartX + guessedAdvanceX * i;
      caretPositions[startIndex + 1] = ligStartX + guessedAdvanceX * (i + 1);
      caretPositions[startIndex + 2] = ligBottom;
      caretPositions[startIndex + 3] = ligTop;
    }
  }

  function now() {
    return (self.performance || Date).now()
  }

  // Array-backed structure for a single line's glyphs data
  function TextLine() {
    this.data = [];
  }
  const textLineProps = ['glyphObj', 'x', 'y', 'width', 'charIndex', 'fontData'];
  TextLine.prototype = {
    width: 0,
    lineHeight: 0,
    baseline: 0,
    cap: 0,
    ex: 0,
    isSoftWrapped: false,
    get count() {
      return Math.ceil(this.data.length / textLineProps.length)
    },
    glyphAt(i) {
      let fly = TextLine.flyweight;
      fly.data = this.data;
      fly.index = i;
      return fly
    },
    splitAt(i) {
      let newLine = new TextLine();
      newLine.data = this.data.splice(i * textLineProps.length);
      return newLine
    }
  };
  TextLine.flyweight = textLineProps.reduce((obj, prop, i, all) => {
    Object.defineProperty(obj, prop, {
      get() {
        return this.data[this.index * textLineProps.length + i]
      },
      set(val) {
        this.data[this.index * textLineProps.length + i] = val;
      }
    });
    return obj
  }, {data: null, index: 0});


  return {
    typeset,
    measure,
  }
}

const now = () => (self.performance || Date).now();

const mainThreadGenerator = /*#__PURE__*/ SDFGenerator();

let warned;

/**
 * Generate an SDF texture image for a single glyph path, placing the result into a webgl canvas at a
 * given location and channel. Utilizes the webgl-sdf-generator external package for GPU-accelerated SDF
 * generation when supported.
 */
function generateSDF(width, height, path, viewBox, distance, exponent, canvas, x, y, channel, useWebGL = true) {
  // Allow opt-out
  if (!useWebGL) {
    return generateSDF_JS_Worker(width, height, path, viewBox, distance, exponent, canvas, x, y, channel)
  }

  // Attempt GPU-accelerated generation first
  return generateSDF_GL(width, height, path, viewBox, distance, exponent, canvas, x, y, channel).then(
    null,
    err => {
      // WebGL failed either due to a hard error or unexpected results; fall back to JS in workers
      if (!warned) {
        console.warn(`WebGL SDF generation failed, falling back to JS`, err);
        warned = true;
      }
      return generateSDF_JS_Worker(width, height, path, viewBox, distance, exponent, canvas, x, y, channel)
    }
  )
}

const queue = [];
const chunkTimeBudget = 5; // ms
let timer = 0;

function nextChunk() {
  const start = now();
  while (queue.length && now() - start < chunkTimeBudget) {
    queue.shift()();
  }
  timer = queue.length ? setTimeout(nextChunk, 0) : 0;
}

/**
 * WebGL-based implementation executed on the main thread. Requests are executed in time-bounded
 * macrotask chunks to allow render frames to execute in between.
 */
const generateSDF_GL = (...args) => {
  return new Promise((resolve, reject) => {
    queue.push(() => {
      const start = now();
      try {
        mainThreadGenerator.webgl.generateIntoCanvas(...args);
        resolve({ timing: now() - start });
      } catch (err) {
        reject(err);
      }
    });
    if (!timer) {
      timer = setTimeout(nextChunk, 0);
    }
  })
};

const threadCount = 4; // how many workers to spawn
const idleTimeout = 2000; // workers will be terminated after being idle this many milliseconds
const threads = {};
let callNum = 0;

/**
 * Fallback JS-based implementation, fanned out to a number of worker threads for parallelism
 */
function generateSDF_JS_Worker(width, height, path, viewBox, distance, exponent, canvas, x, y, channel) {
  const workerId = 'TroikaTextSDFGenerator_JS_' + ((callNum++) % threadCount);
  let thread = threads[workerId];
  if (!thread) {
    thread = threads[workerId] = {
      workerModule: defineWorkerModule({
        name: workerId,
        workerId,
        dependencies: [
          SDFGenerator,
          now
        ],
        init(_createSDFGenerator, now) {
          const generate = _createSDFGenerator().javascript.generate;
          return function (...args) {
            const start = now();
            const textureData = generate(...args);
            return {
              textureData,
              timing: now() - start
            }
          }
        },
        getTransferables(result) {
          return [result.textureData.buffer]
        }
      }),
      requests: 0,
      idleTimer: null
    };
  }

  thread.requests++;
  clearTimeout(thread.idleTimer);
  return thread.workerModule(width, height, path, viewBox, distance, exponent)
    .then(({ textureData, timing }) => {
      // copy result data into the canvas
      const start = now();
      // expand single-channel data into rgba
      const imageData = new Uint8Array(textureData.length * 4);
      for (let i = 0; i < textureData.length; i++) {
        imageData[i * 4 + channel] = textureData[i];
      }
      mainThreadGenerator.webglUtils.renderImageData(canvas, imageData, x, y, width, height, 1 << (3 - channel));
      timing += now() - start;

      // clean up workers after a while
      if (--thread.requests === 0) {
        thread.idleTimer = setTimeout(() => { terminateWorker(workerId); }, idleTimeout);
      }
      return { timing }
    })
}

function warmUpSDFCanvas(canvas) {
  if (!canvas._warm) {
    mainThreadGenerator.webgl.isSupported(canvas);
    canvas._warm = true;
  }
}

const resizeWebGLCanvasWithoutClearing = mainThreadGenerator.webglUtils.resizeWebGLCanvasWithoutClearing;

const CONFIG = {
  defaultFontURL: null,
  unicodeFontsURL: null,
  sdfGlyphSize: 64,
  sdfMargin: 1 / 16,
  sdfExponent: 9,
  textureWidth: 2048,
};
const tempColor = /*#__PURE__*/new Color();
let hasRequested = false;

function now$1() {
  return (self.performance || Date).now()
}

/**
 * Customizes the text builder configuration. This must be called prior to the first font processing
 * request, and applies to all fonts.
 *
 * @param {String} config.defaultFontURL - The URL of the default font to use for text processing
 *                 requests, in case none is specified or the specifiede font fails to load or parse.
 *                 Defaults to "Roboto Regular" from Google Fonts.
 * @param {String} config.unicodeFontsURL - A custom location for the fallback unicode-font-resolver
 *                 data and font files, if you don't want to use the default CDN. See
 *                 https://github.com/lojjic/unicode-font-resolver for details. It can also be
 *                 configured per text instance, but this lets you do it once globally.
 * @param {Number} config.sdfGlyphSize - The default size of each glyph's SDF (signed distance field)
 *                 texture used for rendering. Must be a power-of-two number, and applies to all fonts,
 *                 but note that this can also be overridden per call to `getTextRenderInfo()`.
 *                 Larger sizes can improve the quality of glyph rendering by increasing the sharpness
 *                 of corners and preventing loss of very thin lines, at the expense of memory. Defaults
 *                 to 64 which is generally a good balance of size and quality.
 * @param {Number} config.sdfExponent - The exponent used when encoding the SDF values. A higher exponent
 *                 shifts the encoded 8-bit values to achieve higher precision/accuracy at texels nearer
 *                 the glyph's path, with lower precision further away. Defaults to 9.
 * @param {Number} config.sdfMargin - How much space to reserve in the SDF as margin outside the glyph's
 *                 path, as a percentage of the SDF width. A larger margin increases the quality of
 *                 extruded glyph outlines, but decreases the precision available for the glyph itself.
 *                 Defaults to 1/16th of the glyph size.
 * @param {Number} config.textureWidth - The width of the SDF texture; must be a power of 2. Defaults to
 *                 2048 which is a safe maximum texture dimension according to the stats at
 *                 https://webglstats.com/webgl/parameter/MAX_TEXTURE_SIZE and should allow for a
 *                 reasonably large number of glyphs (default glyph size of 64^2 and safe texture size of
 *                 2048^2, times 4 channels, allows for 4096 glyphs.) This can be increased if you need to
 *                 increase the glyph size and/or have an extraordinary number of glyphs.
 */
function configureTextBuilder(config) {
  if (hasRequested) {
    console.warn('configureTextBuilder called after first font request; will be ignored.');
  } else {
    assign(CONFIG, config);
  }
}

/**
 * Repository for all font SDF atlas textures and their glyph mappings. There is a separate atlas for
 * each sdfGlyphSize. Each atlas has a single Texture that holds all glyphs for all fonts.
 *
 *   {
 *     [sdfGlyphSize]: {
 *       glyphCount: number,
 *       sdfGlyphSize: number,
 *       sdfTexture: Texture,
 *       sdfCanvas: HTMLCanvasElement,
 *       contextLost: boolean,
 *       glyphsByFont: Map<fontURL, Map<glyphID, {path, atlasIndex, sdfViewBox}>>
 *     }
 *   }
 */
const atlases = Object.create(null);

/**
 * @typedef {object} TroikaTextRenderInfo - Format of the result from `getTextRenderInfo`.
 * @property {TypesetParams} parameters - The normalized input arguments to the render call.
 * @property {Texture} sdfTexture - The SDF atlas texture.
 * @property {number} sdfGlyphSize - The size of each glyph's SDF; see `configureTextBuilder`.
 * @property {number} sdfExponent - The exponent used in encoding the SDF's values; see `configureTextBuilder`.
 * @property {Float32Array} glyphBounds - List of [minX, minY, maxX, maxY] quad bounds for each glyph.
 * @property {Float32Array} glyphAtlasIndices - List holding each glyph's index in the SDF atlas.
 * @property {Uint8Array} [glyphColors] - List holding each glyph's [r, g, b] color, if `colorRanges` was supplied.
 * @property {Float32Array} [caretPositions] - A list of caret positions for all characters in the string; each is
 *           four elements: the starting X, the ending X, the bottom Y, and the top Y for the caret.
 * @property {number} [caretHeight] - An appropriate height for all selection carets.
 * @property {number} ascender - The font's ascender metric.
 * @property {number} descender - The font's descender metric.
 * @property {number} capHeight - The font's cap height metric, based on the height of Latin capital letters.
 * @property {number} xHeight - The font's x height metric, based on the height of Latin lowercase letters.
 * @property {number} lineHeight - The final computed lineHeight measurement.
 * @property {number} topBaseline - The y position of the top line's baseline.
 * @property {Array<number>} blockBounds - The total [minX, minY, maxX, maxY] rect of the whole text block;
 *           this can include extra vertical space beyond the visible glyphs due to lineHeight, and is
 *           equivalent to the dimensions of a block-level text element in CSS.
 * @property {Array<number>} visibleBounds - The total [minX, minY, maxX, maxY] rect of the whole text block;
 *           unlike `blockBounds` this is tightly wrapped to the visible glyph paths.
 * @property {Array<object>} chunkedBounds - List of bounding rects for each consecutive set of N glyphs,
 *           in the format `{start:N, end:N, rect:[minX, minY, maxX, maxY]}`.
 * @property {object} timings - Timing info for various parts of the rendering logic including SDF
 *           generation, typesetting, etc.
 * @frozen
 */

/**
 * @callback getTextRenderInfo~callback
 * @param {TroikaTextRenderInfo} textRenderInfo
 */

/**
 * Main entry point for requesting the data needed to render a text string with given font parameters.
 * This is an asynchronous call, performing most of the logic in a web worker thread.
 * @param {TypesetParams} args
 * @param {getTextRenderInfo~callback} callback
 */
function getTextRenderInfo(args, callback) {
  hasRequested = true;
  args = assign({}, args);
  const totalStart = now$1();

  // Convert relative URL to absolute so it can be resolved in the worker, and add fallbacks.
  // In the future we'll allow args.font to be a list with unicode ranges too.
  const { defaultFontURL } = CONFIG;
  const fonts = [];
  if (defaultFontURL) {
    fonts.push({label: 'default', src: toAbsoluteURL(defaultFontURL)});
  }
  if (args.font) {
    fonts.push({label: 'user', src: toAbsoluteURL(args.font)});
  }
  args.font = fonts;

  // Normalize text to a string
  args.text = '' + args.text;

  args.sdfGlyphSize = args.sdfGlyphSize || CONFIG.sdfGlyphSize;
  args.unicodeFontsURL = args.unicodeFontsURL || CONFIG.unicodeFontsURL;

  // Normalize colors
  if (args.colorRanges != null) {
    let colors = {};
    for (let key in args.colorRanges) {
      if (args.colorRanges.hasOwnProperty(key)) {
        let val = args.colorRanges[key];
        if (typeof val !== 'number') {
          val = tempColor.set(val).getHex();
        }
        colors[key] = val;
      }
    }
    args.colorRanges = colors;
  }

  Object.freeze(args);

  // Init the atlas if needed
  const {textureWidth, sdfExponent} = CONFIG;
  const {sdfGlyphSize} = args;
  const glyphsPerRow = (textureWidth / sdfGlyphSize * 4);
  let atlas = atlases[sdfGlyphSize];
  if (!atlas) {
    const canvas = document.createElement('canvas');
    canvas.width = textureWidth;
    canvas.height = sdfGlyphSize * 256 / glyphsPerRow; // start tall enough to fit 256 glyphs
    atlas = atlases[sdfGlyphSize] = {
      glyphCount: 0,
      sdfGlyphSize,
      sdfCanvas: canvas,
      sdfTexture: new Texture(
        canvas,
        undefined,
        undefined,
        undefined,
        LinearFilter,
        LinearFilter
      ),
      contextLost: false,
      glyphsByFont: new Map()
    };
    atlas.sdfTexture.generateMipmaps = false;
    initContextLossHandling(atlas);
  }

  const {sdfTexture, sdfCanvas} = atlas;

  // Issue request to the typesetting engine in the worker
  typesetInWorker(args).then(result => {
    const {glyphIds, glyphFontIndices, fontData, glyphPositions, fontSize, timings} = result;
    const neededSDFs = [];
    const glyphBounds = new Float32Array(glyphIds.length * 4);
    let boundsIdx = 0;
    let positionsIdx = 0;
    const quadsStart = now$1();

    const fontGlyphMaps = fontData.map(font => {
      let map = atlas.glyphsByFont.get(font.src);
      if (!map) {
        atlas.glyphsByFont.set(font.src, map = new Map());
      }
      return map
    });

    glyphIds.forEach((glyphId, i) => {
      const fontIndex = glyphFontIndices[i];
      const {src: fontSrc, unitsPerEm} = fontData[fontIndex];
      let glyphInfo = fontGlyphMaps[fontIndex].get(glyphId);

      // If this is a glyphId not seen before, add it to the atlas
      if (!glyphInfo) {
        const {path, pathBounds} = result.glyphData[fontSrc][glyphId];

        // Margin around path edges in SDF, based on a percentage of the glyph's max dimension.
        // Note we add an extra 0.5 px over the configured value because the outer 0.5 doesn't contain
        // useful interpolated values and will be ignored anyway.
        const fontUnitsMargin = Math.max(pathBounds[2] - pathBounds[0], pathBounds[3] - pathBounds[1])
          / sdfGlyphSize * (CONFIG.sdfMargin * sdfGlyphSize + 0.5);

        const atlasIndex = atlas.glyphCount++;
        const sdfViewBox = [
          pathBounds[0] - fontUnitsMargin,
          pathBounds[1] - fontUnitsMargin,
          pathBounds[2] + fontUnitsMargin,
          pathBounds[3] + fontUnitsMargin,
        ];
        fontGlyphMaps[fontIndex].set(glyphId, (glyphInfo = { path, atlasIndex, sdfViewBox }));

        // Collect those that need SDF generation
        neededSDFs.push(glyphInfo);
      }

      // Calculate bounds for renderable quads
      // TODO can we get this back off the main thread?
      const {sdfViewBox} = glyphInfo;
      const posX = glyphPositions[positionsIdx++];
      const posY = glyphPositions[positionsIdx++];
      const fontSizeMult = fontSize / unitsPerEm;
      glyphBounds[boundsIdx++] = posX + sdfViewBox[0] * fontSizeMult;
      glyphBounds[boundsIdx++] = posY + sdfViewBox[1] * fontSizeMult;
      glyphBounds[boundsIdx++] = posX + sdfViewBox[2] * fontSizeMult;
      glyphBounds[boundsIdx++] = posY + sdfViewBox[3] * fontSizeMult;

      // Convert glyphId to SDF index for the shader
      glyphIds[i] = glyphInfo.atlasIndex;
    });
    timings.quads = (timings.quads || 0) + (now$1() - quadsStart);

    const sdfStart = now$1();
    timings.sdf = {};

    // Grow the texture height by power of 2 if needed
    const currentHeight = sdfCanvas.height;
    const neededRows = Math.ceil(atlas.glyphCount / glyphsPerRow);
    const neededHeight = Math.pow(2, Math.ceil(Math.log2(neededRows * sdfGlyphSize)));
    if (neededHeight > currentHeight) {
      // Since resizing the canvas clears its render buffer, it needs special handling to copy the old contents over
      console.info(`Increasing SDF texture size ${currentHeight}->${neededHeight}`);
      resizeWebGLCanvasWithoutClearing(sdfCanvas, textureWidth, neededHeight);
      // As of Three r136 textures cannot be resized once they're allocated on the GPU, we must dispose to reallocate it
      sdfTexture.dispose();
    }

    Promise.all(neededSDFs.map(glyphInfo =>
      generateGlyphSDF(glyphInfo, atlas, args.gpuAccelerateSDF).then(({timing}) => {
        timings.sdf[glyphInfo.atlasIndex] = timing;
      })
    )).then(() => {
      if (neededSDFs.length && !atlas.contextLost) {
        safariPre15Workaround(atlas);
        sdfTexture.needsUpdate = true;
      }
      timings.sdfTotal = now$1() - sdfStart;
      timings.total = now$1() - totalStart;
      // console.log(`SDF - ${timings.sdfTotal}, Total - ${timings.total - timings.fontLoad}`)

      // Invoke callback with the text layout arrays and updated texture
      callback(Object.freeze({
        parameters: args,
        sdfTexture,
        sdfGlyphSize,
        sdfExponent,
        glyphBounds,
        glyphAtlasIndices: glyphIds,
        glyphColors: result.glyphColors,
        caretPositions: result.caretPositions,
        chunkedBounds: result.chunkedBounds,
        ascender: result.ascender,
        descender: result.descender,
        lineHeight: result.lineHeight,
        capHeight: result.capHeight,
        xHeight: result.xHeight,
        topBaseline: result.topBaseline,
        blockBounds: result.blockBounds,
        visibleBounds: result.visibleBounds,
        timings: result.timings,
      }));
    });
  });

  // While the typesetting request is being handled, go ahead and make sure the atlas canvas context is
  // "warmed up"; the first request will be the longest due to shader program compilation so this gets
  // a head start on that process before SDFs actually start getting processed.
  Promise.resolve().then(() => {
    if (!atlas.contextLost) {
      warmUpSDFCanvas(sdfCanvas);
    }
  });
}

function generateGlyphSDF({path, atlasIndex, sdfViewBox}, {sdfGlyphSize, sdfCanvas, contextLost}, useGPU) {
  if (contextLost) {
    // If the context is lost there's nothing we can do, just quit silently and let it
    // get regenerated when the context is restored
    return Promise.resolve({timing: -1})
  }
  const {textureWidth, sdfExponent} = CONFIG;
  const maxDist = Math.max(sdfViewBox[2] - sdfViewBox[0], sdfViewBox[3] - sdfViewBox[1]);
  const squareIndex = Math.floor(atlasIndex / 4);
  const x = squareIndex % (textureWidth / sdfGlyphSize) * sdfGlyphSize;
  const y = Math.floor(squareIndex / (textureWidth / sdfGlyphSize)) * sdfGlyphSize;
  const channel = atlasIndex % 4;
  return generateSDF(sdfGlyphSize, sdfGlyphSize, path, sdfViewBox, maxDist, sdfExponent, sdfCanvas, x, y, channel, useGPU)
}

function initContextLossHandling(atlas) {
  const canvas = atlas.sdfCanvas;

  /*
  // Begin context loss simulation
  if (!window.WebGLDebugUtils) {
    let script = document.getElementById('WebGLDebugUtilsScript')
    if (!script) {
      script = document.createElement('script')
      script.id = 'WebGLDebugUtils'
      document.head.appendChild(script)
      script.src = 'https://cdn.jsdelivr.net/gh/KhronosGroup/WebGLDeveloperTools@b42e702/src/debug/webgl-debug.js'
    }
    script.addEventListener('load', () => {
      initContextLossHandling(atlas)
    })
    return
  }
  window.WebGLDebugUtils.makeLostContextSimulatingCanvas(canvas)
  canvas.loseContextInNCalls(500)
  canvas.addEventListener('webglcontextrestored', (event) => {
    canvas.loseContextInNCalls(5000)
  })
  // End context loss simulation
  */

  canvas.addEventListener('webglcontextlost', (event) => {
    console.log('Context Lost', event);
    event.preventDefault();
    atlas.contextLost = true;
  });
  canvas.addEventListener('webglcontextrestored', (event) => {
    console.log('Context Restored', event);
    atlas.contextLost = false;
    // Regenerate all glyphs into the restored canvas:
    const promises = [];
    atlas.glyphsByFont.forEach(glyphMap => {
      glyphMap.forEach(glyph => {
        promises.push(generateGlyphSDF(glyph, atlas, true));
      });
    });
    Promise.all(promises).then(() => {
      safariPre15Workaround(atlas);
      atlas.sdfTexture.needsUpdate = true;
    });
  });
}

/**
 * Preload a given font and optionally pre-generate glyph SDFs for one or more character sequences.
 * This can be useful to avoid long pauses when first showing text in a scene, by preloading the
 * needed fonts and glyphs up front along with other assets.
 *
 * @param {object} options
 * @param {string} options.font - URL of the font file to preload. If not given, the default font will
 *        be loaded.
 * @param {string|string[]} options.characters - One or more character sequences for which to pre-
 *        generate glyph SDFs. Note that this will honor ligature substitution, so you may need
 *        to specify ligature sequences in addition to their individual characters to get all
 *        possible glyphs, e.g. `["t", "h", "th"]` to get the "t" and "h" glyphs plus the "th" ligature.
 * @param {number} options.sdfGlyphSize - The size at which to prerender the SDF textures for the
 *        specified `characters`.
 * @param {function} callback - A function that will be called when the preloading is complete.
 */
function preloadFont({font, characters, sdfGlyphSize}, callback) {
  let text = Array.isArray(characters) ? characters.join('\n') : '' + characters;
  getTextRenderInfo({ font, sdfGlyphSize, text }, callback);
}


// Local assign impl so we don't have to import troika-core
function assign(toObj, fromObj) {
  for (let key in fromObj) {
    if (fromObj.hasOwnProperty(key)) {
      toObj[key] = fromObj[key];
    }
  }
  return toObj
}

// Utility for making URLs absolute
let linkEl;
function toAbsoluteURL(path) {
  if (!linkEl) {
    linkEl = typeof document === 'undefined' ? {} : document.createElement('a');
  }
  linkEl.href = path;
  return linkEl.href
}

/**
 * Safari < v15 seems unable to use the SDF webgl canvas as a texture. This applies a workaround
 * where it reads the pixels out of that canvas and uploads them as a data texture instead, at
 * a slight performance cost.
 */
function safariPre15Workaround(atlas) {
  // Use createImageBitmap support as a proxy for Safari<15, all other mainstream browsers
  // have supported it for a long while so any false positives should be minimal.
  if (typeof createImageBitmap !== 'function') {
    console.info('Safari<15: applying SDF canvas workaround');
    const {sdfCanvas, sdfTexture} = atlas;
    const {width, height} = sdfCanvas;
    const gl = atlas.sdfCanvas.getContext('webgl');
    let pixels = sdfTexture.image.data;
    if (!pixels || pixels.length !== width * height * 4) {
      pixels = new Uint8Array(width * height * 4);
      sdfTexture.image = {width, height, data: pixels};
      sdfTexture.flipY = false;
      sdfTexture.isDataTexture = true;
    }
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  }
}

const typesetterWorkerModule = /*#__PURE__*/defineWorkerModule({
  name: 'Typesetter',
  dependencies: [
    createTypesetter,
    fontResolverWorkerModule,
    bidiFactory,
  ],
  init(createTypesetter, fontResolver, bidiFactory) {
    return createTypesetter(fontResolver, bidiFactory())
  }
});

const typesetInWorker = /*#__PURE__*/defineWorkerModule({
  name: 'Typesetter',
  dependencies: [
    typesetterWorkerModule,
  ],
  init(typesetter) {
    return function(args) {
      return new Promise(resolve => {
        typesetter.typeset(args, resolve);
      })
    }
  },
  getTransferables(result) {
    // Mark array buffers as transferable to avoid cloning during postMessage
    const transferables = [];
    for (let p in result) {
      if (result[p] && result[p].buffer) {
        transferables.push(result[p].buffer);
      }
    }
    return transferables
  }
});

function dumpSDFTextures() {
  Object.keys(atlases).forEach(size => {
    const canvas = atlases[size].sdfCanvas;
    const {width, height} = canvas;
    console.log("%c.", `
      background: url(${canvas.toDataURL()});
      background-size: ${width}px ${height}px;
      color: transparent;
      font-size: 0;
      line-height: ${height}px;
      padding-left: ${width}px;
    `);
  });
}

const templateGeometries = {};

function getTemplateGeometry(detail) {
  let geom = templateGeometries[detail];
  if (!geom) {
    // Geometry is two planes back-to-back, which will always be rendered FrontSide only but
    // appear as DoubleSide by default. FrontSide/BackSide are emulated using drawRange.
    // We do it this way to avoid the performance hit of two draw calls for DoubleSide materials
    // introduced by Three.js in r130 - see https://github.com/mrdoob/three.js/pull/21967
    const front = new PlaneGeometry(1, 1, detail, detail);
    const back = front.clone();
    const frontAttrs = front.attributes;
    const backAttrs = back.attributes;
    const combined = new BufferGeometry();
    const vertCount = frontAttrs.uv.count;
    for (let i = 0; i < vertCount; i++) {
      backAttrs.position.array[i * 3] *= -1; // flip position x
      backAttrs.normal.array[i * 3 + 2] *= -1; // flip normal z
    }
    ['position', 'normal', 'uv'].forEach(name => {
      combined.setAttribute(name, new Float32BufferAttribute(
        [...frontAttrs[name].array, ...backAttrs[name].array],
        frontAttrs[name].itemSize)
      );
    });
    combined.setIndex([...front.index.array, ...back.index.array.map(n => n + vertCount)]);
    combined.translate(0.5, 0.5, 0);
    geom = templateGeometries[detail] = combined;
  }
  return geom
}

const glyphBoundsAttrName = 'aTroikaGlyphBounds';
const glyphIndexAttrName = 'aTroikaGlyphIndex';
const glyphColorAttrName = 'aTroikaGlyphColor';

/**
@class GlyphsGeometry

A specialized Geometry for rendering a set of text glyphs. Uses InstancedBufferGeometry to
render the glyphs using GPU instancing of a single quad, rather than constructing a whole
geometry with vertices, for much smaller attribute arraybuffers according to this math:

  Where N = number of glyphs...

  Instanced:
  - position: 4 * 3
  - index: 2 * 3
  - normal: 4 * 3
  - uv: 4 * 2
  - glyph x/y bounds: N * 4
  - glyph indices: N * 1
  = 5N + 38

  Non-instanced:
  - position: N * 4 * 3
  - index: N * 2 * 3
  - normal: N * 4 * 3
  - uv: N * 4 * 2
  - glyph indices: N * 1
  = 39N

A downside of this is the rare-but-possible lack of the instanced arrays extension,
which we could potentially work around with a fallback non-instanced implementation.

*/
class GlyphsGeometry extends InstancedBufferGeometry {
  constructor() {
    super();

    this.detail = 1;
    this.curveRadius = 0;

    // Define groups for rendering text outline as a separate pass; these will only
    // be used when the `material` getter returns an array, i.e. outlineWidth > 0.
    this.groups = [
      {start: 0, count: Infinity, materialIndex: 0},
      {start: 0, count: Infinity, materialIndex: 1}
    ];

    // Preallocate empty bounding objects
    this.boundingSphere = new Sphere();
    this.boundingBox = new Box3();
  }

  computeBoundingSphere () {
    // No-op; we'll sync the boundingSphere proactively when needed.
  }

  computeBoundingBox() {
    // No-op; we'll sync the boundingBox proactively when needed.
  }

  // Since our base geometry contains triangles for both front and back sides, we can emulate
  // the "side" by restricting the draw range.
  setSide(side) {
    const verts = this.getIndex().count;
    this.setDrawRange(side === BackSide ? verts / 2 : 0, side === DoubleSide ? verts : verts / 2);
  }

  set detail(detail) {
    if (detail !== this._detail) {
      this._detail = detail;
      if (typeof detail !== 'number' || detail < 1) {
        detail = 1;
      }
      let tpl = getTemplateGeometry(detail)
      ;['position', 'normal', 'uv'].forEach(attr => {
        this.attributes[attr] = tpl.attributes[attr].clone();
      });
      this.setIndex(tpl.getIndex().clone());
    }
  }
  get detail() {
    return this._detail
  }

  set curveRadius(r) {
    if (r !== this._curveRadius) {
      this._curveRadius = r;
      this._updateBounds();
    }
  }
  get curveRadius() {
    return this._curveRadius
  }

  /**
   * Update the geometry for a new set of glyphs.
   * @param {Float32Array} glyphBounds - An array holding the planar bounds for all glyphs
   *        to be rendered, 4 entries for each glyph: x1,x2,y1,y1
   * @param {Float32Array} glyphAtlasIndices - An array holding the index of each glyph within
   *        the SDF atlas texture.
   * @param {Array} blockBounds - An array holding the [minX, minY, maxX, maxY] across all glyphs
   * @param {Array} [chunkedBounds] - An array of objects describing bounds for each chunk of N
   *        consecutive glyphs: `{start:N, end:N, rect:[minX, minY, maxX, maxY]}`. This can be
   *        used with `applyClipRect` to choose an optimized `instanceCount`.
   * @param {Uint8Array} [glyphColors] - An array holding r,g,b values for each glyph.
   */
  updateGlyphs(glyphBounds, glyphAtlasIndices, blockBounds, chunkedBounds, glyphColors) {
    // Update the instance attributes
    updateBufferAttr(this, glyphBoundsAttrName, glyphBounds, 4);
    updateBufferAttr(this, glyphIndexAttrName, glyphAtlasIndices, 1);
    updateBufferAttr(this, glyphColorAttrName, glyphColors, 3);
    this._blockBounds = blockBounds;
    this._chunkedBounds = chunkedBounds;
    this.instanceCount = glyphAtlasIndices.length;
    this._updateBounds();
  }

  _updateBounds() {
    const bounds = this._blockBounds;
    if (bounds) {
      const { curveRadius, boundingBox: bbox } = this;
      if (curveRadius) {
        const { PI, floor, min, max, sin, cos } = Math;
        const halfPi = PI / 2;
        const twoPi = PI * 2;
        const absR = Math.abs(curveRadius);
        const leftAngle = bounds[0] / absR;
        const rightAngle = bounds[2] / absR;
        const minX = floor((leftAngle + halfPi) / twoPi) !== floor((rightAngle + halfPi) / twoPi)
          ? -absR : min(sin(leftAngle) * absR, sin(rightAngle) * absR);
        const maxX = floor((leftAngle - halfPi) / twoPi) !== floor((rightAngle - halfPi) / twoPi)
          ? absR : max(sin(leftAngle) * absR, sin(rightAngle) * absR);
        const maxZ = floor((leftAngle + PI) / twoPi) !== floor((rightAngle + PI) / twoPi)
          ? absR * 2 : max(absR - cos(leftAngle) * absR, absR - cos(rightAngle) * absR);
        bbox.min.set(minX, bounds[1], curveRadius < 0 ? -maxZ : 0);
        bbox.max.set(maxX, bounds[3], curveRadius < 0 ? 0 : maxZ);
      } else {
        bbox.min.set(bounds[0], bounds[1], 0);
        bbox.max.set(bounds[2], bounds[3], 0);
      }
      bbox.getBoundingSphere(this.boundingSphere);
    }
  }

  /**
   * Given a clipping rect, and the chunkedBounds from the last updateGlyphs call, choose the lowest
   * `instanceCount` that will show all glyphs within the clipped view. This is an optimization
   * for long blocks of text that are clipped, to skip vertex shader evaluation for glyphs that would
   * be clipped anyway.
   *
   * Note that since `drawElementsInstanced[ANGLE]` only accepts an instance count and not a starting
   * offset, this optimization becomes less effective as the clipRect moves closer to the end of the
   * text block. We could fix that by switching from instancing to a full geometry with a drawRange,
   * but at the expense of much larger attribute buffers (see classdoc above.)
   *
   * @param {Vector4} clipRect
   */
  applyClipRect(clipRect) {
    let count = this.getAttribute(glyphIndexAttrName).count;
    let chunks = this._chunkedBounds;
    if (chunks) {
      for (let i = chunks.length; i--;) {
        count = chunks[i].end;
        let rect = chunks[i].rect;
        // note: both rects are l-b-r-t
        if (rect[1] < clipRect.w && rect[3] > clipRect.y && rect[0] < clipRect.z && rect[2] > clipRect.x) {
          break
        }
      }
    }
    this.instanceCount = count;
  }
}


function updateBufferAttr(geom, attrName, newArray, itemSize) {
  const attr = geom.getAttribute(attrName);
  if (newArray) {
    // If length isn't changing, just update the attribute's array data
    if (attr && attr.array.length === newArray.length) {
      attr.array.set(newArray);
      attr.needsUpdate = true;
    } else {
      geom.setAttribute(attrName, new InstancedBufferAttribute(newArray, itemSize));
      // If the new attribute has a different size, we also have to (as of r117) manually clear the
      // internal cached max instance count. See https://github.com/mrdoob/three.js/issues/19706
      // It's unclear if this is a threejs bug or a truly unsupported scenario; discussion in
      // that ticket is ambiguous as to whether replacing a BufferAttribute with one of a
      // different size is supported, but https://github.com/mrdoob/three.js/pull/17418 strongly
      // implies it should be supported. It's possible we need to
      delete geom._maxInstanceCount; //for r117+, could be fragile
      geom.dispose(); //for r118+, more robust feeling, but more heavy-handed than I'd like
    }
  } else if (attr) {
    geom.deleteAttribute(attrName);
  }
}

// language=GLSL
const VERTEX_DEFS = `
uniform vec2 uTroikaSDFTextureSize;
uniform float uTroikaSDFGlyphSize;
uniform vec4 uTroikaTotalBounds;
uniform vec4 uTroikaClipRect;
uniform mat3 uTroikaOrient;
uniform bool uTroikaUseGlyphColors;
uniform float uTroikaDistanceOffset;
uniform float uTroikaBlurRadius;
uniform vec2 uTroikaPositionOffset;
uniform float uTroikaCurveRadius;
attribute vec4 aTroikaGlyphBounds;
attribute float aTroikaGlyphIndex;
attribute vec3 aTroikaGlyphColor;
varying vec2 vTroikaGlyphUV;
varying vec4 vTroikaTextureUVBounds;
varying float vTroikaTextureChannel;
varying vec3 vTroikaGlyphColor;
varying vec2 vTroikaGlyphDimensions;
`;

// language=GLSL prefix="void main() {" suffix="}"
const VERTEX_TRANSFORM = `
vec4 bounds = aTroikaGlyphBounds;
bounds.xz += uTroikaPositionOffset.x;
bounds.yw -= uTroikaPositionOffset.y;

vec4 outlineBounds = vec4(
  bounds.xy - uTroikaDistanceOffset - uTroikaBlurRadius,
  bounds.zw + uTroikaDistanceOffset + uTroikaBlurRadius
);
vec4 clippedBounds = vec4(
  clamp(outlineBounds.xy, uTroikaClipRect.xy, uTroikaClipRect.zw),
  clamp(outlineBounds.zw, uTroikaClipRect.xy, uTroikaClipRect.zw)
);

vec2 clippedXY = (mix(clippedBounds.xy, clippedBounds.zw, position.xy) - bounds.xy) / (bounds.zw - bounds.xy);

position.xy = mix(bounds.xy, bounds.zw, clippedXY);

uv = (position.xy - uTroikaTotalBounds.xy) / (uTroikaTotalBounds.zw - uTroikaTotalBounds.xy);

float rad = uTroikaCurveRadius;
if (rad != 0.0) {
  float angle = position.x / rad;
  position.xz = vec2(sin(angle) * rad, rad - cos(angle) * rad);
  normal.xz = vec2(sin(angle), cos(angle));
}
  
position = uTroikaOrient * position;
normal = uTroikaOrient * normal;

vTroikaGlyphUV = clippedXY.xy;
vTroikaGlyphDimensions = vec2(bounds[2] - bounds[0], bounds[3] - bounds[1]);

${''/* NOTE: it seems important to calculate the glyph's bounding texture UVs here in the
  vertex shader, rather than in the fragment shader, as the latter gives strange artifacts
  on some glyphs (those in the leftmost texture column) on some systems. The exact reason
  isn't understood but doing this here, then mix()-ing in the fragment shader, seems to work. */}
float txCols = uTroikaSDFTextureSize.x / uTroikaSDFGlyphSize;
vec2 txUvPerSquare = uTroikaSDFGlyphSize / uTroikaSDFTextureSize;
vec2 txStartUV = txUvPerSquare * vec2(
  mod(floor(aTroikaGlyphIndex / 4.0), txCols),
  floor(floor(aTroikaGlyphIndex / 4.0) / txCols)
);
vTroikaTextureUVBounds = vec4(txStartUV, vec2(txStartUV) + txUvPerSquare);
vTroikaTextureChannel = mod(aTroikaGlyphIndex, 4.0);
`;

// language=GLSL
const FRAGMENT_DEFS = `
uniform sampler2D uTroikaSDFTexture;
uniform vec2 uTroikaSDFTextureSize;
uniform float uTroikaSDFGlyphSize;
uniform float uTroikaSDFExponent;
uniform float uTroikaDistanceOffset;
uniform float uTroikaFillOpacity;
uniform float uTroikaOutlineOpacity;
uniform float uTroikaBlurRadius;
uniform vec3 uTroikaStrokeColor;
uniform float uTroikaStrokeWidth;
uniform float uTroikaStrokeOpacity;
uniform bool uTroikaSDFDebug;
varying vec2 vTroikaGlyphUV;
varying vec4 vTroikaTextureUVBounds;
varying float vTroikaTextureChannel;
varying vec2 vTroikaGlyphDimensions;

float troikaSdfValueToSignedDistance(float alpha) {
  // Inverse of exponential encoding in webgl-sdf-generator
  ${''/* TODO - there's some slight inaccuracy here when dealing with interpolated alpha values; those
    are linearly interpolated where the encoding is exponential. Look into improving this by rounding
    to nearest 2 whole texels, decoding those exponential values, and linearly interpolating the result.
  */}
  float maxDimension = max(vTroikaGlyphDimensions.x, vTroikaGlyphDimensions.y);
  float absDist = (1.0 - pow(2.0 * (alpha > 0.5 ? 1.0 - alpha : alpha), 1.0 / uTroikaSDFExponent)) * maxDimension;
  float signedDist = absDist * (alpha > 0.5 ? -1.0 : 1.0);
  return signedDist;
}

float troikaGlyphUvToSdfValue(vec2 glyphUV) {
  vec2 textureUV = mix(vTroikaTextureUVBounds.xy, vTroikaTextureUVBounds.zw, glyphUV);
  vec4 rgba = texture2D(uTroikaSDFTexture, textureUV);
  float ch = floor(vTroikaTextureChannel + 0.5); //NOTE: can't use round() in WebGL1
  return ch == 0.0 ? rgba.r : ch == 1.0 ? rgba.g : ch == 2.0 ? rgba.b : rgba.a;
}

float troikaGlyphUvToDistance(vec2 uv) {
  return troikaSdfValueToSignedDistance(troikaGlyphUvToSdfValue(uv));
}

float troikaGetAADist() {
  ${''/*
    When the standard derivatives extension is available, we choose an antialiasing alpha threshold based
    on the potential change in the SDF's alpha from this fragment to its neighbor. This strategy maximizes 
    readability and edge crispness at all sizes and screen resolutions.
  */}
  #if defined(GL_OES_standard_derivatives) || __VERSION__ >= 300
  return length(fwidth(vTroikaGlyphUV * vTroikaGlyphDimensions)) * 0.5;
  #else
  return vTroikaGlyphDimensions.x / 64.0;
  #endif
}

float troikaGetFragDistValue() {
  vec2 clampedGlyphUV = clamp(vTroikaGlyphUV, 0.5 / uTroikaSDFGlyphSize, 1.0 - 0.5 / uTroikaSDFGlyphSize);
  float distance = troikaGlyphUvToDistance(clampedGlyphUV);
 
  // Extrapolate distance when outside bounds:
  distance += clampedGlyphUV == vTroikaGlyphUV ? 0.0 : 
    length((vTroikaGlyphUV - clampedGlyphUV) * vTroikaGlyphDimensions);

  ${''/* 
  // TODO more refined extrapolated distance by adjusting for angle of gradient at edge...
  // This has potential but currently gives very jagged extensions, maybe due to precision issues?
  float uvStep = 1.0 / uTroikaSDFGlyphSize;
  vec2 neighbor1UV = clampedGlyphUV + (
    vTroikaGlyphUV.x != clampedGlyphUV.x ? vec2(0.0, uvStep * sign(0.5 - vTroikaGlyphUV.y)) :
    vTroikaGlyphUV.y != clampedGlyphUV.y ? vec2(uvStep * sign(0.5 - vTroikaGlyphUV.x), 0.0) :
    vec2(0.0)
  );
  vec2 neighbor2UV = clampedGlyphUV + (
    vTroikaGlyphUV.x != clampedGlyphUV.x ? vec2(0.0, uvStep * -sign(0.5 - vTroikaGlyphUV.y)) :
    vTroikaGlyphUV.y != clampedGlyphUV.y ? vec2(uvStep * -sign(0.5 - vTroikaGlyphUV.x), 0.0) :
    vec2(0.0)
  );
  float neighbor1Distance = troikaGlyphUvToDistance(neighbor1UV);
  float neighbor2Distance = troikaGlyphUvToDistance(neighbor2UV);
  float distToUnclamped = length((vTroikaGlyphUV - clampedGlyphUV) * vTroikaGlyphDimensions);
  float distToNeighbor = length((clampedGlyphUV - neighbor1UV) * vTroikaGlyphDimensions);
  float gradientAngle1 = min(asin(abs(neighbor1Distance - distance) / distToNeighbor), PI / 2.0);
  float gradientAngle2 = min(asin(abs(neighbor2Distance - distance) / distToNeighbor), PI / 2.0);
  distance += (cos(gradientAngle1) + cos(gradientAngle2)) / 2.0 * distToUnclamped;
  */}

  return distance;
}

float troikaGetEdgeAlpha(float distance, float distanceOffset, float aaDist) {
  #if defined(IS_DEPTH_MATERIAL) || defined(IS_DISTANCE_MATERIAL)
  float alpha = step(-distanceOffset, -distance);
  #else

  float alpha = smoothstep(
    distanceOffset + aaDist,
    distanceOffset - aaDist,
    distance
  );
  #endif

  return alpha;
}
`;

// language=GLSL prefix="void main() {" suffix="}"
const FRAGMENT_TRANSFORM = `
float aaDist = troikaGetAADist();
float fragDistance = troikaGetFragDistValue();
float edgeAlpha = uTroikaSDFDebug ?
  troikaGlyphUvToSdfValue(vTroikaGlyphUV) :
  troikaGetEdgeAlpha(fragDistance, uTroikaDistanceOffset, max(aaDist, uTroikaBlurRadius));

#if !defined(IS_DEPTH_MATERIAL) && !defined(IS_DISTANCE_MATERIAL)
vec4 fillRGBA = gl_FragColor;
fillRGBA.a *= uTroikaFillOpacity;
vec4 strokeRGBA = uTroikaStrokeWidth == 0.0 ? fillRGBA : vec4(uTroikaStrokeColor, uTroikaStrokeOpacity);
if (fillRGBA.a == 0.0) fillRGBA.rgb = strokeRGBA.rgb;
gl_FragColor = mix(fillRGBA, strokeRGBA, smoothstep(
  -uTroikaStrokeWidth - aaDist,
  -uTroikaStrokeWidth + aaDist,
  fragDistance
));
gl_FragColor.a *= edgeAlpha;
#endif

if (edgeAlpha == 0.0) {
  discard;
}
`;


/**
 * Create a material for rendering text, derived from a baseMaterial
 */
function createTextDerivedMaterial(baseMaterial) {
  const textMaterial = createDerivedMaterial(baseMaterial, {
    chained: true,
    extensions: {
      derivatives: true
    },
    uniforms: {
      uTroikaSDFTexture: {value: null},
      uTroikaSDFTextureSize: {value: new Vector2()},
      uTroikaSDFGlyphSize: {value: 0},
      uTroikaSDFExponent: {value: 0},
      uTroikaTotalBounds: {value: new Vector4(0,0,0,0)},
      uTroikaClipRect: {value: new Vector4(0,0,0,0)},
      uTroikaDistanceOffset: {value: 0},
      uTroikaOutlineOpacity: {value: 0},
      uTroikaFillOpacity: {value: 1},
      uTroikaPositionOffset: {value: new Vector2()},
      uTroikaCurveRadius: {value: 0},
      uTroikaBlurRadius: {value: 0},
      uTroikaStrokeWidth: {value: 0},
      uTroikaStrokeColor: {value: new Color()},
      uTroikaStrokeOpacity: {value: 1},
      uTroikaOrient: {value: new Matrix3()},
      uTroikaUseGlyphColors: {value: true},
      uTroikaSDFDebug: {value: false}
    },
    vertexDefs: VERTEX_DEFS,
    vertexTransform: VERTEX_TRANSFORM,
    fragmentDefs: FRAGMENT_DEFS,
    fragmentColorTransform: FRAGMENT_TRANSFORM,
    customRewriter({vertexShader, fragmentShader}) {
      let uDiffuseRE = /\buniform\s+vec3\s+diffuse\b/;
      if (uDiffuseRE.test(fragmentShader)) {
        // Replace all instances of `diffuse` with our varying
        fragmentShader = fragmentShader
          .replace(uDiffuseRE, 'varying vec3 vTroikaGlyphColor')
          .replace(/\bdiffuse\b/g, 'vTroikaGlyphColor');
        // Make sure the vertex shader declares the uniform so we can grab it as a fallback
        if (!uDiffuseRE.test(vertexShader)) {
          vertexShader = vertexShader.replace(
            voidMainRegExp,
            'uniform vec3 diffuse;\n$&\nvTroikaGlyphColor = uTroikaUseGlyphColors ? aTroikaGlyphColor / 255.0 : diffuse;\n'
          );
        }
      }
      return { vertexShader, fragmentShader }
    }
  });

  // Force transparency - TODO is this reasonable?
  textMaterial.transparent = true;

  Object.defineProperties(textMaterial, {
    isTroikaTextMaterial: {value: true},

    // WebGLShadowMap reverses the side of the shadow material by default, which fails
    // for planes, so here we force the `shadowSide` to always match the main side.
    shadowSide: {
      get() {
        return this.side
      },
      set() {
        //no-op
      }
    }
  });

  return textMaterial
}

const defaultMaterial = /*#__PURE__*/ new MeshBasicMaterial({
  color: 0xffffff,
  side: DoubleSide,
  transparent: true
});
const defaultStrokeColor = 0x808080;

const tempMat4 = /*#__PURE__*/ new Matrix4();
const tempVec3a = /*#__PURE__*/ new Vector3();
const tempVec3b = /*#__PURE__*/ new Vector3();
const tempArray = [];
const origin = /*#__PURE__*/ new Vector3();
const defaultOrient = '+x+y';

function first(o) {
  return Array.isArray(o) ? o[0] : o
}

let getFlatRaycastMesh = () => {
  const mesh = new Mesh(
    new PlaneGeometry(1, 1),
    defaultMaterial
  );
  getFlatRaycastMesh = () => mesh;
  return mesh
};
let getCurvedRaycastMesh = () => {
  const mesh = new Mesh(
    new PlaneGeometry(1, 1, 32, 1),
    defaultMaterial
  );
  getCurvedRaycastMesh = () => mesh;
  return mesh
};

const syncStartEvent = { type: 'syncstart' };
const syncCompleteEvent = { type: 'synccomplete' };

const SYNCABLE_PROPS = [
  'font',
  'fontSize',
  'fontStyle',
  'fontWeight',
  'lang',
  'letterSpacing',
  'lineHeight',
  'maxWidth',
  'overflowWrap',
  'text',
  'direction',
  'textAlign',
  'textIndent',
  'whiteSpace',
  'anchorX',
  'anchorY',
  'colorRanges',
  'sdfGlyphSize'
];

const COPYABLE_PROPS = SYNCABLE_PROPS.concat(
  'material',
  'color',
  'depthOffset',
  'clipRect',
  'curveRadius',
  'orientation',
  'glyphGeometryDetail'
);

/**
 * @class Text
 *
 * A ThreeJS Mesh that renders a string of text on a plane in 3D space using signed distance
 * fields (SDF).
 */
class Text extends Mesh {
  constructor() {
    const geometry = new GlyphsGeometry();
    super(geometry, null);

    // === Text layout properties: === //

    /**
     * @member {string} text
     * The string of text to be rendered.
     */
    this.text = '';

    /**
     * @member {number|string} anchorX
     * Defines the horizontal position in the text block that should line up with the local origin.
     * Can be specified as a numeric x position in local units, a string percentage of the total
     * text block width e.g. `'25%'`, or one of the following keyword strings: 'left', 'center',
     * or 'right'.
     */
    this.anchorX = 0;

    /**
     * @member {number|string} anchorY
     * Defines the vertical position in the text block that should line up with the local origin.
     * Can be specified as a numeric y position in local units (note: down is negative y), a string
     * percentage of the total text block height e.g. `'25%'`, or one of the following keyword strings:
     * 'top', 'top-baseline', 'top-cap', 'top-ex', 'middle', 'bottom-baseline', or 'bottom'.
     */
    this.anchorY = 0;

    /**
     * @member {number} curveRadius
     * Defines a cylindrical radius along which the text's plane will be curved. Positive numbers put
     * the cylinder's centerline (oriented vertically) that distance in front of the text, for a concave
     * curvature, while negative numbers put it behind the text for a convex curvature. The centerline
     * will be aligned with the text's local origin; you can use `anchorX` to offset it.
     *
     * Since each glyph is by default rendered with a simple quad, each glyph remains a flat plane
     * internally. You can use `glyphGeometryDetail` to add more vertices for curvature inside glyphs.
     */
    this.curveRadius = 0;

    /**
     * @member {string} direction
     * Sets the base direction for the text. The default value of "auto" will choose a direction based
     * on the text's content according to the bidi spec. A value of "ltr" or "rtl" will force the direction.
     */
    this.direction = 'auto';

    /**
     * @member {string|null} font
     * URL of a custom font to be used. Font files can be in .ttf, .otf, or .woff (not .woff2) formats.
     * Defaults to Noto Sans.
     */
    this.font = null; //will use default from TextBuilder

    this.unicodeFontsURL = null; //defaults to CDN

    /**
     * @member {number} fontSize
     * The size at which to render the font in local units; corresponds to the em-box height
     * of the chosen `font`.
     */
    this.fontSize = 0.1;

    /**
     * @member {number|'normal'|'bold'}
     * The weight of the font. Currently only used for fallback Noto fonts.
     */
    this.fontWeight = 'normal';

    /**
     * @member {'normal'|'italic'}
     * The style of the font. Currently only used for fallback Noto fonts.
     */
    this.fontStyle = 'normal';

    /**
     * @member {string|null} lang
     * The language code of this text; can be used for explicitly selecting certain CJK fonts.
     */
    this.lang = null;

      /**
     * @member {number} letterSpacing
     * Sets a uniform adjustment to spacing between letters after kerning is applied. Positive
     * numbers increase spacing and negative numbers decrease it.
     */
    this.letterSpacing = 0;

    /**
     * @member {number|string} lineHeight
     * Sets the height of each line of text, as a multiple of the `fontSize`. Defaults to 'normal'
     * which chooses a reasonable height based on the chosen font's ascender/descender metrics.
     */
    this.lineHeight = 'normal';

    /**
     * @member {number} maxWidth
     * The maximum width of the text block, above which text may start wrapping according to the
     * `whiteSpace` and `overflowWrap` properties.
     */
    this.maxWidth = Infinity;

    /**
     * @member {string} overflowWrap
     * Defines how text wraps if the `whiteSpace` property is `normal`. Can be either `'normal'`
     * to break at whitespace characters, or `'break-word'` to allow breaking within words.
     * Defaults to `'normal'`.
     */
    this.overflowWrap = 'normal';

    /**
     * @member {string} textAlign
     * The horizontal alignment of each line of text within the overall text bounding box.
     */
    this.textAlign = 'left';

    /**
     * @member {number} textIndent
     * Indentation for the first character of a line; see CSS `text-indent`.
     */
    this.textIndent = 0;

    /**
     * @member {string} whiteSpace
     * Defines whether text should wrap when a line reaches the `maxWidth`. Can
     * be either `'normal'` (the default), to allow wrapping according to the `overflowWrap` property,
     * or `'nowrap'` to prevent wrapping. Note that `'normal'` here honors newline characters to
     * manually break lines, making it behave more like `'pre-wrap'` does in CSS.
     */
    this.whiteSpace = 'normal';


    // === Presentation properties: === //

    /**
     * @member {THREE.Material} material
     * Defines a _base_ material to be used when rendering the text. This material will be
     * automatically replaced with a material derived from it, that adds shader code to
     * decrease the alpha for each fragment (pixel) outside the text glyphs, with antialiasing.
     * By default it will derive from a simple white MeshBasicMaterial, but you can use any
     * of the other mesh materials to gain other features like lighting, texture maps, etc.
     *
     * Also see the `color` shortcut property.
     */
    this.material = null;

    /**
     * @member {string|number|THREE.Color} color
     * This is a shortcut for setting the `color` of the text's material. You can use this
     * if you don't want to specify a whole custom `material`. Also, if you do use a custom
     * `material`, this color will only be used for this particuar Text instance, even if
     * that same material instance is shared across multiple Text objects.
     */
    this.color = null;

    /**
     * @member {object|null} colorRanges
     * WARNING: This API is experimental and may change.
     * This allows more fine-grained control of colors for individual or ranges of characters,
     * taking precedence over the material's `color`. Its format is an Object whose keys each
     * define a starting character index for a range, and whose values are the color for each
     * range. The color value can be a numeric hex color value, a `THREE.Color` object, or
     * any of the strings accepted by `THREE.Color`.
     */
    this.colorRanges = null;

    /**
     * @member {number|string} outlineWidth
     * WARNING: This API is experimental and may change.
     * The width of an outline/halo to be drawn around each text glyph using the `outlineColor` and `outlineOpacity`.
     * Can be specified as either an absolute number in local units, or as a percentage string e.g.
     * `"12%"` which is treated as a percentage of the `fontSize`. Defaults to `0`, which means
     * no outline will be drawn unless an `outlineOffsetX/Y` or `outlineBlur` is set.
     */
    this.outlineWidth = 0;

    /**
     * @member {string|number|THREE.Color} outlineColor
     * WARNING: This API is experimental and may change.
     * The color of the text outline, if `outlineWidth`/`outlineBlur`/`outlineOffsetX/Y` are set.
     * Defaults to black.
     */
    this.outlineColor = 0x000000;

    /**
     * @member {number} outlineOpacity
     * WARNING: This API is experimental and may change.
     * The opacity of the outline, if `outlineWidth`/`outlineBlur`/`outlineOffsetX/Y` are set.
     * Defaults to `1`.
     */
    this.outlineOpacity = 1;

    /**
     * @member {number|string} outlineBlur
     * WARNING: This API is experimental and may change.
     * A blur radius applied to the outer edge of the text's outline. If the `outlineWidth` is
     * zero, the blur will be applied at the glyph edge, like CSS's `text-shadow` blur radius.
     * Can be specified as either an absolute number in local units, or as a percentage string e.g.
     * `"12%"` which is treated as a percentage of the `fontSize`. Defaults to `0`.
     */
    this.outlineBlur = 0;

    /**
     * @member {number|string} outlineOffsetX
     * WARNING: This API is experimental and may change.
     * A horizontal offset for the text outline.
     * Can be specified as either an absolute number in local units, or as a percentage string e.g. `"12%"`
     * which is treated as a percentage of the `fontSize`. Defaults to `0`.
     */
    this.outlineOffsetX = 0;

    /**
     * @member {number|string} outlineOffsetY
     * WARNING: This API is experimental and may change.
     * A vertical offset for the text outline.
     * Can be specified as either an absolute number in local units, or as a percentage string e.g. `"12%"`
     * which is treated as a percentage of the `fontSize`. Defaults to `0`.
     */
    this.outlineOffsetY = 0;

    /**
     * @member {number|string} strokeWidth
     * WARNING: This API is experimental and may change.
     * The width of an inner stroke drawn inside each text glyph using the `strokeColor` and `strokeOpacity`.
     * Can be specified as either an absolute number in local units, or as a percentage string e.g. `"12%"`
     * which is treated as a percentage of the `fontSize`. Defaults to `0`.
     */
    this.strokeWidth = 0;

    /**
     * @member {string|number|THREE.Color} strokeColor
     * WARNING: This API is experimental and may change.
     * The color of the text stroke, if `strokeWidth` is greater than zero. Defaults to gray.
     */
    this.strokeColor = defaultStrokeColor;

    /**
     * @member {number} strokeOpacity
     * WARNING: This API is experimental and may change.
     * The opacity of the stroke, if `strokeWidth` is greater than zero. Defaults to `1`.
     */
    this.strokeOpacity = 1;

    /**
     * @member {number} fillOpacity
     * WARNING: This API is experimental and may change.
     * The opacity of the glyph's fill from 0 to 1. This behaves like the material's `opacity` but allows
     * giving the fill a different opacity than the `strokeOpacity`. A fillOpacity of `0` makes the
     * interior of the glyph invisible, leaving just the `strokeWidth`. Defaults to `1`.
     */
    this.fillOpacity = 1;

    /**
     * @member {number} depthOffset
     * This is a shortcut for setting the material's `polygonOffset` and related properties,
     * which can be useful in preventing z-fighting when this text is laid on top of another
     * plane in the scene. Positive numbers are further from the camera, negatives closer.
     */
    this.depthOffset = 0;

    /**
     * @member {Array<number>} clipRect
     * If specified, defines a `[minX, minY, maxX, maxY]` of a rectangle outside of which all
     * pixels will be discarded. This can be used for example to clip overflowing text when
     * `whiteSpace='nowrap'`.
     */
    this.clipRect = null;

    /**
     * @member {string} orientation
     * Defines the axis plane on which the text should be laid out when the mesh has no extra
     * rotation transform. It is specified as a string with two axes: the horizontal axis with
     * positive pointing right, and the vertical axis with positive pointing up. By default this
     * is '+x+y', meaning the text sits on the xy plane with the text's top toward positive y
     * and facing positive z. A value of '+x-z' would place it on the xz plane with the text's
     * top toward negative z and facing positive y.
     */
    this.orientation = defaultOrient;

    /**
     * @member {number} glyphGeometryDetail
     * Controls number of vertical/horizontal segments that make up each glyph's rectangular
     * plane. Defaults to 1. This can be increased to provide more geometrical detail for custom
     * vertex shader effects, for example.
     */
    this.glyphGeometryDetail = 1;

    /**
     * @member {number|null} sdfGlyphSize
     * The size of each glyph's SDF (signed distance field) used for rendering. This must be a
     * power-of-two number. Defaults to 64 which is generally a good balance of size and quality
     * for most fonts. Larger sizes can improve the quality of glyph rendering by increasing
     * the sharpness of corners and preventing loss of very thin lines, at the expense of
     * increased memory footprint and longer SDF generation time.
     */
    this.sdfGlyphSize = null;

    /**
     * @member {boolean} gpuAccelerateSDF
     * When `true`, the SDF generation process will be GPU-accelerated with WebGL when possible,
     * making it much faster especially for complex glyphs, and falling back to a JavaScript version
     * executed in web workers when support isn't available. It should automatically detect support,
     * but it's still somewhat experimental, so you can set it to `false` to force it to use the JS
     * version if you encounter issues with it.
     */
    this.gpuAccelerateSDF = true;

    this.debugSDF = false;
  }

  /**
   * Updates the text rendering according to the current text-related configuration properties.
   * This is an async process, so you can pass in a callback function to be executed when it
   * finishes.
   * @param {function} [callback]
   */
  sync(callback) {
    if (this._needsSync) {
      this._needsSync = false;

      // If there's another sync still in progress, queue
      if (this._isSyncing) {
        (this._queuedSyncs || (this._queuedSyncs = [])).push(callback);
      } else {
        this._isSyncing = true;
        this.dispatchEvent(syncStartEvent);

        getTextRenderInfo({
          text: this.text,
          font: this.font,
          lang: this.lang,
          fontSize: this.fontSize || 0.1,
          fontWeight: this.fontWeight || 'normal',
          fontStyle: this.fontStyle || 'normal',
          letterSpacing: this.letterSpacing || 0,
          lineHeight: this.lineHeight || 'normal',
          maxWidth: this.maxWidth,
          direction: this.direction || 'auto',
          textAlign: this.textAlign,
          textIndent: this.textIndent,
          whiteSpace: this.whiteSpace,
          overflowWrap: this.overflowWrap,
          anchorX: this.anchorX,
          anchorY: this.anchorY,
          colorRanges: this.colorRanges,
          includeCaretPositions: true, //TODO parameterize
          sdfGlyphSize: this.sdfGlyphSize,
          gpuAccelerateSDF: this.gpuAccelerateSDF,
          unicodeFontsURL: this.unicodeFontsURL,
        }, textRenderInfo => {
          this._isSyncing = false;

          // Save result for later use in onBeforeRender
          this._textRenderInfo = textRenderInfo;

          // Update the geometry attributes
          this.geometry.updateGlyphs(
            textRenderInfo.glyphBounds,
            textRenderInfo.glyphAtlasIndices,
            textRenderInfo.blockBounds,
            textRenderInfo.chunkedBounds,
            textRenderInfo.glyphColors
          );

          // If we had extra sync requests queued up, kick it off
          const queued = this._queuedSyncs;
          if (queued) {
            this._queuedSyncs = null;
            this._needsSync = true;
            this.sync(() => {
              queued.forEach(fn => fn && fn());
            });
          }

          this.dispatchEvent(syncCompleteEvent);
          if (callback) {
            callback();
          }
        });
      }
    }
  }

  /**
   * Initiate a sync if needed - note it won't complete until next frame at the
   * earliest so if possible it's a good idea to call sync() manually as soon as
   * all the properties have been set.
   * @override
   */
  onBeforeRender(renderer, scene, camera, geometry, material, group) {
    this.sync();

    // This may not always be a text material, e.g. if there's a scene.overrideMaterial present
    if (material.isTroikaTextMaterial) {
      this._prepareForRender(material);
    }

    // We need to force the material to FrontSide to avoid the double-draw-call performance hit
    // introduced in Three.js r130: https://github.com/mrdoob/three.js/pull/21967 - The sidedness
    // is instead applied via drawRange in the GlyphsGeometry.
    material._hadOwnSide = material.hasOwnProperty('side');
    this.geometry.setSide(material._actualSide = material.side);
    material.side = FrontSide;
  }

  onAfterRender(renderer, scene, camera, geometry, material, group) {
    // Restore original material side
    if (material._hadOwnSide) {
      material.side = material._actualSide;
    } else {
      delete material.side; // back to inheriting from base material
    }
  }

  /**
   * Shortcut to dispose the geometry specific to this instance.
   * Note: we don't also dispose the derived material here because if anything else is
   * sharing the same base material it will result in a pause next frame as the program
   * is recompiled. Instead users can dispose the base material manually, like normal,
   * and we'll also dispose the derived material at that time.
   */
  dispose() {
    this.geometry.dispose();
  }

  /**
   * @property {TroikaTextRenderInfo|null} textRenderInfo
   * @readonly
   * The current processed rendering data for this TextMesh, returned by the TextBuilder after
   * a `sync()` call. This will be `null` initially, and may be stale for a short period until
   * the asynchrous `sync()` process completes.
   */
  get textRenderInfo() {
    return this._textRenderInfo || null
  }

  // Handler for automatically wrapping the base material with our upgrades. We do the wrapping
  // lazily on _read_ rather than write to avoid unnecessary wrapping on transient values.
  get material() {
    let derivedMaterial = this._derivedMaterial;
    const baseMaterial = this._baseMaterial || this._defaultMaterial || (this._defaultMaterial = defaultMaterial.clone());
    if (!derivedMaterial || derivedMaterial.baseMaterial !== baseMaterial) {
      derivedMaterial = this._derivedMaterial = createTextDerivedMaterial(baseMaterial);
      // dispose the derived material when its base material is disposed:
      baseMaterial.addEventListener('dispose', function onDispose() {
        baseMaterial.removeEventListener('dispose', onDispose);
        derivedMaterial.dispose();
      });
    }
    // If text outline is configured, render it as a preliminary draw using Three's multi-material
    // feature (see GlyphsGeometry which sets up `groups` for this purpose) Doing it with multi
    // materials ensures the layers are always rendered consecutively in a consistent order.
    // Each layer will trigger onBeforeRender with the appropriate material.
    if (this.outlineWidth || this.outlineBlur || this.outlineOffsetX || this.outlineOffsetY) {
      let outlineMaterial = derivedMaterial._outlineMtl;
      if (!outlineMaterial) {
        outlineMaterial = derivedMaterial._outlineMtl = Object.create(derivedMaterial, {
          id: {value: derivedMaterial.id + 0.1}
        });
        outlineMaterial.isTextOutlineMaterial = true;
        outlineMaterial.depthWrite = false;
        outlineMaterial.map = null; //???
        derivedMaterial.addEventListener('dispose', function onDispose() {
          derivedMaterial.removeEventListener('dispose', onDispose);
          outlineMaterial.dispose();
        });
      }
      return [
        outlineMaterial,
        derivedMaterial
      ]
    } else {
      return derivedMaterial
    }
  }
  set material(baseMaterial) {
    if (baseMaterial && baseMaterial.isTroikaTextMaterial) { //prevent double-derivation
      this._derivedMaterial = baseMaterial;
      this._baseMaterial = baseMaterial.baseMaterial;
    } else {
      this._baseMaterial = baseMaterial;
    }
  }

  get glyphGeometryDetail() {
    return this.geometry.detail
  }
  set glyphGeometryDetail(detail) {
    this.geometry.detail = detail;
  }

  get curveRadius() {
    return this.geometry.curveRadius
  }
  set curveRadius(r) {
    this.geometry.curveRadius = r;
  }

  // Create and update material for shadows upon request:
  get customDepthMaterial() {
    return first(this.material).getDepthMaterial()
  }
  get customDistanceMaterial() {
    return first(this.material).getDistanceMaterial()
  }

  _prepareForRender(material) {
    const isOutline = material.isTextOutlineMaterial;
    const uniforms = material.uniforms;
    const textInfo = this.textRenderInfo;
    if (textInfo) {
      const {sdfTexture, blockBounds} = textInfo;
      uniforms.uTroikaSDFTexture.value = sdfTexture;
      uniforms.uTroikaSDFTextureSize.value.set(sdfTexture.image.width, sdfTexture.image.height);
      uniforms.uTroikaSDFGlyphSize.value = textInfo.sdfGlyphSize;
      uniforms.uTroikaSDFExponent.value = textInfo.sdfExponent;
      uniforms.uTroikaTotalBounds.value.fromArray(blockBounds);
      uniforms.uTroikaUseGlyphColors.value = !isOutline && !!textInfo.glyphColors;

      let distanceOffset = 0;
      let blurRadius = 0;
      let strokeWidth = 0;
      let fillOpacity;
      let strokeOpacity;
      let strokeColor;
      let offsetX = 0;
      let offsetY = 0;

      if (isOutline) {
        let {outlineWidth, outlineOffsetX, outlineOffsetY, outlineBlur, outlineOpacity} = this;
        distanceOffset = this._parsePercent(outlineWidth) || 0;
        blurRadius = Math.max(0, this._parsePercent(outlineBlur) || 0);
        fillOpacity = outlineOpacity;
        offsetX = this._parsePercent(outlineOffsetX) || 0;
        offsetY = this._parsePercent(outlineOffsetY) || 0;
      } else {
        strokeWidth = Math.max(0, this._parsePercent(this.strokeWidth) || 0);
        if (strokeWidth) {
          strokeColor = this.strokeColor;
          uniforms.uTroikaStrokeColor.value.set(strokeColor == null ? defaultStrokeColor : strokeColor);
          strokeOpacity = this.strokeOpacity;
          if (strokeOpacity == null) strokeOpacity = 1;
        }
        fillOpacity = this.fillOpacity;
      }

      uniforms.uTroikaDistanceOffset.value = distanceOffset;
      uniforms.uTroikaPositionOffset.value.set(offsetX, offsetY);
      uniforms.uTroikaBlurRadius.value = blurRadius;
      uniforms.uTroikaStrokeWidth.value = strokeWidth;
      uniforms.uTroikaStrokeOpacity.value = strokeOpacity;
      uniforms.uTroikaFillOpacity.value = fillOpacity == null ? 1 : fillOpacity;
      uniforms.uTroikaCurveRadius.value = this.curveRadius || 0;

      let clipRect = this.clipRect;
      if (clipRect && Array.isArray(clipRect) && clipRect.length === 4) {
        uniforms.uTroikaClipRect.value.fromArray(clipRect);
      } else {
        // no clipping - choose a finite rect that shouldn't ever be reached by overflowing glyphs or outlines
        const pad = (this.fontSize || 0.1) * 100;
        uniforms.uTroikaClipRect.value.set(
          blockBounds[0] - pad,
          blockBounds[1] - pad,
          blockBounds[2] + pad,
          blockBounds[3] + pad
        );
      }
      this.geometry.applyClipRect(uniforms.uTroikaClipRect.value);
    }
    uniforms.uTroikaSDFDebug.value = !!this.debugSDF;
    material.polygonOffset = !!this.depthOffset;
    material.polygonOffsetFactor = material.polygonOffsetUnits = this.depthOffset || 0;

    // Shortcut for setting material color via `color` prop on the mesh; this is
    // applied only to the derived material to avoid mutating a shared base material.
    const color = isOutline ? (this.outlineColor || 0) : this.color;

    if (color == null) {
      delete material.color; //inherit from base
    } else {
      const colorObj = material.hasOwnProperty('color') ? material.color : (material.color = new Color());
      if (color !== colorObj._input || typeof color === 'object') {
        colorObj.set(colorObj._input = color);
      }
    }

    // base orientation
    let orient = this.orientation || defaultOrient;
    if (orient !== material._orientation) {
      let rotMat = uniforms.uTroikaOrient.value;
      orient = orient.replace(/[^-+xyz]/g, '');
      let match = orient !== defaultOrient && orient.match(/^([-+])([xyz])([-+])([xyz])$/);
      if (match) {
        let [, hSign, hAxis, vSign, vAxis] = match;
        tempVec3a.set(0, 0, 0)[hAxis] = hSign === '-' ? 1 : -1;
        tempVec3b.set(0, 0, 0)[vAxis] = vSign === '-' ? -1 : 1;
        tempMat4.lookAt(origin, tempVec3a.cross(tempVec3b), tempVec3b);
        rotMat.setFromMatrix4(tempMat4);
      } else {
        rotMat.identity();
      }
      material._orientation = orient;
    }
  }

  _parsePercent(value) {
    if (typeof value === 'string') {
      let match = value.match(/^(-?[\d.]+)%$/);
      let pct = match ? parseFloat(match[1]) : NaN;
      value = (isNaN(pct) ? 0 : pct / 100) * this.fontSize;
    }
    return value
  }

  /**
   * Translate a point in local space to an x/y in the text plane.
   */
  localPositionToTextCoords(position, target = new Vector2()) {
    target.copy(position); //simple non-curved case is 1:1
    const r = this.curveRadius;
    if (r) { //flatten the curve
      target.x = Math.atan2(position.x, Math.abs(r) - Math.abs(position.z)) * Math.abs(r);
    }
    return target
  }

  /**
   * Translate a point in world space to an x/y in the text plane.
   */
  worldPositionToTextCoords(position, target = new Vector2()) {
    tempVec3a.copy(position);
    return this.localPositionToTextCoords(this.worldToLocal(tempVec3a), target)
  }

  /**
   * @override Custom raycasting to test against the whole text block's max rectangular bounds
   * TODO is there any reason to make this more granular, like within individual line or glyph rects?
   */
  raycast(raycaster, intersects) {
    const {textRenderInfo, curveRadius} = this;
    if (textRenderInfo) {
      const bounds = textRenderInfo.blockBounds;
      const raycastMesh = curveRadius ? getCurvedRaycastMesh() : getFlatRaycastMesh();
      const geom = raycastMesh.geometry;
      const {position, uv} = geom.attributes;
      for (let i = 0; i < uv.count; i++) {
        let x = bounds[0] + (uv.getX(i) * (bounds[2] - bounds[0]));
        const y = bounds[1] + (uv.getY(i) * (bounds[3] - bounds[1]));
        let z = 0;
        if (curveRadius) {
          z = curveRadius - Math.cos(x / curveRadius) * curveRadius;
          x = Math.sin(x / curveRadius) * curveRadius;
        }
        position.setXYZ(i, x, y, z);
      }
      geom.boundingSphere = this.geometry.boundingSphere;
      geom.boundingBox = this.geometry.boundingBox;
      raycastMesh.matrixWorld = this.matrixWorld;
      raycastMesh.material.side = this.material.side;
      tempArray.length = 0;
      raycastMesh.raycast(raycaster, tempArray);
      for (let i = 0; i < tempArray.length; i++) {
        tempArray[i].object = this;
        intersects.push(tempArray[i]);
      }
    }
  }

  copy(source) {
    // Prevent copying the geometry reference so we don't end up sharing attributes between instances
    const geom = this.geometry;
    super.copy(source);
    this.geometry = geom;

    COPYABLE_PROPS.forEach(prop => {
      this[prop] = source[prop];
    });
    return this
  }

  clone() {
    return new this.constructor().copy(this)
  }
}


// Create setters for properties that affect text layout:
SYNCABLE_PROPS.forEach(prop => {
  const privateKey = '_private_' + prop;
  Object.defineProperty(Text.prototype, prop, {
    get() {
      return this[privateKey]
    },
    set(value) {
      if (value !== this[privateKey]) {
        this[privateKey] = value;
        this._needsSync = true;
      }
    }
  });
});

//=== Utility functions for dealing with carets and selection ranges ===//

/**
 * @typedef {object} TextCaret
 * @property {number} x - x position of the caret
 * @property {number} y - y position of the caret's bottom
 * @property {number} height - height of the caret
 * @property {number} charIndex - the index in the original input string of this caret's target
 *   character; the caret will be for the position _before_ that character.
 */

/**
 * Given a local x/y coordinate in the text block plane, find the nearest caret position.
 * @param {TroikaTextRenderInfo} textRenderInfo - a result object from TextBuilder#getTextRenderInfo
 * @param {number} x
 * @param {number} y
 * @return {TextCaret | null}
 */
function getCaretAtPoint(textRenderInfo, x, y) {
  let closestCaret = null;
  const rows = groupCaretsByRow(textRenderInfo);

  // Find nearest row by y first
  let closestRow = null;
  rows.forEach(row => {
    if (!closestRow || Math.abs(y - (row.top + row.bottom) / 2) < Math.abs(y - (closestRow.top + closestRow.bottom) / 2)) {
      closestRow = row;
    }
  });

  // Then find closest caret by x within that row
  closestRow.carets.forEach(caret => {
    if (!closestCaret || Math.abs(x - caret.x) < Math.abs(x - closestCaret.x)) {
      closestCaret = caret;
    }
  });
  return closestCaret
}


const _rectsCache = new WeakMap();

/**
 * Given start and end character indexes, return a list of rectangles covering all the
 * characters within that selection.
 * @param {TroikaTextRenderInfo} textRenderInfo
 * @param {number} start - index of the first char in the selection
 * @param {number} end - index of the first char after the selection
 * @return {Array<{left, top, right, bottom}> | null}
 */
function getSelectionRects(textRenderInfo, start, end) {
  let rects;
  if (textRenderInfo) {
    // Check cache - textRenderInfo is frozen so it's safe to cache based on it
    let prevResult = _rectsCache.get(textRenderInfo);
    if (prevResult && prevResult.start === start && prevResult.end === end) {
      return prevResult.rects
    }

    const {caretPositions} = textRenderInfo;

    // Normalize
    if (end < start) {
      const s = start;
      start = end;
      end = s;
    }
    start = Math.max(start, 0);
    end = Math.min(end, caretPositions.length + 1);

    // Build list of rects, expanding the current rect for all characters in a run and starting
    // a new rect whenever reaching a new line or a new bidi direction
    rects = [];
    let currentRect = null;
    for (let i = start; i < end; i++) {
      const x1 = caretPositions[i * 4];
      const x2 = caretPositions[i * 4 + 1];
      const left = Math.min(x1, x2);
      const right = Math.max(x1, x2);
      const bottom = caretPositions[i * 4 + 2];
      const top = caretPositions[i * 4 + 3];
      if (!currentRect || bottom !== currentRect.bottom || top !== currentRect.top || left > currentRect.right || right < currentRect.left) {
        currentRect = {
          left: Infinity,
          right: -Infinity,
          bottom,
          top,
        };
        rects.push(currentRect);
      }
      currentRect.left = Math.min(left, currentRect.left);
      currentRect.right = Math.max(right, currentRect.right);
    }

    // Merge any overlapping rects, e.g. those formed by adjacent bidi runs
    rects.sort((a, b) => b.bottom - a.bottom || a.left - b.left);
    for (let i = rects.length - 1; i-- > 0;) {
      const rectA = rects[i];
      const rectB = rects[i + 1];
      if (rectA.bottom === rectB.bottom && rectA.top === rectB.top && rectA.left <= rectB.right && rectA.right >= rectB.left) {
        rectB.left = Math.min(rectB.left, rectA.left);
        rectB.right = Math.max(rectB.right, rectA.right);
        rects.splice(i, 1);
      }
    }

    _rectsCache.set(textRenderInfo, {start, end, rects});
  }
  return rects
}

const _caretsByRowCache = new WeakMap();

/**
 * Group a set of carets by row of text, caching the result. A single row of text may contain carets of
 * differing positions/heights if it has multiple fonts, and they may overlap slightly across rows, so this
 * uses an assumption of "at least overlapping by half" to put them in the same row.
 * @return Array<{bottom: number, top: number, carets: TextCaret[]}>
 */
function groupCaretsByRow(textRenderInfo) {
  // textRenderInfo is frozen so it's safe to cache based on it
  let rows = _caretsByRowCache.get(textRenderInfo);
  if (!rows) {
    rows = [];
    const {caretPositions} = textRenderInfo;
    let curRow;

    const visitCaret = (x, bottom, top, charIndex) => {
      // new row if not overlapping by at least half
      if (!curRow || (top < (curRow.top + curRow.bottom) / 2)) {
        rows.push(curRow = {bottom, top, carets: []});
      }
      // expand vertical limits if necessary
      if (top > curRow.top) curRow.top = top;
      if (bottom < curRow.bottom) curRow.bottom = bottom;
      curRow.carets.push({
        x,
        y: bottom,
        height: top - bottom,
        charIndex,
      });
    };

    let i = 0;
    for (; i < caretPositions.length; i += 4) {
      visitCaret(caretPositions[i], caretPositions[i + 2], caretPositions[i + 3], i / 4);
    }
    // Add one more caret after the final char
    visitCaret(caretPositions[i - 3], caretPositions[i - 2], caretPositions[i - 1], i / 4);
  }
  _caretsByRowCache.set(textRenderInfo, rows);
  return rows
}

var troikaThreeText_esm = /*#__PURE__*/Object.freeze({
    __proto__: null,
    GlyphsGeometry: GlyphsGeometry,
    Text: Text,
    configureTextBuilder: configureTextBuilder,
    createTextDerivedMaterial: createTextDerivedMaterial,
    dumpSDFTextures: dumpSDFTextures,
    fontResolverWorkerModule: fontResolverWorkerModule,
    getCaretAtPoint: getCaretAtPoint,
    getSelectionRects: getSelectionRects,
    getTextRenderInfo: getTextRenderInfo,
    preloadFont: preloadFont,
    typesetterWorkerModule: typesetterWorkerModule
});

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */


const version = '0.0.1';
var deviceType;

const addGripInteractable = (interactable) => {
    gripInteractableHandler.addInteractable(interactable);
};

const removeGripInteractable = (interactable) => {
    gripInteractableHandler.removeInteractable(interactable);
};

const addPointerInteractable = (interactable) => {
    pointerInteractableHandler.addInteractable(interactable);
};

const removePointerInteractable = (interactable) => {
    pointerInteractableHandler.removeInteractable(interactable);
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
    inputHandler.init(container, renderer, deviceType);
    pointerInteractableHandler.init(deviceType, renderer, scene, camera,
        orbitTarget);
    gripInteractableHandler.init(deviceType, scene);
};

const update = (frame) => {
    if(deviceType == 'XR') {
        inputHandler.update(frame);
        gripInteractableHandler.update();
    }
    pointerInteractableHandler.update();
};

export { GripInteractable, gripInteractableHandler as GripInteractableHandler, inputHandler as InputHandler, PointerInteractable, pointerInteractableHandler as PointerInteractableHandler, troikaThreeText_esm as TroikaThreeText, addGripInteractable, addPointerInteractable, init, removeGripInteractable, removePointerInteractable, update, version };
