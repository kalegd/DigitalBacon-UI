# PointerInteractable

PointerInteractable class extends the Interactable class to provide functionality specific to pointer interactions.

## Constructor

### `constructor(object: any)`

Creates a new instance of the PointerInteractable class.

- `object`: The object to be associated with the PointerInteractable instance.

## Properties

- `_maxDistance: number`: The maximum distance for pointer interaction.

## Methods

### `addEventListener(type: string, callback: Function, options?: { tool?: string, maxDistance?: number })`

Adds an event listener for a specific event type.

- `type`: The type of the event.
- `callback`: The callback function to be executed when the event occurs.
- `options`: An optional object containing additional options.
  - `tool`: Specifies the interaction tool associated with the event listener.
  - `maxDistance`: Specifies the maximum distance for the interaction.

### `removeEventListener(type: string, callback: Function)`

Removes an event listener for a specific event type.

- `type`: The type of the event.
- `callback`: The callback function to be removed.

### `dispatchEvent(type: string, e: any)`

Dispatches an event of the specified type.

- `type`: The type of the event.
- `e`: The event object to be dispatched.

### `isWithinReach(distance: number): boolean`

Checks if a given distance is within reach of the pointer interaction.

- `distance`: The distance to check.

