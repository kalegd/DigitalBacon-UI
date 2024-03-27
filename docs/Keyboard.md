# Keyboard

Keyboard class represents an interactive component for virtual keyboards.

## Constructor

### `constructor(...styles: any[])`

Creates a new instance of the Keyboard class.

- `...styles`: Optional. Additional styles to apply to the keyboard.

## Properties

- `types`: An object containing keyboard types.
  - `NUMBER`: Represents the number keyboard type.

## Methods

### `register(component: any, type?: string): void`

Registers a component to the keyboard.

- `component`: The component to register.
- `type`: Optional. The type of keyboard layout to use. Default is the standard layout.

### `unregister(component: any): void`

Unregisters a component from the keyboard.

- `component`: The component to unregister.

### `setupGripInteractable(scene: any): void`

Sets up grip interactable functionality for the keyboard.

- `scene`: The scene to attach the keyboard to.

## Events

- `onPopup`: Gets or sets the callback function for popup behavior.

