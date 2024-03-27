# TouchInteractable

TouchInteractable class extends the Interactable class to provide functionality specific to touch interactions.

## Constructor

### `constructor(object: any)`

Creates a new instance of the TouchInteractable class.

- `object`: The object to be associated with the TouchInteractable instance.

## Properties

- `_boundingBox: THREE.Box3`: The bounding box representing the touch interactable area.
- `_target1: object`: Internal target object used for calculations.
- `_target2: object`: Internal target object used for calculations.
- `_targets: array`: Array containing `_target1` and `_target2`.

## Methods

### `_createBoundingObject()`

Creates the bounding box object used for collision detection.

### `_getBoundingObject(): THREE.Box3`

Gets the bounding box object representing the touch interactable area.

### `intersectsSphere(sphere: THREE.Sphere): boolean`

Checks if the touch interactable intersects with a given sphere.

- `sphere`: The sphere to check intersection with.

### `intersectsObject(object: any): boolean`

Checks if the touch interactable intersects with a given object.

- `object`: The object to check intersection with.

### `getClosestPointTo(object: any): array`

Gets the closest point to the touch interactable from a given object.

- `object`: The object to find the closest point to.

Returns an array containing the closest points calculated.

