# Radio

extends [InteractableComponent](/docs/InteractableComponent.md)

Selectable radio button component

## Constructor

### `constructor(name: string, ...styles: Object[])`

Creates a new instance of Radio

- `name`: The name of the radio group
- `...styles`: Any number of styles to apply to the component. Can be made up of either [Style](/docs/Style.md) objects or generic objects. In the case of generic objects they will each be used to instatiate a new Style object based on their parameters

## New Properties

- `selected`: The selected state of the radio button
- `onChange: Function(selected: boolean)`: Callback function for change event
- `onSelect`: Callback function for select event

## Defaults

- `backgroundVisible`: true
- `borderWidth`: 0.002
- `color`: 0xffffff
- `height`: 0.08
- `width`: 0.08

## Methods

- `select(): void`: Selects the radio button
- `unselect(): void`: Unselects the radio button

## Notes

- Radio buttons are organized in groups based on the `name` parameter passed to the constructor
- When one radio button in a group is selected, all other radio buttons in the same group are automatically unselected

