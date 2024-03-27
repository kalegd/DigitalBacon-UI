# Style Class API Documentation

## Table of Contents

- [Constructor](#constructor)
- [Properties](#properties)
- [Methods](#methods)

---

## Constructor

### `constructor(style)`

Creates a new Style object with the provided style properties.

#### Parameters

- `style` (Object): Optional. An object containing style properties.

---

## Properties

### Getters

- `alignItems`: (String) Gets the alignment of items along the cross-axis.
- `backgroundVisible`: (Boolean) Indicates if background is visible.
- `borderMaterial`: (String) Gets the material used for borders.
- `borderRadius`: (Number) Gets the radius of the border.
- `borderBottomLeftRadius`: (Number) Gets the radius of the bottom-left corner of the border.
- `borderBottomRightRadius`: (Number) Gets the radius of the bottom-right corner of the border.
- `borderTopLeftRadius`: (Number) Gets the radius of the top-left corner of the border.
- `borderTopRightRadius`: (Number) Gets the radius of the top-right corner of the border.
- `borderWidth`: (Number) Gets the width of the border.
- `color`: (String) Gets the color of the element.
- `contentDirection`: (String) Gets the direction of content layout.
- `font`: (String) Gets the font of the text.
- `fontSize`: (Number) Gets the size of the font.
- `glassmorphism`: (Boolean) Indicates if glassmorphism effect is applied.
- `height`: (Number) Gets the height of the element.
- `justifyContent`: (String) Gets the alignment of content along the main axis.
- `margin`: (Number) Gets the margin of the element.
- `marginBottom`: (Number) Gets the bottom margin of the element.
- `marginLeft`: (Number) Gets the left margin of the element.
- `marginRight`: (Number) Gets the right margin of the element.
- `marginTop`: (Number) Gets the top margin of the element.
- `material`: (String) Gets the material of the element.
- `materialColor`: (String) Gets the color of the material.
- `maxHeight`: (Number) Gets the maximum height of the element.
- `maxWidth`: (Number) Gets the maximum width of the element.
- `minHeight`: (Number) Gets the minimum height of the element.
- `minWidth`: (Number) Gets the minimum width of the element.
- `opacity`: (Number) Gets the opacity of the element.
- `overflow`: (String) Gets the overflow behavior of the element.
- `padding`: (Number) Gets the padding of the element.
- `paddingBottom`: (Number) Gets the bottom padding of the element.
- `paddingLeft`: (Number) Gets the left padding of the element.
- `paddingRight`: (Number) Gets the right padding of the element.
- `paddingTop`: (Number) Gets the top padding of the element.
- `textAlign`: (String) Gets the alignment of text within the element.
- `textureFit`: (String) Gets the fit type of the texture.
- `width`: (Number) Gets the width of the element.

### Setters

- `alignItems`: (String) Sets the alignment of items along the cross-axis.
- `backgroundVisible`: (Boolean) Sets the visibility of the background.
- `borderMaterial`: (String) Sets the material used for borders.
- `borderRadius`: (Number) Sets the radius of the border.
- `borderBottomLeftRadius`: (Number) Sets the radius of the bottom-left corner of the border.
- `borderBottomRightRadius`: (Number) Sets the radius of the bottom-right corner of the border.
- `borderTopLeftRadius`: (Number) Sets the radius of the top-left corner of the border.
- `borderTopRightRadius`: (Number) Sets the radius of the top-right corner of the border.
- `borderWidth`: (Number) Sets the width of the border.
- `color`: (String) Sets the color of the element.
- `contentDirection`: (String) Sets the direction of content layout.
- `font`: (String) Sets the font of the text.
- `fontSize`: (Number) Sets the size of the font.
- `glassmorphism`: (Boolean) Sets whether glassmorphism effect is applied.
- `height`: (Number) Sets the height of the element.
- `justifyContent`: (String) Sets the alignment of content along the main axis.
- `margin`: (Number) Sets the margin of the element.
- `marginBottom`: (Number) Sets the bottom margin of the element.
- `marginLeft`: (Number) Sets the left margin of the element.
- `marginRight`: (Number) Sets the right margin of the element.
- `marginTop`: (Number) Sets the top margin of the element.
- `material`: (String) Sets the material of the element.
- `materialColor`: (String) Sets the color of the material.
- `maxHeight`: (Number) Sets the maximum height of the element.
- `maxWidth`: (Number) Sets the maximum width of the element.
- `minHeight`: (Number) Sets the minimum height of the element.
- `minWidth`: (Number) Sets the minimum width of the element.
- `opacity`: (Number) Sets the opacity of the element.
- `overflow`: (String) Sets the overflow behavior of the element.
- `padding`: (Number) Sets the padding of the element.
- `paddingBottom`: (Number) Sets the bottom padding of the element.
- `paddingLeft`: (Number) Sets the left padding of the element.
- `paddingRight`: (Number) Sets the right padding of the element.
- `paddingTop`: (Number) Sets the top padding of the element.
- `textAlign`: (String) Sets the alignment of text within the element.
- `textureFit`: (String) Sets the fit type of the texture.
- `width`: (Number) Sets the width of the element.

---

## Methods

### `addUpdateListener(callback)`

Adds a listener function to be called when any style property is updated.

#### Parameters

- `callback` (Function): The function to be called when a style property is updated.

---

### `removeUpdateListener(callback)`

Removes a previously added listener function.

#### Parameters

- `callback` (Function): The function to be removed as a listener.

---

