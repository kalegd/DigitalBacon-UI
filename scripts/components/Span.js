/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import ScrollableComponent from '/scripts/components/ScrollableComponent.js';

class Span extends ScrollableComponent {
    constructor(...styles) {
        super(...styles);
        this._defaults['contentDirection'] = 'row';
        this.updateLayout();
    }
}

export default Span;
