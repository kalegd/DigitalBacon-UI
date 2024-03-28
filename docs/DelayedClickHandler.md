# DelayedClickHandler

DelayedClickHandler provides functionality for triggering code that must occur in response to a pointer click. This is required due to pointer events being triggered via polling rather than event listeners

## Methods

- `trigger(callback: Function)`: Assumes a real click/touchend event has occurred within the last 30ms. The callback will be added to the queue to be processed 30ms after said event event

## Notes

- This is primarily used to address browser compatibility issues, particularly with Safari, where certain elements like popups and file inputs cannot be triggered directly with a click event outside of an event listener
