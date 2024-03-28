# Toggle

extends [InteractableComponent](/docs/InteractableComponent.md)

Represents a toggle component

## Constructor

### `constructor(...styles: Object[])`

Creates a new instance of Toggle

- `...styles`: Any number of styles to apply to the component. Can be made up of either [Style](/docs/Style.md) objects or generic objects. In the case of generic objects they will each be used to instatiate a new Style object based on their parameters

## Properties

- `checked`: The checked state of the toggle
- `onChange`: Callback function that can be set to handle toggle state changes

## Defaults

- `backgroundVisible`: true
- `color`: 0xffffff
- `materialColor`: 0xcccccc
- `height`: 0.02
- `width`: 0.14
