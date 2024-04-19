# TextInput

extends [TextArea](/docs/TextArea.md)

Component for single-line text input

## Constructor

### `constructor(...styles: Object[])`

Creates a new instance of TextInput

- `...styles`: Any number of styles to apply to the component. Can be made up of either [Style](/docs/Style.md) objects or generic objects. In the case of generic objects they will each be used to instatiate a new Style object based on their parameters

## New Properties

- `onEnter`: Callback function that provides the text content when this component is focused and the `Enter` key has been pressed
