# Image

Image class represents an interactive component for displaying images.

## Constructor

### `constructor(url: string | Texture, ...styles: any[])`

Creates a new instance of the Image class.

- `url`: The URL of the image or a Three.js Texture object.
- `...styles`: Optional. Additional styles to apply to the image.

## Properties

- `textureFit`: Gets or sets the fit mode of the image texture.

## Methods

### `updateLayout(): void`

Updates the layout of the image.

### `updateTexture(url: string | Texture): void`

Updates the texture of the image.

- `url`: The URL of the image or a Three.js Texture object.

## Events

None

