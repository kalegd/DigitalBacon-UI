# DelayedClickHandler

DelayedClickHandler class provides functionality for handling delayed click events.

## Constructor

### `constructor()`

Creates a new instance of the DelayedClickHandler class.

## Methods

- `setup()`: Sets up the DelayedClickHandler by adding necessary event listeners based on the active device type. This method is called internally to initialize the handler.
- `trigger(callback: Function)`: Triggers a delayed click event by adding a callback function to the list of listeners. The callback function will be executed after a short delay.

## Notes

- The DelayedClickHandler class is designed to handle click events with a short delay, typically used to handle interactions such as button clicks.
- It is primarily used to address browser compatibility issues, particularly with Safari, where certain elements like popups and file inputs cannot be triggered directly with a click event outside of an event listener.
- The `setup()` method initializes the DelayedClickHandler by adding event listeners based on the active device type. For non-XR devices, it sets up event listeners for 'click' or 'touchend' events.
- The `trigger()` method is used to trigger a delayed click event by adding a callback function to the list of listeners. The callback function will be executed after a short delay, allowing time for other event listeners to handle any immediate interactions.

