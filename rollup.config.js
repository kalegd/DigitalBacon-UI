import { nodeResolve } from '@rollup/plugin-node-resolve';
import rootImport from 'rollup-plugin-root-import';
import terser from '@rollup/plugin-terser';

function header() {
    return {
        renderChunk(code) {
            return `/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
${ code }`;
        }
    };
}

export default {
    input: 'scripts/DigitalBacon-UI.js',
    output: [{
            file: 'build/DigitalBacon-UI.js',
            format: 'es',
        }, {
            file: 'build/DigitalBacon-UI.min.js',
            format: 'es',
            name: 'version',
            plugins: [
                terser({mangle: { keep_classnames: true, keep_fnames: true }}),
                header()
            ],
        },
    ],
    external: [
        'three',
    ],
    plugins: [
        nodeResolve(),
        rootImport({
            // Will first look in `client/src/*` and then `common/src/*`.
            root: `${__dirname}`,
            useInput: 'prepend',

            // If we don't find the file verbatim, try adding these extensions
            extensions: '.js',
        }),
    ],
};
