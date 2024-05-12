# Range

Slider component for selecting a value within 0 and 1

## Constructor

### `constructor(...styles: Object[])`

Creates a new instance of Range

- `...styles`: Any number of styles to apply to the component. Can be made up of either [Style](/docs/Style.md) objects or generic objects. In the case of generic objects they will each be used to instatiate a new Style object based on their parameters

## New Properties

- `value`: Current value of the range slider
- `onBlur: Function(value: Number)`: Callback function that is called when the slider is released
- `onChange: Function(value: Number)`: Callback function that is called as the slider is moved

## Defaults

- `backgroundVisible`: true
- `borderWidth`: 0.002
- `color`: 0xffffff
- `height`: 0.02
- `width`: 0.4
