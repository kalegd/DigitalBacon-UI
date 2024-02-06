/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Image from '/scripts/components/Image.js';

class HueSaturationWheel extends Image {
    constructor(texture, ...styles) {
        super(texture, ...styles);
    }

    _createBackground() {
        this._defaults['borderRadius'] = Math.min(this.computedHeight,
            this.computedHeight) / 2;
        super._createBackground();
    }
}

export default HueSaturationWheel;
