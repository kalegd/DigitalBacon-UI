# TextArea

TextArea class represents an interactive component for text input.

## Constructor

### `constructor(...styles: any[])`

Creates a new instance of the TextArea class.

- `...styles`: Optional. Additional styles to apply to the text area.

## Properties

- `onBlur`: Gets or sets the callback function for blur event.
- `onChange`: Gets or sets the callback function for change event.
- `onFocus`: Gets or sets the callback function for focus event.
- `value`: Gets or sets the text value of the text area.

## Methods

### `blur(): void`

Removes focus from the text area.

### `insertContent(content: string): void`

Inserts content at the current caret position in the text area.

- `content`: The content to insert.

### `handleKey(key: string): void`

Handles keyboard input for the text area.

- `key`: The key pressed.

## Events

- `onBlur`: Callback function for blur event.
- `onChange`: Callback function for change event.
- `onFocus`: Callback function for focus event.

