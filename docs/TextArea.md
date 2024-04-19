# TextArea

extends [ScrollableComponent](/docs/ScrollableComponent.md)

Component for multi-line text input

## Constructor

### `constructor(...styles: Object[])`

Creates a new instance of TextArea

- `...styles`: Any number of styles to apply to the component. Can be made up of either [Style](/docs/Style.md) objects or generic objects. In the case of generic objects they will each be used to instatiate a new Style object based on their parameters

## New Properties

- `onBlur`: Callback function that provides the text content when editing is finished
- `onChange`: Callback function that provides the text content when editing is updated
- `onFocus`: Callback function that is called when the user initiates editing for the component
- `placeholder`: An optional short hint that describes the expected value of the TextArea
- `value`: The current text content

## Defaults

- `alignItems`: start
- `backgroundVisible`: true
- `borderWidth`: 0.002
- `color`: 0x000000
- `justifyContent`: start
- `fontSize`: 0.06
- `overflow`: scroll
- `paddingLeft`: 0.01
- `height`: 0.1
- `width`: 0.4

## Methods

### `blur(): void`

Removes focus from the text area
