# InputHandler

InputHandler class provides polling for XR input sources, keyboard, or touch screen inputs

## Methods

- `addExtraControlsButton(id: string, name: string)`: Adds an html extra controls button to the webpage
- `getExtraControlsButton(id: string)`: Retrieves an extra controls button by its ID
- `hideExtraControls()`: Hides the whole extra controls panel
- `hideExtraControlsButton(id: string)`: Hides the extra controls button with the specified ID
- `showExtraControls()`: Shows the whole extra controls panel
- `showExtraControlsButton(id: string)`: Shows the extra controls button with the specified ID
- `getPointerPosition()`: A Vector2 representing the position of the pointer on the canvas. Applys also for touch screen users

### For Pointer Users

- `isPointerPressed()`: Returns whether or not the primary button is currently pressed down (example: left-click on a mouse)
- `isKeyPressed(key: string)`: Returns whether or not the [key](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key) is currently pressed
- `isKeyCodePressed(code: string)`: Returns whether or not the key associated with the provided [code](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code) is currently pressed

### For Touch Screen Users

- `getJoystickAngle()`: Returns angle of the joystick in radians
- `getJoystickDistance()`: Returns the distance the joystick is pulled in the joystick angle's direction. Value returned will be between 0 and 1
- `hideJoystick()`: Hides the joystick
- `isScreenTouched()`: Returns whether or not the screen is currently touched
- `showJoystick()`: Shows the joystick

### For XR Users

- `disableXRControllerManagement()`: Disables management of XR Controllers
- `enableXRControllerManagement(parent: Object3D)`: Enables the module to handle managing XR Controllers and updating them
- `getXRInputSource(type: string, handedness: string)`: Returns the relevant [XRInputSource](https://developer.mozilla.org/en-US/docs/Web/API/XRInputSource) for the provided type (`HAND` or `CONTROLLER`) and handedness (`LEFT` or `RIGHT`)
- `getXRGamepad(handedness: string)`: Returns the XRInputSource's [gamepad](https://developer.mozilla.org/en-US/docs/Web/API/XRInputSource/gamepad) for the controller corresponding to the provided handedness if it exists
- `getXRController(type: string, handedness: string, space: string)`: Returns an Object3D representing the XR Input Device for the corresponding type, handedness and space (`targetRay` or `grip`) if it exists
- `getXRControllerModel(type: string, handedness: string)`: Returns the Object3D model for the corresponding XR Input Device if it exists
- `setXRControllerModel(type: string, handedness: string, model: Object3D)`: Sets the model for the corresponding XR Input Device if it exists
- `update(frame)`: Updates the XR Controllers based on the provided frame. Called internally by [DigitalBacon-UI](/docs/DigitialBacon-UI.md)

## Notes

- XRInputSources can be managed for both controllers and hands, with support for target ray and grip spaces
- Additional controls such as joysticks and html buttons can be created and managed through the InputHandler class
