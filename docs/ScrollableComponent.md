# ScrollableComponent

extends [InteractableComponent](/docs/InteractableComponent.md)

Generic component that provides ability to scroll through content when overflow is set to _scroll_

## Constructor

### `constructor(...styles: Object[])`

Creates a new instance of ScrollableComponent

- `...styles`: Any number of styles to apply to the component. Can be made up of either [Style](/docs/Style.md) objects or generic objects. In the case of generic objects they will each be used to instatiate a new Style object based on their parameters
