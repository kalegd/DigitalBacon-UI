import * as SpotifyHelper from './SpotifyHelper.js';
import * as Styles from './SpotifyStyles.js';
import * as DigitalBaconUI from 'digitalbacon-ui';
const { Div, Span, Text, TextInput } = DigitalBaconUI;

export default class SpotifyMainContent {
    constructor(playbackController) {
        this._playbackController = playbackController;
        this._playlistTrackSpans = [];
        this._searchTrackSpans = [];
        this._createContent();
    }

    _createContent() {
        this._content = new Span(Styles.primaryContent,
            { justifyContent: 'spaceBetween' });
        let column1 = new Div({
            height: '100%',
            width: '37%',
            justifyContent: 'spaceBetween',
        });
        let column2 = new Div(Styles.sectionStyle, {
            height: '100%',
            overflow: 'scroll',
            paddingBottom: 0.03,
            paddingLeft: 0.03,
            paddingRight: 0.03,
            width: '62.3%',
        });
        this._createHomeSection();
        this._createPlaylistsSection();
        this._createPlaylistSection();
        this._createRecentlyPlayedSection();
        this._createSearchSection();

        this._content.add(column1);
        this._content.add(column2);
        column1.add(this._homeSection);
        column1.add(this._playlistsSection);
        column2.add(this._recentlyPlayedSection);
        this._mainPanel = column2;
    }

    _createHomeSection() {
        this._homeSection = new Div(Styles.sectionStyle,
            { height: 0.15, padding: 0.01, width: '100%' });
        let createHomeSectionButton = (title, onClick) => {
            let span = new Span({ height: 0.065, width: '100%' });
            let iconUrl = `./images/${title.toLowerCase()}-icon.png`;
            let image = new DigitalBaconUI.Image(iconUrl,
                { height: '50%', margin: 0.0125 });
            let textParent = new Span({ paddingTop: 0.005 });
            let text = new Text(title, Styles.colorWhite, Styles.fontMedium,
                Styles.font500);
            this._homeSection.add(span);
            span.add(image);
            span.add(textParent);
            textParent.add(text);
            span.onClick = onClick;
            span.pointerInteractable.addHoveredCallback((hovered) => {
                (hovered)
                    ? text.addStyle(Styles.homeSectionHovered)
                    : text.removeStyle(Styles.homeSectionHovered);
            });
            return span;
        }
        let homeButton = createHomeSectionButton('Home', () =>this._loadHome());
        let searchButton = createHomeSectionButton('Search',
            () => this._loadSearch());
    }

    _createPlaylistsSection() {
        this._playlistsSection = new Div(Styles.sectionStyle,
            { height: 0.70, overflow: 'scroll', width: '100%' });
        let playlistsTextSpan = new Span({
            height: 0.065,
            paddingLeft: 0.0225,
            width: '100%',
        });
        let playlistsText = new Text('Playlists', Styles.colorWhite,
            Styles.font500, Styles.fontLarge);

        this._playlistsSection.add(playlistsTextSpan);
        playlistsTextSpan.add(playlistsText);
        this._populatePlaylists();
    }

    _createPlaylistSection() {
        this._playlistSection = new Div({ width: '100%' });
        let playlistTextSpan = new Span({
            paddingTop: 0.045,
            paddingBottom: 0.02,
            width: '100%',
        });
        this._playlistNameText = new Text('Playlist', Styles.colorWhite,
            Styles.font700, Styles.fontXLarge);

        this._playlistSection.add(playlistTextSpan);
        playlistTextSpan.add(this._playlistNameText);
    }

    _createRecentlyPlayedSection() {
        this._recentlyPlayedSection = new Div({ width: '100%' });
        let recentlyPlayedTextSpan = new Span({
            paddingTop: 0.045,
            paddingBottom: 0.02,
            width: '100%',
        });
        let recentlyPlayedText = new Text('Recently Played', Styles.colorWhite,
            Styles.font700, Styles.fontXLarge);

        this._recentlyPlayedSection.add(recentlyPlayedTextSpan);
        recentlyPlayedTextSpan.add(recentlyPlayedText);
        this._populateRecentlyPlayed();
    }

    _createSearchSection() {
        this._searchSection = new Div({ width: '100%' });
        let searchInputSpan = new Span({
            backgroundVisible: true,
            borderRadius: 0.0275,
            glassmorphism: true,
            height: 0.057,
            materialColor: 0x606d75,
            marginTop: 0.04,
            marginBottom: 0.04,
            width: '100%',
        });
        let searchIcon = new DigitalBaconUI.Image(
            './images/search-icon.png',
            { height: '60%', marginLeft: 0.015 }
        );
        this._searchInput = new TextInput({
            backgroundVisible: false,
            borderWidth: 0,
            color: 0xffffff,
            fontSize: 0.035,
            height: 0.055,
            marginLeft: -0.055,
            paddingLeft: 0.07,
            width: '100%',
        });
        this._searchSection.add(searchInputSpan);
        searchInputSpan.add(searchIcon);
        searchInputSpan.add(this._searchInput);
        this._searchInput.onBlur = () => this._search();
    }

    async _populatePlaylists() {
        let response = await SpotifyHelper.getPlaylists();
        //console.log(response);
        for(let item of response.items) {
            let span = new Span({
                glassmorphism: true,
                height: 0.067,
                materialColor: 0x606d75,
                paddingTop: 0.01,
                paddingBottom: 0.01,
                paddingLeft: 0.0225,
                width:'100%',
            });
            let album = new DigitalBaconUI.Image(item.images[0].url,
                { height: '100%', padding: 0.01 });
            let text = new Text(item.name, Styles.colorWhite,
                Styles.font500, Styles.fontMedium, { marginLeft: 0.02 });
            this._playlistsSection.add(span);
            span.add(album);
            span.add(text);
            span.onClick = () => this._loadPlaylist(item);
            span.pointerInteractable.addHoveredCallback((hovered) => {
                span.backgroundVisible = (hovered) ? true : false;
                window.span = span;
            });
        }
    }

    async _populateRecentlyPlayed() {
        let response = await SpotifyHelper.getRecentlyPlayed();
        //console.log(response);
        let index = 0;
        let row;
        let existingTracks = new Set();
        for(let item of response.items) {
            if(existingTracks.has(item.track.id)) continue;
            existingTracks.add(item.track.id);
            if(index % 2 == 0) {
              row = new Span(Styles.recentlyPlayedRowStyle);
              this._recentlyPlayedSection.add(row);
            }
            let span = new Span(Styles.recentlyPlayedTrackStyle);
            let album = new DigitalBaconUI.Image(item.track.album.images[0].url,
              Styles.recentlyPlayedImageStyle);
            let text = new Text(item.track.name, Styles.colorWhite,
                Styles.font500, Styles.fontMedium, { marginLeft: 0.02 });
            row.add(span);
            span.add(album);
            span.add(text);
            span.onClick = () => this._playbackController.play(item.track.uri,
                item?.context?.uri);
            index++;
        }
    }

    _loadHome() {
        this._mainPanel.remove(this._playlistSection);
        this._mainPanel.remove(this._searchSection);
        this._mainPanel.add(this._recentlyPlayedSection);
    }

    _loadSearch() {
        this._mainPanel.remove(this._playlistSection);
        this._mainPanel.remove(this._recentlyPlayedSection);
        this._mainPanel.add(this._searchSection);
    }

    async _search() {
        let value = this._searchInput.value;
        if(!value) {
            this._clearSearchResults();
            return;
        }
        let response = await SpotifyHelper.search(value);
        this._clearSearchResults();
        //console.log(response);
        for(let i = 0; i < response.tracks.items.length; i++) {
            let item = response.tracks.items[i];
            let span = this._createTrackSpan(i + 1, item);
            this._searchSection.add(span);
            this._searchTrackSpans.push(span);
        }
    }

    async _loadPlaylist(details) {
        this._playlistNameText.text = details.name;
        this._mainPanel.remove(this._recentlyPlayedSection);
        this._mainPanel.remove(this._searchSection);
        this._mainPanel.add(this._playlistSection);
        this._clearPlaylist();
        let response = await SpotifyHelper.getPlaylist(details.id);
        //console.log(response);
        for(let i = 0; i < response.tracks.items.length; i++) {
            let item = response.tracks.items[i].track;
            let span = this._createTrackSpan(i + 1, item, response.uri);
            this._playlistSection.add(span);
            this._playlistTrackSpans.push(span);
        }
    }

    _createTrackSpan(index, item, contextUri) {
        let span = new Span({
            alignItems: 'start',
            borderRadius: 0.005,
            glassmorphism: true,
            height: 0.1,
            materialColor: 0x606d75,
            paddingTop: 0.01,
            paddingBottom: 0.01,
            width:'100%',
        });
        let numberSpan = new Span({
            height: '100%',
            justifyContent: 'center',
            width: 0.05,
        });
        let numberText = new Text(String(index), Styles.colorWhite,
            Styles.font500, Styles.fontMedium);
        numberSpan.add(numberText);
        let albumImage = new DigitalBaconUI.Image(item.album.images[0].url,
            { height: '100%' });
        let titleDiv = new Div({
            alignItems: 'start',
            height: '100%',
            justifyContent: 'center',
            overflow: 'hidden',
            padding: 0.01,
            width: 0.3,
        });
        let titleText = new Text(item.name, Styles.colorWhite, Styles.font700,
            Styles.fontMedium);
        let artistText = new Text(item.artists[0].name, Styles.colorWhite,
            Styles.font500, Styles.fontMedium);
        titleDiv.add(titleText);
        titleDiv.add(artistText);
        let albumSpan = new Span({
            height: '100%',
            overflow: 'hidden',
            marginLeft: 0.01,
            marginRight: 0.01,
            width: 0.25,
        });
        let albumText = new Text(item.album.name, Styles.colorWhite,
            Styles.font500, Styles.fontMedium);
        albumSpan.add(albumText);
        let durationSpan = new Span({ height: '100%', width: 0.1 });
        let durationText = new Text(this._msToTime(item.duration_ms),
            Styles.colorWhite, Styles.font500, Styles.fontMedium);
        durationSpan.add(durationText);
        span.add(numberSpan);
        span.add(albumImage);
        span.add(titleDiv);
        span.add(albumSpan);
        span.add(durationSpan);
        span.onClick = () => this._playbackController.play(item.uri,contextUri);
        span.pointerInteractable.addHoveredCallback((hovered) => {
            span.backgroundVisible = (hovered) ? true : false;
        });
        return span;
    }

    _msToTime(ms) {
        let minutes = Math.floor(ms / 1000 / 60);
        let seconds = Math.floor(ms / 1000) - minutes * 60;
        seconds = (seconds < 10) ? '0' + seconds : seconds;
        return minutes + ':' + seconds;
    }

    _clearPlaylist() {
        for(let span of this._playlistTrackSpans) {
            this._playlistSection.remove(span);
        }
        this._playlistTrackSpans = [];
    }

    _clearSearchResults() {
        for(let span of this._searchTrackSpans) {
            this._searchSection.remove(span);
        }
        this._searchTrackSpans = [];
    }

    getObject() {
        return this._content;
    }
}
