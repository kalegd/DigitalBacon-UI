# InteractableComponent

InteractableComponent class extends the LayoutComponent class and provides functionality for handling interactions such as pointer clicks, pointer drags, touch clicks, and touch drags.

## Constructor

### `constructor(...styles: any[])`

Creates a new instance of the InteractableComponent class.

- `...styles`: Additional styles to apply to the component.

## Properties

- `pointerInteractable: PointerInteractable`: The PointerInteractable instance associated with the component.
- `touchInteractable: TouchInteractable`: The TouchInteractable instance associated with the component.
- `onClick: function`: Callback function for pointer click events.
- `onDrag: function`: Callback function for pointer drag events.
- `onTouch: function`: Callback function for touch click events.
- `onTouchDrag: function`: Callback function for touch drag events.

## Methods

### `_createBackground()`

Creates the background for the component and sets it as the object for pointer and touch interactables.

### `_onAdded()`

Callback function invoked when the component is added to the scene or another InteractableComponent. It adds the component's interactables to the parent interactable if available, or to the respective interactable handler.

### `_onRemoved()`

Callback function invoked when the component is removed from the scene or another InteractableComponent. It removes the component's interactables from the parent interactable if available, or from the respective interactable handler.

### `_setCallback(interactable: Interactable, type: string, name: string, newCallback: function)`

Sets a callback function for a specific interaction type (click or drag) on the given interactable.

- `interactable`: The interactable to set the callback for.
- `type`: The type of interaction ('click' or 'drag').
- `name`: The name of the callback ('click' or 'drag').
- `newCallback`: The new callback function to set.

