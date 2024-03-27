# NumberInput

NumberInput class represents an interactive component for inputting numerical values.

## Constructor

### `constructor(...styles: any[])`

Creates a new instance of the NumberInput class.

- `...styles`: Optional. Additional styles to apply to the number input.

## Properties

- `value`: Gets or sets the numerical value of the input.

## Methods

### `blur(): void`

Removes focus from the number input.

### `insertContent(content: string): void`

Inserts content at the current caret position in the number input.

- `content`: The content to insert.

## Events

- `onChange`: Callback function for change event.

## Inherited Properties and Methods

NumberInput class inherits properties and methods from the TextInput class.

## Additional Notes

- NumberInput class inherits behavior and appearance from the TextInput class but is optimized for numerical input.
- NumberInput restricts input to numbers and the decimal point, handling keyboard input accordingly.

