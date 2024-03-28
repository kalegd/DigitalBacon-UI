# Checkbox

extends [InteractableComponent](/docs/InteractableComponent.md)

Represents a checkbox UI element

## Constructor

### `constructor(...styles: Object[])`

Creates a new instance of Checkbox

- `...styles`: Any number of styles to apply to the component. Can be made up of either [Style](/docs/Style.md) objects or generic objects. In the case of generic objects they will each be used to instatiate a new Style object based on their parameters

## New Properties

- `checked`: The checked state of the checkbox
- `onChange`: Callback function that can be set to handle checkbox state changes

## Defaults

- `backgroundVisible`: true
- `borderWidth`: 0.002
- `color`: 0xffffff
- `height`: 0.08
- `width`: 0.08
