# LayoutComponent Class

## Description
The `LayoutComponent` class represents a component that handles layout for UI elements.

## Constructor
### `constructor(...styles)`
- **Parameters:**
  - `...styles`: Optional. Additional styles to apply.
- **Description:** Constructs a new `LayoutComponent` instance.

## Properties
- `alignItems`: String. The alignment of items along the cross-axis.
- `backgroundVisible`: Boolean. Indicates whether the background is visible.
- `borderMaterial`: THREE.Material. The material for the border.
- `borderRadius`: Number. The radius of the border.
- `borderWidth`: Number. The width of the border.
- `contentDirection`: String. The direction of content flow.
- `justifyContent`: String. The alignment of items along the main axis.
- `margin`: Number. The margin around the component.
- `material`: THREE.Material. The material used for rendering.
- `overflow`: String. The overflow behavior.
- `padding`: Number. The padding around the content.
- `height`: String. The height of the component.
- `width`: String. The width of the component.

## Methods
- `updateLayout()`: Updates the layout of the component and its children.
- `updateClippingPlanes(recursive)`: Updates the clipping planes for the component.
  - **Parameters:**
    - `recursive`: Boolean. Indicates whether to update recursively.
- `add(object)`: Adds an object to the component.
  - **Parameters:**
    - `object`: The object to add.
- `remove(object)`: Removes an object from the component.
  - **Parameters:**
    - `object`: The object to remove.

## Static Methods
- `createShape(width, height, topLeftRadius, topRightRadius, bottomLeftRadius, bottomRightRadius)`: Creates a shape with rounded corners.
  - **Parameters:**
    - `width`: Number. The width of the shape.
    - `height`: Number. The height of the shape.
    - `topLeftRadius`: Number. The radius of the top-left corner.
    - `topRightRadius`: Number. The radius of the top-right corner.
    - `bottomLeftRadius`: Number. The radius of the bottom-left corner.
    - `bottomRightRadius`: Number. The radius of the bottom-right corner.
  - **Returns:** THREE.Shape. The created shape.

