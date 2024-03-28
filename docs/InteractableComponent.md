# InteractableComponent

extends [LayoutComponent](/docs/LayoutComponent.md)

Generic component that provides functionality for handling interactions such as pointer clicks, pointer drags, touch clicks, and touch drags

## Constructor

### `constructor(...styles: Object[])`

Creates a new instance of InteractableComponent

- `...styles`: Any number of styles to apply to the component. Can be made up of either [Style](/docs/Style.md) objects or generic objects. In the case of generic objects they will each be used to instatiate a new Style object based on their parameters

## New Properties

- `pointerInteractable`: The [PointerInteractable](/docs/PointerInteractable.md) instance associated with the component
- `touchInteractable`: The [TouchInteractable](/docs/TouchInteractable.md) instance associated with the component
- `onClick`: Callback function that can be set to handle pointer click events
- `onDrag`: Callback function that can be set to handle pointer drag events
- `onTouch`: Callback function that can be set to handle touch click events
- `onTouchDrag`: Callback function that can be set to handle touch drag events
