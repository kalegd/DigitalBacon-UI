# Interactable

Interactable objects provide functionality to make three.js Object3Ds interactable by the following events: `over`, `out`, `down`, `up`, `click`, `move`, and `drag`

## Constructor

### `constructor(object: Object3D)`

Creates a new instance of Interactable

- `object`: The [Object3D](https://threejs.org/docs/#api/en/core/Object3D) to be associated with the Interactable instance

## Properties

- `children: Set`: A set containing child interactables

## Methods

### `addEventListener(type: string, callback: Function, options?: { tool?: string })`

Adds an event listener for a specific event type

- `type`: The type of the event
- `callback`: The callback function to be executed when the event occurs
- `options`: An optional object containing additional options
  - `tool`: Specifies the interaction tool associated with the event listener

### `removeEventListener(type: string, callback: Function)`

Removes an event listener for a specific event type

- `type`: The type of the event
- `callback`: The callback function to be removed

### `capture(owner: any)`

Captures an interactable object

- `owner`: The owner of the interactable object to be captured. Provided in event listener callbacks

### `isCapturedBy(owner: any): boolean`

Checks if the interactable object is captured by a specific owner

- `owner`: The owner to check

### `getCallbacksLength(tool?: string): number`

Gets the number of event callbacks registered

- `tool`: Optional. Specifies the interaction tool

### `supportsTool(): boolean`

Checks if the interactable object supports the current interaction tool

### `isOnlyGroup(): boolean`

Checks if the interactable object is only a group with no callbacks

### `getObject(): Object3D`

Gets the associated Object3D

### `getState(): string`

Gets the current state of the interactable object

### `setObject(object: Object3D)`

Sets the associated object

- `object`: The object to set

### `setStateCallback(callback: Function)`

Sets a callback function to be executed when the state changes

- `callback`: The callback function

### `setHoveredCallback(callback: Function)`

Sets a callback function to be executed when hovered

- `callback`: The callback function

### `addChild(interactable: Interactable)`

Adds a child interactable object

- `interactable`: The child interactable object to add

### `addChildren(interactables: Interactable[])`

Adds multiple child interactable objects

- `interactables`: An array of child interactable objects to add

### `removeChild(interactable: Interactable)`

Removes a child interactable object

- `interactable`: The child interactable object to remove

### `removeChildren(interactables: Interactable[])`

Removes multiple child interactable objects

- `interactables`: An array of child interactable objects to remove
