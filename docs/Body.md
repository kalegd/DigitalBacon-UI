# Body

extends [ScrollableComponent](/docs/ScrollableComponent.md)

Represents the main body for a set of UI components

## Constructor

### `constructor(...styles: Object[])`

Creates a new instance of Body

- `...styles`: Any number of styles to apply to the body. Can be made up of either [Style](/docs/Style.md) objects or generic objects. In the case of generic objects they will each be used to instatiate a new Style object based on their parameters

## Defaults

- `backgroundVisible`: true
- `bypassContentPositioning`: true
- `height`: 1
- `width`: 1
