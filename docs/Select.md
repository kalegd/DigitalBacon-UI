# Select

extends [ScrollableComponent](/docs/ScrollableComponent.md)

Dropdown selection component

## Constructor

### `constructor(...styles: Object[])`

Creates a new instance of Select

- `...styles`: Any number of styles to apply to the component. Can be made up of either [Style](/docs/Style.md) objects or generic objects. In the case of generic objects they will each be used to instatiate a new Style object based on their parameters

## New Properties

- `value`: Current selected value of the dropdown
- `maxDisplayOptions`: Maximum number of options to display in the dropdown
- `onChange`: Callback function for when the selected value changes

## Methods

- `addOptions(...options: string[])`: Adds options to the dropdown
- `hideOptions()`: Hides the dropdown options
