# NumberInput

extends [TextArea](/docs/TextArea.md)

Component for single-line numerical input

## Constructor

### `constructor(...styles: Object[])`

Creates a new instance of NumberInput

- `...styles`: Any number of styles to apply to the component. Can be made up of either [Style](/docs/Style.md) objects or generic objects. In the case of generic objects they will each be used to instatiate a new Style object based on their parameters

## New Properties

- `minValue`: The minimum valid value for this input. this.value will automatically be set to the minValue on blur if the current this.value is less than minValue
- `maxValue`: The maximum valid value for this input. this.value will automatically be set to the maxValue on blur if the current this.value is greater than maxValue
- `onEnter`: Callback function that provides the text content when this component is focused and the `Enter` key has been pressed
