# Radio

Radio class represents a selectable radio button component.

## Constructor

### `constructor(name: string, ...styles: any[])`

Creates a new instance of the Radio class.

- `name`: The name of the radio group.
- `...styles`: Optional. Additional styles to apply to the radio button.

## Properties

- `selected`: Gets or sets the selected state of the radio button.

## Methods

- `select(): void`: Selects the radio button.
- `unselect(): void`: Unselects the radio button.

## Events

- `onChange`: Callback function for change event.
- `onSelect`: Callback function for select event.

## Notes

- Radio buttons are organized in groups based on the `name` parameter passed to the constructor.
- When one radio button in a group is selected, all other radio buttons in the same group are automatically unselected.
- Radio buttons can be styled using additional styles passed to the constructor.

