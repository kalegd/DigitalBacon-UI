# GripInteractable

extends [Interactable](/docs/Interactable.md)

GripInteractable objects provide functionality to make three.js Object3Ds interactable by the following events when triggered via grip: `over`, `out`, `down`, `up`, `click`, `move`, and `drag`

## Constructor

### `constructor(object: Object3D)`

Creates a new instance of GripInteractable

- `object`: The [Object3D](https://threejs.org/docs/#api/en/core/Object3D) to be associated with the GripInteractable instance

## Notes

- GripInteractables have no functionality for Pointer and Touch Screen users as there is no concept of a spatial grip for those hardware platforms
