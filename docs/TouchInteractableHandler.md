# TouchInteractableHandler

TouchInteractableHandler class extends InteractableHandler to manage interactions with touch-based controllers in a scene.

## Constructor

### `constructor()`

Creates a new instance of the TouchInteractableHandler class.

## Methods

- `init(scene: THREE.Scene)`: Initializes the TouchInteractableHandler with the specified scene.
- `_getBoundingSphere(object: THREE.Object3D)`: Calculates the bounding sphere of the specified object.
- `_isXRControllerPressed(type: string, handedness: string)`: Checks if the XR controller of the specified type and handedness is pressed.
- `_scopeInteractables(controller: object, interactables: Set<Interactable>)`: Scopes interactables based on the XR controller's bounding sphere.
- `_updateInteractables(controller: object)`: Updates interactables based on the XR controller's interactions.
- `_checkClipped(object: THREE.Object3D)`: Checks if the specified object is clipped by any clipping planes.
- `_updateForXR()`: Updates interactables for XR-based controllers.

## Properties

- `_scene`: The scene associated with the TouchInteractableHandler.
- `_skipIntersectsCheck`: A map to keep track of objects to skip intersect checks for optimization purposes.
- `_sphere`: A THREE.Sphere object used for calculating bounding spheres.
- `_box3`: A THREE.Box3 object used for calculating bounding boxes.

## Notes

- The TouchInteractableHandler class extends the InteractableHandler class to provide specialized handling for touch-based controllers, such as those used in XR environments.
- It calculates bounding spheres for XR controllers and scopes interactables based on controller positions.
- Interaction events are triggered based on controller interactions, such as pressing, releasing, dragging, etc.
- The `_updateForXR()` method is responsible for updating interactables for XR-based controllers.

