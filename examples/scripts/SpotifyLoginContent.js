import * as SpotifyHelper from './SpotifyHelper.js';
import * as Styles from './SpotifyStyles.js';
import { Div, Text } from 'digitalbacon-ui';

export default class SpotifyLoginContent {
    constructor() {
        this._createContent();
    }

    _createContent() {
        this._content = new Div(Styles.primaryContent, Styles.sectionStyle,
            { justifyContent: 'center' });
        let loginButton = new Div({
            backgroundVisible: true,
            borderRadius: 0.05,
            height: 0.1,
            justifyContent: 'center',
            materialColor: 0x1db954,
            width: 0.52,
        });
        let loginText = new Text('CONNECT TO SPOTIFY', {
            color: 0xffffff,
            fontSize: 0.04,
        });
        this._content.add(loginButton);
        loginButton.add(loginText);
        loginButton.onClick = () => {
            SpotifyHelper.authenticate();
        }
        loginButton.pointerInteractable.addHoveredCallback((hovered) => {
            if(hovered) {
                loginButton.materialColor = 0x189a46;
                loginText.troikaText.position.z = 0.01;
            } else {
                loginButton.materialColor = 0x1db954;
                loginText.troikaText.position.z = 0;
            }
        });
    }

    getObject() {
        return this._content;
    }
}
