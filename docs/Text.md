# Text

extends [LayoutComponent](/docs/LayoutComponent.md)

Text that can be displayed

## Constructor

### `constructor(text: string, ...styles: Object[])`

Creates a new instance of Text

- `text`: The text content to display
- `...styles`: Any number of styles to apply to the component. Can be made up of either [Style](/docs/Style.md) objects or generic objects. In the case of generic objects they will each be used to instatiate a new Style object based on their parameters

## Properties

- `text`: Gets or sets the text content of the component
- `troikaText`: Gets the [Troika Text](https://github.com/protectwise/troika/tree/main/packages/troika-three-text) instance associated with the text component
