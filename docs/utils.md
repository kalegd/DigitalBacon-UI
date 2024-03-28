# utils

## Functions

### numberOr(number, defaultValue)
- Returns the given number if it's a number, otherwise returns the default value

### capitalizeFirstLetter(string)
- Capitalizes the first letter of the given string

### isDescendant(ancestor, child)
- Checks if a given object is a descendant of another object in the scene graph

### cartesianToPolar(x, y)
- Converts Cartesian coordinates to polar coordinates and returns an array [r, phi]

### polarToCartesian(r, phi)
- Converts polar coordinates to Cartesian coordinates and returns an array [x, y]

### radiansToDegrees(r)
- Converts radians to degrees

### hslToRGB(h, s, l)
- Converts HSL (Hue, Saturation, Lightness) color values to RGB (Red, Green, Blue) color values and returns an array [r, g, b]

### rgbToHex(r, g, b)
- Converts RGB color values to a hexadecimal color integer

### setupBVHForComplexObject(object)
- Sets up a BVH (Bounding Volume Hierarchy) for a complex object in the scene

### updateBVHForComplexObject(object)
- Updates the BVH for a complex object in the scene

### addBVHVisualizer(object)
- Adds a BVH visualizer to the given object in the scene
