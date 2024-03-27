# ScrollableComponent

ScrollableComponent class extends the InteractableComponent class and provides functionality for creating scrollable UI components.

## Constructor

### `constructor(...styles: any[])`

Creates a new instance of the ScrollableComponent class.

- `...styles`: Additional styles to apply to the component.

## Properties

- `scrollAmount: number`: The amount of scroll performed.
- `_scrollBoundsMin: THREE.Vector2`: The minimum bounds for scrolling.
- `_scrollBoundsMax: THREE.Vector2`: The maximum bounds for scrolling.

## Methods

### `updateLayout()`

Updates the layout of the component and scroll interactables.

### `handleScroll(owner: any, closestPoint: THREE.Vector3)`

Handles scroll behavior for pointer interactions.

- `owner`: The owner of the interaction.
- `closestPoint`: The closest point of the interaction.

### `handleTouchScroll(owner: any, interactable: Interactable)`

Handles scroll behavior for touch interactions.

- `owner`: The owner of the interaction.
- `interactable`: The interactable component.

### `clearScroll(owner: any)`

Clears the scroll behavior.

- `owner`: The owner of the interaction.

### `_boundScrollPosition(axis: string)`

Bounds the scroll position based on the specified axis.

- `axis`: The axis ('x' or 'y').

### `_getScrollableAncestor()`

Returns the scrollable ancestor of the component.

### `_scroll(axis: string, closestPoint: THREE.Vector3)`

Performs scroll action along the specified axis.

- `axis`: The axis ('x' or 'y').
- `closestPoint`: The closest point of the interaction.

### `_updateScrollable()`

Updates the scrollable state of the component.

### `_updateScrollInteractables()`

Updates the scroll interactables based on the scrollable state.

### `_pointerClick(e: Event)`

Handles pointer click events.

- `e`: The event object.

### `_pointerDrag(e: Event)`

Handles pointer drag events.

- `e`: The event object.

### `_touch(e: Event)`

Handles touch events.

- `e`: The event object.

### `_touchDrag(e: Event)`

Handles touch drag events.

- `e`: The event object.

### `_setCallback(interactable: Interactable, type: string, name: string, newCallback: function)`

Sets a callback function for a specific interaction type.

- `interactable`: The interactable component.
- `type`: The interaction type ('click' or 'drag').
- `name`: The name of the callback.
- `newCallback`: The new callback function.

