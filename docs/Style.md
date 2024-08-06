# Style Class API Documentation

## Constructor

### `constructor(style)`

Creates a new Style object with the provided style properties

- `style` (Object): Optional. An object containing style properties

## Properties

- `alignItems`: (String) Alignment of items along the cross-axis. Valid values are _start_, _center_, and _end_
- `backgroundVisible`: (Boolean) Determines if component background is visible
- `borderMaterial`: (String) Material used for border
- `borderRadius`: (Number) Radius of the border's corners
- `borderBottomLeftRadius`: (Number) Radius of the bottom-left corner of the border
- `borderBottomRightRadius`: (Number) Radius of the bottom-right corner of the border
- `borderTopLeftRadius`: (Number) Radius of the top-left corner of the border
- `borderTopRightRadius`: (Number) Radius of the top-right corner of the border
- `borderWidth`: (Number) Width of the border
- `color`: (String) Color used for text
- `contentDirection`: (String) Direction of content layout. Valid values are _column_ and _row_
- `font`: (String) URL of the font file to be used
- `fontSize`: (Number) Size of the font
- `glassmorphism`: (Boolean) Determines if the default material uses more expensive glassmorphic effects
- `height`: (Number|String) Height of the element. Can be a number, _auto_, or a percentage like _40%_
- `justifyContent`: (String) Alignment of content along the main axis. Valid values are _start_, _center_, _end_, _spaceBetween_, _spaceAround_, and _spaceEvenly_
- `margin`: (Number) Margin around the element
- `marginBottom`: (Number) Bottom margin of the element
- `marginLeft`: (Number) Left margin of the element
- `marginRight`: (Number) Right margin of the element
- `marginTop`: (Number) Top margin of the element
- `material`: (String) Material of the element
- `materialColor`: (String) Color of the material
- `maxHeight`: (Number) Maximum height of the element
- `maxWidth`: (Number) Maximum width of the element
- `minHeight`: (Number) Minimum height of the element
- `minWidth`: (Number) Minimum width of the element
- `opacity`: (Number) Opacity of the element
- `overflow`: (String) Overflow behavior of the element. Valid values are _visible_, _hidden_, and _scroll_
- `padding`: (Number) Padding around the element
- `paddingBottom`: (Number) Bottom padding of the element
- `paddingLeft`: (Number) Left padding of the element
- `paddingRight`: (Number) Right padding of the element
- `paddingTop`: (Number) Top padding of the element
- `pointerInteractableClassOverride`: (Class) Class that extends PointerInteractable and should be used in place of it for InteractableComponents
- `textAlign`: (String) Alignment of text within the element. Valid values are _left_, _center_, and _right_
- `textureFit`: (String) Determines how a texture is displayed on a material. Valid values are _cover_ and _fill_
- `width`: (Number) Width of the element. Can be a number, _auto_, or a percentage like _40%_

## Methods

### `addUpdateListener(callback)`

Adds a listener function to be called when any style property is updated

- `callback` (Function): The function to be called when a style property is updated

### `removeUpdateListener(callback)`

Removes a previously added listener function

- `callback` (Function): The function to be removed as a listener
