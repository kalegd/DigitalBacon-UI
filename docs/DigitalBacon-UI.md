# DigitalBacon-UI.js Module

The DigitalBacon-UI.js module provides various UI components and interaction handlers for creating interactive 3D experiences.

## Components

- `Body`: Represents the body element of the UI.
- `Checkbox`: Represents a checkbox input element.
- `Div`: Represents a generic division container element.
- `HSLColor`: Represents a color input element using HSL color model.
- `Image`: Represents an image element.
- `Keyboard`: Represents a virtual keyboard for input.
- `NumberInput`: Represents a numeric input element.
- `Radio`: Represents a radio input element.
- `Range`: Represents a range input element.
- `Select`: Represents a dropdown select element.
- `Span`: Represents a generic span container element.
- `Style`: Represents a style element for custom CSS.
- `Text`: Represents a text element.
- `TextArea`: Represents a multiline text input element.
- `TextInput`: Represents a text input element.
- `Toggle`: Represents a toggle switch element.

## Interactables

- `GripInteractable`: Represents an interactable object for grip interaction.
- `PointerInteractable`: Represents an interactable object for pointer interaction.
- `TouchInteractable`: Represents an interactable object for touch interaction.

## Handlers

- `GripInteractableHandler`: Handles grip interaction for interactable objects.
- `PointerInteractableHandler`: Handles pointer interaction for interactable objects.
- `TouchInteractableHandler`: Handles touch interaction for interactable objects.
- `DelayedClickHandler`: Handles delayed click events.

## Utilities

- `InputHandler`: Manages input events from various devices.
- `UpdateHandler`: Manages update callbacks.
- `utils`: Contains utility functions.

## Third-party Dependencies

- `ThreeMeshBVH`: Provides bounding volume hierarchy support for Three.js meshes.
- `TroikaThreeText`: Provides text rendering capabilities for Three.js.

## Functions

- `addGripInteractable(interactable)`: Adds an interactable object for grip interaction.
- `addPointerInteractable(interactable)`: Adds an interactable object for pointer interaction.
- `addTouchInteractable(interactable)`: Adds an interactable object for touch interaction.
- `removeGripInteractable(interactable)`: Removes an interactable object for grip interaction.
- `removePointerInteractable(interactable)`: Removes an interactable object for pointer interaction.
- `removeTouchInteractable(interactable)`: Removes an interactable object for touch interaction.
- `init(container, renderer, scene, camera, deviceType, orbitTarget)`: Initializes the UI components and interaction handlers.
- `update(frame)`: Updates the UI components and interaction handlers based on the frame.
- `isXR()`: Checks if the current device supports XR (Extended Reality) features.
- `isTouchDevice()`: Checks if the current device is a touch-enabled device.

## Constants

- `version`: The version of the DigitalBacon-UI.js module.

## Notes

- The DigitalBacon-UI.js module provides a comprehensive set of UI components and interaction handlers for creating immersive 3D experiences.
- It supports various input devices such as XR controllers, pointers, and touch screens.
- Developers can easily integrate UI elements and interaction handlers into their Three.js applications using this module.
- The module also includes utilities and third-party dependencies for enhanced functionality.

