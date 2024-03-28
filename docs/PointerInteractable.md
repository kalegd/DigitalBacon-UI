# PointerInteractable

extends [Interactable](/docs/Interactable.md)

PointerInteractable objects provide functionality to make three.js Object3Ds interactable by the following events when triggered via pointer: `over`, `out`, `down`, `up`, `click`, `move`, and `drag`

## Constructor

### `constructor(object: Object3D)`

Creates a new instance of PointerInteractable

- `object`: The [Object3D](https://threejs.org/docs/#api/en/core/Object3D) to be associated with the PointerInteractable instance

## Methods

### `addEventListener(type: string, callback: Function, options?: { tool?: string, maxDistance?: number })`

Adds an event listener for a specific event type

- `type`: The type of the event
- `callback`: The callback function to be executed when the event occurs
- `options`: An optional object containing additional options
  - `tool`: Specifies the [interaction tool](/docs/InteractionTool.md) associated with the event listener
  - `maxDistance`: Specifies the maximum distance for the interaction

### `removeEventListener(type: string, callback: Function)`

Removes an event listener for a specific event type

- `type`: The type of the event
- `callback`: The callback function to be removed

### `isWithinReach(distance: number): boolean`

Checks if a given distance is within reach of any of the event listeners

- `distance`: The distance to check

