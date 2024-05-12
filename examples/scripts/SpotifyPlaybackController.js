import * as SpotifyHelper from './SpotifyHelper.js';
import * as Styles from './SpotifyStyles.js';
import * as DigitalBaconUI from 'digitalbacon-ui';
const { Div, Span, Text } = DigitalBaconUI;

export default class SpotifyPlaybackController {
    constructor() {
        this._ignoreUpdates = true;
        this._lastUpdateTime = Date.now();
        DigitalBaconUI.UpdateHandler.add(() => this.update());
        this._createPlayer();
        this._createContent();
    }

    _createPlayer() {
        this._player = new Spotify.Player({
            name: 'Web Playback SDK Quick Start Player',
            getOAuthToken: cb => { cb(SpotifyHelper.getAccessToken()); },
            volume: 0.5,
        });
        this._player.addListener('ready', async ({ device_id }) => {
            this._deviceId = device_id;
            await SpotifyHelper.transferPlayback(this._deviceId);
            setTimeout(() => this._updateState(), 250);
        });
        this._player.addListener('not_ready', ({ device_id }) => {
            console.error("TODO: Let user know device has gone offline");
        });
        this._player.addListener('initialization_error', ({ message }) => {
            console.error(message);
        });

        this._player.addListener('authentication_error', ({ message }) => {
            console.error(message);
        });

        this._player.addListener('account_error', ({ message }) => {
            console.error(message);
        });
        this._player.connect();
        let listener = () => {
            this._player.activateElement();
            document.removeEventListener('click', listener);
        };
        document.addEventListener('click', listener);
    }

    _createContent() {
        this._content = new DigitalBaconUI.Body({
            backgroundVisible: true,
            borderRadius: 0.075,
            glassmorphism: true,
            height: 0.15,
            justifyContent: 'spaceBetween',
            width: 0.82,
        });
        let controlsSpan = new Span({ paddingTop: 0.015, paddingRight: 0.17 });
        let controls = {};
        function createControlsButton(name, onClick) {
            let url = `./images/${name}-icon.png`;
            let button = new DigitalBaconUI.Image(url, {
                height: 0.05,
                marginLeft: 0.01,
                marginRight: 0.01,
                materialColor: 0xaaaaaa,
            });
            button.pointerInteractable.addHoveredCallback((hovered) => {
                (hovered)
                    ? button.addStyle(Styles.buttonHovered)
                    : button.removeStyle(Styles.buttonHovered);
            });
            button.onClick = onClick;
            return button;
        }
        this._shuffleButton = createControlsButton('shuffle',
            () => this._shuffle());
        let back = createControlsButton('back', () => this._back());
        this._playButton = createControlsButton('play', () => this._play());
        this._pauseButton = createControlsButton('pause', () => this._pause());
        let next = createControlsButton('next', () => this._next());
        this._repeatButton = createControlsButton('repeat', ()=>this._repeat());
        this._playParent = new Span();
        let scrubberSpan = new Span({ paddingBottom: 0.01 });
        this._elapsedTime = new Text('0:00', Styles.colorWhite,
            Styles.fontMedium);
        this._totalTime = new Text('0:00', Styles.colorWhite,Styles.fontMedium);
        let trackDetails = new Span({
            height: '100%',
            overflow: 'hidden',
            width: 0.17,
        });
        this._trackName = new Text('', Styles.colorWhite, Styles.fontMedium);
        this._scrubber = new DigitalBaconUI.Range({
            height: 0.01,
            margin: 0.03,
            width: 0.5,
        });
        this._scrubber.onBlur = (value) => this._seek(value);
        this._content.add(controlsSpan);
        this._content.add(scrubberSpan);
        controlsSpan.add(trackDetails);
        controlsSpan.add(this._shuffleButton);
        controlsSpan.add(back);
        controlsSpan.add(this._playParent);
        controlsSpan.add(next);
        controlsSpan.add(this._repeatButton);
        trackDetails.add(this._trackName);
        this._playParent.add(this._playButton);
        scrubberSpan.add(this._elapsedTime);
        scrubberSpan.add(this._scrubber);
        scrubberSpan.add(this._totalTime);
        this._content.position.set(0, -0.53, 0.01);
    }

    async _updateState() {
        if(!this._deviceId) return;
        let response = await SpotifyHelper.getPlaybackState(this._deviceId);
        //console.log(response);
        this._isPlaying = response.is_playing;
        if(this._isPlaying) {
            this._playParent.remove(this._playButton);
            this._playParent.add(this._pauseButton);
        } else {
            this._playParent.remove(this._pauseButton);
            this._playParent.add(this._playButton);
        }
        this._shuffleState = response.shuffle_state;
        (this._shuffleState)
            ? this._shuffleButton.addStyle(Styles.materialColorGreen)
            : this._shuffleButton.removeStyle(Styles.materialColorGreen);
        this._repeatState = response.repeat_state;
        if(this._repeatState == 'off') {
            this._repeatButton.removeStyle(Styles.materialColorBlue)
            this._repeatButton.removeStyle(Styles.materialColorGreen);
        } else if(this._repeatState == 'context') {
            this._repeatButton.removeStyle(Styles.materialColorBlue);
            this._repeatButton.addStyle(Styles.materialColorGreen)
        } else if(this._repeatState == 'track') {
            this._repeatButton.removeStyle(Styles.materialColorGreen);
            this._repeatButton.addStyle(Styles.materialColorBlue)
        }
        if(response.item) {
            this._trackProgress = response.progress_ms || 0;
            this._trackDuration = response.item.duration_ms || 0;
            this._updateScrubber();
            this._trackName.text = response.item.name;
        }
        this._ignoreUpdates = false;
    }

    _updateScrubber() {
        this._elapsedTime.text = this._msToTime(this._trackProgress);
        this._totalTime.text = this._msToTime(this._trackDuration);
        if(this._trackDuration) {
            this._scrubber.value = this._trackProgress / this._trackDuration;
        } else {
            this._scrubber.value = 0;
        }
        this._lastUpdateTime = Date.now();
    }

    _msToTime(ms) {
        let minutes = Math.floor(ms / 1000 / 60);
        let seconds = Math.floor(ms / 1000) - minutes * 60;
        seconds = (seconds < 10) ? '0' + seconds : seconds;
        return minutes + ':' + seconds;
    }

    async _back() {
        if(!this._deviceId) return;
        await SpotifyHelper.previous(this._deviceId);
        setTimeout(() => this._updateState(), 250);
    }

    async _next() {
        if(!this._deviceId) return;
        await SpotifyHelper.next(this._deviceId);
        setTimeout(() => this._updateState(), 250);
    }

    async _pause() {
        if(!this._deviceId) return;
        await SpotifyHelper.pause(this._deviceId);
        setTimeout(() => this._updateState(), 250);
    }

    async _play() {
        if(!this._deviceId) return;
        await SpotifyHelper.play(this._deviceId);
        setTimeout(() => this._updateState(), 250);
    }

    async play(uri, contextUri) {
        if(!this._deviceId) return;
        await SpotifyHelper.playSong(this._deviceId, uri, contextUri);
        setTimeout(() => this._updateState(), 250);
    }

    async _repeat() {
        if(!this._deviceId) return;
        let nextState;
        if(this._repeatState == 'off') {
            nextState = 'context';
        } else if(this._repeatState == 'context') {
            nextState = 'track';
        } else {
            nextState = 'off';
        }
        await SpotifyHelper.repeat(nextState, this._deviceId);
        setTimeout(() => this._updateState(), 250);
    }

    async _seek(percent) {
        if(!this._deviceId) return;
        let position = Math.floor(this._trackDuration * percent);
        await SpotifyHelper.seek(position, this._deviceId);
        setTimeout(() => this._updateState(), 250);
    }

    async _shuffle() {
        if(!this._deviceId) return;
        await SpotifyHelper.shuffle(!this._shuffleState, this._deviceId);
        setTimeout(() => this._updateState(), 250);
    }

    update() {
        if(this._ignoreUpdates || !this._isPlaying) return;
        let timeSinceUpdate = Date.now() - this._lastUpdateTime;
        if(timeSinceUpdate > 1000) {
            this._trackProgress += timeSinceUpdate;
            if(this._trackProgress > this._trackDuration) {
                this._ignoreUpdates = true;
                this._updateState();
            } else {
                this._updateScrubber();
            }
        }
    }

    getObject() {
        return this._content;
    }
}
