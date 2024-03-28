# HSLColor

HSLColor objects provide 2 UI components for selecting colors with HSL (Hue, Saturation, Lightness) color space

## Constructor

### `constructor(radius?: number)`

Creates a new instance of HSLColor

- `radius`: Optional. The radius of the color wheel. Default is 0.1

## Properties

- `hueSaturationWheel`: An [Image](/docs/Image.md) component with interactive handlers added to select the hue and saturation
- `lightnessBar`: An [Image](/docs/Image.md) component with interactive handlers added to select the lightness
- `onBlur`: The blur event handler that will be called if set when an interaction to select color ends
- `onChange`: The change event handler that will be called if set during an interaction to select color
- `radius`: The radius of the color wheel

## Methods

### `setFromHSL(hsl: { h: number, s: number, l: number }): void`

Sets the HSL values from an object with `h`, `s`, and `l` properties

### `getColor(): string`

Returns the current color as an integer that equals the hexadecimal value of the new color

## Events

### `onBlur(color: string)`

Fired when the color selection is blurred. Returns the selected color as an integer that equals the hexadecimal value of the new color

### `onChange(color: string)`

Fired when the color selection is changed. Returns the selected color as an integer that equals the hexadecimal value of the new color
