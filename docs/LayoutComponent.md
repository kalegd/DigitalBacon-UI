# LayoutComponent Class

extends [UIComponent](/docs/UIComponent.md)

Generic Component that provides ability to organize and display UI Components based on provided attributes and Style objects

## Constructor

### `constructor(...styles: Object[])`

Creates a new instance of LayoutComponent

- `...styles`: Any number of styles to apply to the component. Can be made up of either [Style](/docs/Style.md) objects or generic objects. In the case of generic objects they will each be used to instatiate a new Style object based on their parameters

## New Properties

- `bypassContentPositioning`: When added to another parent component, if this property is set to true the placement of this component will not be automatically determined by the parent. Defaults to false

## Defaults

- `alignItems`: center
- `backgroundVisible`: false
- `borderMaterial`: White double-sided THREE.MeshBasicMaterial
- `borderRadius`: 0
- `borderWidth`: 0
- `contentDirection`: column
- `justifyContent`: start
- `margin`: 0
- `material`: White double-sided THREE.MeshBasicMaterial. If glassmorphism is set to true, then a THREE.MeshPhysicalMaterial is used instead
- `overflow`: visible
- `padding`: 0
- `height`: auto
- `width`: auto

## Methods
- `add(object)`: Adds an object to the component. Inherited from [Object3D](https://threejs.org/docs/#api/en/core/Object3D)
- `remove(object)`: Removes an object from the component. Inherited from [Object3D](https://threejs.org/docs/#api/en/core/Object3D)
- `updateLayout()`: Updates the layout of the component and its children. This is called automatically when relevant changes are made
