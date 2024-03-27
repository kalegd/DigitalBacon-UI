# PointerInteractableHandler

PointerInteractableHandler class extends InteractableHandler to manage interactions with pointer-based devices in a scene.

## Constructor

### `constructor()`

Creates a new instance of the PointerInteractableHandler class.

## Methods

- `init(renderer: THREE.Renderer, scene: THREE.Scene, camera: THREE.Camera, orbitTarget: THREE.Object3D)`: Initializes the PointerInteractableHandler with the specified renderer, scene, camera, and orbit target.
- `_getXRCursor(hand: string)`: Retrieves or creates an XR cursor for the specified handedness.
- `_getRaycaster()`: Retrieves the raycaster for pointer-based devices.
- `_getXRRaycaster(xrController: THREE.Object3D)`: Retrieves or creates the raycaster for XR controllers.
- `_isControllerPressed(option: string)`: Checks if the specified controller option is pressed.
- `_isXRControllerPressed(type: string, handedness: string)`: Checks if the XR controller of the specified type and handedness is pressed.
- `_squashInteractables(option: string, interactables: Set<Interactable>, objects: THREE.Object3D[])`: Squashes interactables and collects their associated objects.
- `_getObjectInteractable(object: THREE.Object3D)`: Retrieves the interactable associated with the specified object.
- `_raycastInteractables(controller: object, interactables: Set<Interactable>)`: Performs raycasting to detect interactables.
- `_checkClipped(object: THREE.Object3D, point: THREE.Vector3)`: Checks if the intersection point is clipped by the material's clipping planes.
- `_updateInteractables(controller: object)`: Updates interactables based on the controller's interactions.
- `_updateCursor(controller: object)`: Updates the cursor based on the controller's interactions.
- `_updateForXR()`: Updates interactables for XR-based controllers.
- `_updateForPointer()`: Updates interactables for pointer-based devices.
- `_updateForTouchScreen()`: Updates interactables for touch screen devices.

## Properties

- `_cursors`: A dictionary storing XR cursors for different handedness.
- `_ignoredInteractables`: A set storing interactables that should be ignored during raycasting.
- `_renderer`: The renderer associated with the PointerInteractableHandler.
- `_scene`: The scene associated with the PointerInteractableHandler.
- `_camera`: The camera associated with the PointerInteractableHandler.
- `_cameraFocus`: The object of focus for the camera (typically the camera itself or an orbit target).
- `_option`: The option object representing the pointer-based device.

## Notes

- The PointerInteractableHandler class extends the InteractableHandler class to provide specialized handling for pointer-based devices, such as mouse and touch input.
- It performs raycasting to detect interactables under the pointer's position and updates interactions accordingly.
- Interaction events such as hover, click, drag, etc., are triggered based on pointer interactions.
- The `_updateForPointer()` method is responsible for updating interactables for pointer-based devices.
- The `_updateForTouchScreen()` method handles interactions specific to touch screen devices.
- The `_updateForXR()` method handles interactions specific to XR controllers.

