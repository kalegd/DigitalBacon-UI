# TextInput

TextInput class represents an interactive component for single-line text input.

## Constructor

### `constructor(...styles: any[])`

Creates a new instance of the TextInput class.

- `...styles`: Optional. Additional styles to apply to the text input.

## Properties

- `value`: Gets or sets the text value of the text input.

## Methods

### `blur(): void`

Removes focus from the text input.

### `insertContent(content: string): void`

Inserts content at the current caret position in the text input.

- `content`: The content to insert.

## Events

- `onChange`: Callback function for change event.

## Inherited Properties and Methods

TextInput class inherits properties and methods from the TextArea class.

## Additional Notes

- TextInput class inherits behavior and appearance from the TextArea class, but it is optimized for single-line text input.
- TextInput handles keyboard input for single-line text editing, supporting navigation with arrow keys, deletion, and pasting text.

