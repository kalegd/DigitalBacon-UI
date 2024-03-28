# Keyboard

extends [InteractableComponent](/docs/InteractableComponent.md)

A virtual keyboard for XR Users

## Properties

- `types`: An object containing special keyboard input types
  - `NUMBER`: Represents the number keyboard type
- `onPopup`: A callback function that can be provided to listen for whenever the keyboard pops up

## Methods

### `register(component: UIComponent, type?: string): void`

Registers a component for the keyboard to control input of

- `component`: The component to register
- `type`: Optional. The type of keyboard layout to use. Default is the standard layout

### `unregister(component: UIComponent): void`

Unregisters a component from the keyboard

- `component`: The component to unregister

### `setupGripInteractable(scene: Object3D): void`

Sets up grip interactable functionality for the keyboard

- `scene`: The scene to attach the keyboard to upon release
