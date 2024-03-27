# HueSaturationWheel

HueSaturationWheel class extends the Image class and represents a UI element for selecting colors using a hue-saturation wheel.

## Constructor

### `constructor(texture: Texture, ...styles: any[])`

Creates a new instance of the HueSaturationWheel class.

- `texture`: The texture to use for the image.
- `...styles`: Additional styles to apply to the hue-saturation wheel.

## Methods

### `_createBackground()`

Creates the background for the hue-saturation wheel. Sets the border radius to half of the minimum of computed height and width.

