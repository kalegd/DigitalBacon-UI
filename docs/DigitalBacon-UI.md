# DigitalBacon-UI

The DigitalBacon-UI module provides various UI components and interaction handlers for creating interactive 3D experiences

## UI Components

- [Body](/docs/Body.md)
- [Checkbox](/docs/Checkbox.md)
- [Div](/docs/Div.md)
- [HSLColor](/docs/HSLColor.md)
- [Image](/docs/Image.md)
- [Keyboard](/docs/Keyboard.md)
- [NumberInput](/docs/NumberInput.md)
- [Radio](/docs/Radio.md)
- [Range](/docs/Range.md)
- [Select](/docs/Select.md)
- [Span](/docs/Span.md)
- [Style](/docs/Style.md)
- [Text](/docs/Text.md)
- [TextArea](/docs/TextArea.md)
- [TextInput](/docs/TextInput.md)
- [Toggle](/docs/Toggle.md)

## Interactables

- [GripInteractable](/docs/GripInteractable.md)
- [PointerInteractable](/docs/PointerInteractable.md)
- [TouchInteractable](/docs/TouchInteractable.md)

## Handlers

- [GripInteractableHandler](/docs/GripInteractableHandler.md)
- [PointerInteractableHandler](/docs/PointerInteractableHandler.md)
- [TouchInteractableHandler](/docs/TouchInteractableHandler.md)
- [DelayedClickHandler](/docs/DelayedClickHandler.md)
- [InputHandler](/docs/InputHandler.md)
- [InteractionToolHandler](/docs/InteractionToolHandler.md)
- [UpdateHandler](/docs/UpdateHandler.md)

## Utilities

- [utils](/docs/utils.md)

## Third-party Dependencies

- [ThreeMeshBVH](https://github.com/gkjohnson/three-mesh-bvh): Provides bounding volume hierarchy support for Three.js meshes
- [TroikaThreeText](https://github.com/protectwise/troika/tree/main/packages/troika-three-text): Provides text rendering capabilities for Three.js

## Functions

- `addGripInteractable(interactable)`: Adds a grip interactable object to the appropriate handler
- `addPointerInteractable(interactable)`: Adds a pointer interactable object to the appropriate handler
- `addTouchInteractable(interactable)`: Adds a touch interactable object to the appropriate handler
- `removeGripInteractable(interactable)`: Removes a grip interactable object from the appropriate handler
- `removePointerInteractable(interactable)`: Removes a pointer interactable object from the appropriate handler
- `removeTouchInteractable(interactable)`: Removes a touch interactable object from the appropriate handler
- `init(container, renderer, scene, camera, ?deviceType, ?orbitTarget)`: Initializes the UI components and interaction handlers. If device type is not provided, DigitalBacon-UI will determine device type using it's default mechanism
- `update(frame)`: Updates the UI components and interaction handlers based on the frame

## Constants

- `DeviceTypes`: Enum with values of POINTER, TOUCH\_SCREEN, XR, and active
- `Handedness`: Enum with values of LEFT and RIGHT. Also has helper function otherHand(hand) that returns the other value
- `InteractableStates`: Enum with values of IDLE, DISABLED, HOVERED, and SELECTED
- `XRInputDeviceTypes`: Enum with values of CONTROLLER, HAND, and OTHER
- `version`: The release version of this library

## Notes

- The DigitalBacon-UI.js module provides a comprehensive set of UI components and interaction handlers for creating immersive 3D experiences
- It supports various input devices such as XR controllers, pointers, and touch screens
- Developers can easily integrate UI elements and interaction handlers into their three.js applications using this module
- The module also includes utilities and third-party dependencies for enhanced functionality
- This documentation was originally written by ChatGPT
