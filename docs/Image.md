# Image

extends [InteractableComponent](/docs/InteractableComponent.md)

Represents an interactive component that displays images

## Constructor

### `constructor(url: string | Texture, ...styles: Object[])`

Creates a new instance of Image

- `url`: The URL of the image or a Three.js Texture object
- `...styles`: Any number of styles to apply to the component. Can be made up of either [Style](/docs/Style.md) objects or generic objects. In the case of generic objects they will each be used to instatiate a new Style object based on their parameters

## Defaults

- `textureFit`: fill

## Methods

### `updateTexture(url: string | Texture): void`

Updates the texture of the image

- `url`: The URL of the image or a three.js Texture. If three.js texture, a clone will be made of the texture unless it has the property bypassCloning set to true
