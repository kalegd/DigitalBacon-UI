# InteractionTool

InteractionTool class manages the current interaction tool and provides functionality to listen for tool updates.

## Methods

- `getTool()`: Returns the current interaction tool.
- `setTool(tool: any)`: Sets the current interaction tool and notifies listeners.
- `addUpdateListener(callback: function)`: Adds a listener for tool update events.
- `removeUpdateListener(callback: function)`: Removes a listener for tool update events.

## Properties

- `_tool`: The current interaction tool.
- `_listeners`: A Set containing listeners for tool update events.

## Notes

- The InteractionTool class is used to manage the current interaction tool in an application.
- It allows setting and retrieving the current tool, as well as adding and removing listeners for tool update events.
- When the tool is set using `setTool()`, all registered listeners are notified with the new tool.
- This class provides a simple way to implement tool-based interactions in a user interface.

