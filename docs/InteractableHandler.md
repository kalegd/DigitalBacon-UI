# InteractableHandler

InteractableHandler is a parent class that provides high level logic for managing state updates and triggering events for registered interactables

## Methods

- `addEventListener(type: string, callback: Function)`: Adds an event listener for the specified type of interaction event. The callback function will be executed when the event occurs
- `removeEventListener(type: string, callback: Function)`: Removes an event listener for the specified type of interaction event
- `registerToolHandler(tool: string, handler: Function)`: Registers a tool-specific handler function for managing interactions with the specified [tool](/docs/InteractionTool.md)
- `addInteractable(interactable: Interactable)`: Adds an interactable object to the handler for managing interactions
- `addInteractables(interactables: Array<Interactable>)`: Adds multiple interactable objects to the handler for managing interactions
- `removeInteractable(interactable: Interactable)`: Removes an interactable object from the handler and resets its state
- `removeInteractables(interactables: Array<Interactable>)`: Removes multiple interactable objects from the handler and resets their states

## Notes

- For actually adding interactables, you should do so via one of [PointerInteractableHandler](/docs/PointerInteractableHandler.md), [GripInteractableHandler](/docs/GripInteractableHandler.md), or [TouchInteractableHandler](/docs/TouchInteractableHandler.md)
- All interactables that are a descendant of a registered interactable will be processed by the handler. They do not need to be registered themselves
- Event listeners can be added and removed using the `addEventListener()` and `removeEventListener()` methods for the following events: `over`, `out`, `down`, `up`, `click`, `move`, and `drag`
- Tool-specific handler functions can be registered using the `registerToolHandler()` method to support custom interaction logic for those tools

