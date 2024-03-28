# TouchInteractable

extends [Interactable](/docs/Interactable.md)

TouchInteractable objects provide functionality to make three.js Object3Ds interactable by the following events when triggered via spatial touch: `over`, `out`, `down`, `up`, `click`, `move`, and `drag`

## Constructor

### `constructor(object: Object3D)`

Creates a new instance of TouchInteractable

- `object`: The [Object3D](https://threejs.org/docs/#api/en/core/Object3D) to be associated with the TouchInteractable instance

## Methods

### `getClosestPointTo(object: Object3D): array`

Gets the closest point of the touch interactable and the provided object

- `object`: The object to find the closest point to

Returns an array of size 2 containing the closest points calculated. The first value is the closest point of the interactable's object. The second value is the closest point of the provided object

## Notes

- TouchInteractables have no functionality for Pointer and Touch Screen users as there is no concept of a spatial touch for those hardware platforms
