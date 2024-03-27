# Select

Select class represents a dropdown selection component.

## Constructor

### `constructor(...styles: any[])`

Creates a new instance of the Select class.

- `...styles`: Optional. Additional styles to apply to the dropdown selection.

## Properties

- `value`: Gets or sets the current selected value of the dropdown.
- `maxDisplayOptions`: Gets or sets the maximum number of options to display in the dropdown.

## Events

- `onChange`: Callback function for when the selected value changes.

## Methods

- `addOptions(...options: string[])`: Adds options to the dropdown.
- `hideOptions()`: Hides the dropdown options.

## Notes

- The Select class represents a dropdown selection component where users can choose from a list of options.
- The `value` property represents the currently selected value in the dropdown.
- The `maxDisplayOptions` property determines the maximum number of options to display at once in the dropdown.
- Options can be added to the dropdown using the `addOptions` method, which takes a variable number of strings representing the options.
- The appearance of the dropdown can be customized using additional styles passed to the constructor.

