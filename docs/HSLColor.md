# HSLColor

HSLColor class represents a utility for working with HSL (Hue, Saturation, Lightness) color space.

## Constructor

### `constructor(radius?: number)`

Creates a new instance of the HSLColor class.

- `radius`: Optional. The radius of the color wheel. Default is 0.1.

## Properties

- `onBlur`: Gets or sets the blur event handler.
- `onChange`: Gets or sets the change event handler.
- `radius`: Gets or sets the radius of the color wheel.

## Methods

### `getColorTexture(): Texture`

Returns the color texture used in the HSLColor instance.

### `getLightnessTexture(): Texture`

Returns the lightness texture used in the HSLColor instance.

### `getXY(radius: number): [number, number]`

Returns the cartesian coordinates `[x, y]` from polar coordinates based on the specified radius.

### `getLightness(): number`

Returns the lightness value of the color.

### `setFromHSL(hsl: { h: number, s: number, l: number }): void`

Sets the HSL values from an object with `h`, `s`, and `l` properties.

### `selectColorFromXY(x: number, y: number): string | null`

Selects a color based on the cartesian coordinates `(x, y)` on the color wheel.

### `selectLightnessFromXY(x: number, y: number): string | null`

Selects a lightness value based on the cartesian coordinates `(x, y)` on the lightness bar.

### `getColor(): string`

Returns the current color as a hexadecimal string.

## Events

### `onBlur(color: string)`

Fired when the color selection is blurred. Returns the selected color as a hexadecimal string.

### `onChange(color: string)`

Fired when the color selection is changed. Returns the selected color as a hexadecimal string.

