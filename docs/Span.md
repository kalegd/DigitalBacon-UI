# Span

extends [ScrollableComponent](/docs/ScrollableComponent.md)

Represents a span in UI layout. Children are displayed horizontally by default

## Constructor

### `constructor(...styles: Object[])`

Creates a new instance of Span

- `...styles`: Any number of styles to apply to the component. Can be made up of either [Style](/docs/Style.md) objects or generic objects. In the case of generic objects they will each be used to instatiate a new Style object based on their parameters

## Defaults

- `contentDirection`: row
