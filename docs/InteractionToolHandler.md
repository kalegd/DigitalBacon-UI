# InteractionToolHandler

InteractionToolHandler manages the current interaction tool and provides functionality to listen for tool updates

## Methods

- `getTool()`: Returns the current interaction tool
- `setTool(tool: string)`: Sets the current interaction tool and notifies listeners. Can be null
- `addUpdateListener(callback: function)`: Adds a listener for tool update events
- `removeUpdateListener(callback: function)`: Removes a listener for tool update events
