# InputHandler

InputHandler class provides polling for XR input sources, keyboard, or touch screen inputs.

## Methods

- `init(container: HTMLElement, renderer: THREE.WebGLRenderer)`: Initializes the InputHandler with the specified container and renderer.
- `createJoystick()`: Creates a joystick control for touch screen inputs.
- `addExtraControlsButton(id: string, name: string)`: Adds an extra controls button to the interface.
- `getExtraControlsButton(id: string)`: Retrieves an extra controls button by its ID.
- `hideExtraControlsButton(id: string)`: Hides the extra controls button with the specified ID.
- `showExtraControlsButton(id: string)`: Shows the extra controls button with the specified ID.
- `update(frame: XRFrame)`: Updates XR controller states based on the provided XRFrame.

## Properties

- `_container`: The HTML container element associated with the InputHandler.
- `_renderer`: The WebGLRenderer instance associated with the InputHandler.
- `_xrInputDevices`: An object to store XR input devices by type and handedness.
- `_pointerPosition`: A Vector2 representing the position of the pointer.
- `_pointerPressed`: A boolean indicating whether the pointer is pressed.
- `_keysPressed`: A Set containing keys that are currently pressed.
- `_keyCodesPressed`: A Set containing key codes that are currently pressed.
- `_screenTouched`: A boolean indicating whether the screen is touched.
- `_joystickAngle`: The angle of the joystick control for touch screen inputs.
- `_joystickDistance`: The distance of the joystick control for touch screen inputs.
- `_extraControls`: An object to store extra controls buttons.
- `_extraControlsDiv`: The HTML div element for displaying extra controls.

## Notes

- The InputHandler class provides a unified interface for handling XR input sources, keyboard events, and touch screen inputs.
- It supports XR controllers, hands, keyboard inputs, and touch screen gestures.
- The class dynamically adds event listeners based on the active device type.
- XR input sources are managed for both controllers and hands, with support for target ray and grip spaces.
- Additional controls such as joysticks and buttons can be created and managed through the InputHandler class.

