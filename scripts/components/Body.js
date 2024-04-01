/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import ScrollableComponent from '/scripts/components/ScrollableComponent.js';

class Body extends ScrollableComponent {
    constructor(...styles) {
        super(...styles);
        this.bypassContentPositioning = true;
        this._defaults['backgroundVisible'] = true;
        this._defaults['height'] = 1;
        this._defaults['width'] = 1;
        this.updateLayout();
    }
}

export default Body;
