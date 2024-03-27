# Interactable

Interactable class represents an object that can receive various types of interactions.

## Constructor

### `constructor(object: any)`

Creates a new instance of the Interactable class.

- `object`: The object to be associated with the Interactable instance.

## Properties

- `children: Set`: A set containing child interactable objects.
- `_hoveredOwners: Set`: A set containing owners of currently hovered interactable objects.
- `_selectedOwners: Set`: A set containing owners of currently selected interactable objects.
- `_capturedOwners: Set`: A set containing owners of currently captured interactable objects.

## Methods

### `addEventListener(type: string, callback: Function, options?: { tool?: string })`

Adds an event listener for a specific event type.

- `type`: The type of the event.
- `callback`: The callback function to be executed when the event occurs.
- `options`: An optional object containing additional options.
  - `tool`: Specifies the interaction tool associated with the event listener.

### `removeEventListener(type: string, callback: Function)`

Removes an event listener for a specific event type.

- `type`: The type of the event.
- `callback`: The callback function to be removed.

### `dispatchEvent(type: string, e: any)`

Dispatches an event of the specified type.

- `type`: The type of the event.
- `e`: The event object to be dispatched.

### `over(e: any)`

Dispatches the 'over' event.

- `e`: The event object.

### `out(e: any)`

Dispatches the 'out' event.

- `e`: The event object.

### `down(e: any)`

Dispatches the 'down' event.

- `e`: The event object.

### `up(e: any)`

Dispatches the 'up' event.

- `e`: The event object.

### `click(e: any)`

Dispatches the 'click' event.

- `e`: The event object.

### `move(e: any)`

Dispatches the 'move' event.

- `e`: The event object.

### `drag(e: any)`

Dispatches the 'drag' event.

- `e`: The event object.

### `capture(owner: any)`

Captures an interactable object.

- `owner`: The owner of the interactable object to be captured.

### `isCapturedBy(owner: any): boolean`

Checks if the interactable object is captured by a specific owner.

- `owner`: The owner to check.

### `getCallbacksLength(tool?: string): number`

Gets the number of event callbacks registered.

- `tool`: Optional. Specifies the interaction tool.

### `supportsTool(): boolean`

Checks if the interactable object supports the current interaction tool.

### `isOnlyGroup(): boolean`

Checks if the interactable object is the only group.

### `getObject(): any`

Gets the associated object.

### `getState(): string`

Gets the current state of the interactable object.

### `setObject(object: any)`

Sets the associated object.

- `object`: The object to set.

### `setState(newState: string)`

Sets the state of the interactable object.

- `newState`: The new state to set.

### `setStateCallback(callback: Function)`

Sets a callback function to be executed when the state changes.

- `callback`: The callback function.

### `setHoveredCallback(callback: Function)`

Sets a callback function to be executed when hovered.

- `callback`: The callback function.

### `addChild(interactable: Interactable)`

Adds a child interactable object.

- `interactable`: The child interactable object to add.

### `addChildren(interactables: Interactable[])`

Adds multiple child interactable objects.

- `interactables`: An array of child interactable objects to add.

### `removeChild(interactable: Interactable)`

Removes a child interactable object.

- `interactable`: The child interactable object to remove.

### `removeChildren(interactables: Interactable[])`

Removes multiple child interactable objects.

- `interactables`: An array of child interactable objects to remove.

### `reset()`

Resets the interactable object and its children.

### `addHoveredBy(owner: any)`

Adds an owner to the hovered owners set.

- `owner`: The owner to add.

### `removeHoveredBy(owner: any)`

Removes an owner from the hovered owners set.

- `owner`: The owner to remove.

### `addSelectedBy(owner: any)`

Adds an owner to the selected owners set.

- `owner`: The owner to add.

### `removeSelectedBy(owner: any)`

Removes an owner from the selected owners set.

- `owner`: The owner to remove.

