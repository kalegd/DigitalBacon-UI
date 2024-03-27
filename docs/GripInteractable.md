# GripInteractable

GripInteractable class extends the Interactable class to provide functionality specific to grip interactions.

## Constructor

### `constructor(object: any)`

Creates a new instance of the GripInteractable class.

- `object`: The object to be associated with the GripInteractable instance.

## Properties

- `_boundingBox: THREE.Box3`: The bounding box representing the grip interactable area.

## Methods

### `_createBoundingObject()`

Creates the bounding box object used for collision detection.

### `_getBoundingObject(): THREE.Box3`

Gets the bounding box object representing the grip interactable area.

### `intersectsSphere(sphere: THREE.Sphere): boolean`

Checks if the grip interactable intersects with a given sphere.

- `sphere`: The sphere to check intersection with.

### `distanceToSphere(sphere: THREE.Sphere): number`

Calculates the distance from the grip interactable to a given sphere.

- `sphere`: The sphere to calculate the distance to.

