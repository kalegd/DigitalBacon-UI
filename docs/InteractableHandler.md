# InteractableHandler

InteractableHandler class manages interactions with interactable objects in a scene.

## Constructor

### `constructor()`

Creates a new instance of the InteractableHandler class.

## Methods

- `init()`: Initializes the InteractableHandler based on the active device type. Determines the appropriate update method to use for handling interactions.
- `addEventListener(type: string, callback: Function)`: Adds an event listener for the specified type of interaction event. The callback function will be executed when the event occurs.
- `removeEventListener(type: string, callback: Function)`: Removes an event listener for the specified type of interaction event.
- `_trigger(type: string, eventDetails: object, interactable: Interactable)`: Triggers an interaction event with the specified type, event details, and associated interactable object. This method is responsible for executing callback functions registered for the event type.
- `registerToolHandler(tool: string, handler: Function)`: Registers a tool-specific handler function for managing interactions with the specified tool.
- `addInteractable(interactable: Interactable)`: Adds an interactable object to the handler for managing interactions.
- `addInteractables(interactables: Array<Interactable>)`: Adds multiple interactable objects to the handler for managing interactions.
- `removeInteractable(interactable: Interactable)`: Removes an interactable object from the handler and resets its state.
- `removeInteractables(interactables: Array<Interactable>)`: Removes multiple interactable objects from the handler and resets their states.
- `reset()`: Resets the handler by removing all interactable objects and resetting their states.

## Properties

- `_interactables`: A set containing all interactable objects managed by the handler.
- `_hoveredInteractables`: A map tracking interactable objects that are currently being hovered over.
- `_selectedInteractables`: A map tracking interactable objects that are currently selected.
- `_capturedInteractables`: A map tracking interactable objects that have been captured.
- `_overInteractables`: A map tracking interactable objects that are currently being interacted with.
- `_wasPressed`: A map tracking interactable objects that were pressed.
- `_listeners`: An object containing sets of event listeners for different types of interaction events.
- `_tool`: The current interaction tool being used.
- `_toolHandlers`: An object containing tool-specific handler functions for managing interactions.

## Notes

- The InteractableHandler class provides a centralized system for managing interactions with interactable objects within a scene.
- It handles various types of interaction events, such as hover, select, click, etc., and executes callback functions registered for each event type.
- The `init()` method initializes the handler based on the active device type. It determines the appropriate update method to use for handling interactions.
- Event listeners can be added and removed using the `addEventListener()` and `removeEventListener()` methods, respectively.
- The `_trigger()` method is responsible for triggering interaction events and executing callback functions registered for the event type.
- Tool-specific handler functions can be registered using the `registerToolHandler()` method to manage interactions with specific tools.

