const clientId = '6ba70a27e1074901a50411a6b6a7c0d3';
const redirectUri = 'http://localhost:8000/examples/spotify';
const scope = 'user-read-playback-state user-modify-playback-state user-read-currently-playing streaming playlist-read-private playlist-read-collaborative playlist-modify-private playlist-modify-public user-top-read user-read-recently-played user-library-modify user-library-read user-read-email user-read-private';

let accessToken, getTokenPromise, getRefreshTokenPromise;

function setup() {
    accessToken = localStorage.getItem('access_token');
    let urlParams = new URLSearchParams(window.location.search);
    let code = urlParams.get('code');
    let error = urlParams.get('error');
    if(code) {
        let getToken = async () => {

            // stored in the previous step
            let codeVerifier = localStorage.getItem('code_verifier');

            let payload = {
                method: 'POST',
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                body: new URLSearchParams({
                    client_id: clientId,
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: redirectUri,
                    code_verifier: codeVerifier,
                }),
            }
            let body = await fetch("https://accounts.spotify.com/api/token",
                payload);
            let response = await body.json();

            if(response.error) {
                console.error(response);
                accessToken = null;
                localStorage.clear();
                getTokenPromise = null;
                return;
            }

            localStorage.setItem('access_token', response.access_token);
            localStorage.setItem('refresh_token', response.refresh_token);
            localStorage.setItem('expires_at', Date.now() + response.expires_in
                    * 1000);
            accessToken = response.access_token;
            getTokenPromise = null;
        };
        getTokenPromise = getToken();
        getTokenPromise.catch((e) => {
            console.error(e);
        });
    } else if(error) {
        alert(error);
    }
}

async function getRefreshToken() {
    // refresh token that has been previously stored
    let refreshToken = localStorage.getItem('refresh_token');
    let url = "https://accounts.spotify.com/api/token";

    let payload = {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: clientId
        }),
    };
    let body = await fetch(url, payload);
    let response = await body.json();

    if(response.error) {
        console.error(response);
        accessToken = null;
        localStorage.clear();
        getRefreshTokenPromise = null;
        return;
    }
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('refresh_token', response.refresh_token);
    localStorage.setItem('expires_at', Date.now() + response.expires_in * 1000);
    accessToken = response.access_token;
    getRefreshTokenPromise = null;
}

async function validateToken() {
    let expiresAt = localStorage.getItem('expires_at');
    if(!expiresAt || Date.now() > Number(expiresAt)) {
        await getRefreshToken();
    }
}

function generateRandomString(length) {
  let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], "");
}

async function sha256(plain) {
  let encoder = new TextEncoder()
  let data = encoder.encode(plain)
  return window.crypto.subtle.digest('SHA-256', data)
}

function base64encode(input) {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export function getAccessToken() {
    return accessToken;
}

export async function isAuthenticated() {
    if(getTokenPromise) {
        await getTokenPromise;
    } else if(getRefreshTokenPromise) {
        await getRefreshTokenPromise;
    }
    if(accessToken) await validateToken();
    return accessToken != null;
}

export async function authenticate() {
    let codeVerifier  = generateRandomString(64);
    let hashed = await sha256(codeVerifier)
    let codeChallenge = base64encode(hashed);
    window.localStorage.setItem('code_verifier', codeVerifier);

    let authUrl = new URL("https://accounts.spotify.com/authorize")
    let params =  {
      response_type: 'code',
      client_id: clientId,
      scope,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
      redirect_uri: redirectUri,
    };
    authUrl.search = new URLSearchParams(params).toString();
    if(window != window.top) {
        window.top.postMessage(authUrl.toString(), '*');
    } else {
        window.location.href = authUrl.toString();
    }
};

async function genericAPICall(method, resource) {
    await validateToken();
    let result = await fetch("https://api.spotify.com/v1" + resource, {
        method: method, headers: { Authorization: `Bearer ${accessToken}` }
    });
    return result;
}

export async function getPlaylist(playlistId) {
    let result = await genericAPICall('GET', '/playlists/' + playlistId);
    return await result.json();
}

export async function getPlaylists() {
    let result = await genericAPICall('GET', '/me/playlists');
    return await result.json();
}

export async function getRecentlyPlayed() {
    let result = await genericAPICall('GET', '/me/player/recently-played');
    return await result.json();
}

export async function transferPlayback(deviceId) {
    await validateToken();
    let result = await fetch("https://api.spotify.com/v1/me/player", {
        method: "PUT",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ device_ids: [deviceId], play: false }),
    });
    return result;
}

export async function getPlaybackState(deviceId) {
    await validateToken();
    let result = await fetch("https://api.spotify.com/v1/me/player", {
        method: "GET", headers: { Authorization: `Bearer ${accessToken}` }
    });
    return await result.json();
}

async function playbackAPICall(method, resource, deviceId) {
    await validateToken();
    let result = await fetch("https://api.spotify.com/v1/me/player/" + resource + '?device_id=' + deviceId, {
        method: method, headers: { Authorization: `Bearer ${accessToken}` }
    });
    return result;
}

export async function previous(deviceId) {
    return await playbackAPICall('POST', 'previous', deviceId);
}
export async function next(deviceId) {
    return await playbackAPICall('POST', 'next', deviceId);
}
export async function play(deviceId) {
    return await playbackAPICall('PUT', 'play', deviceId);
}
export async function playSong(deviceId, uri, contextUri) {
    await validateToken();
    let body = {};
    if(contextUri) {
        body.context_uri = contextUri;
        body.offset = { uri: uri };
    } else {
        body.uris = [uri];
    }
    let result = await fetch("https://api.spotify.com/v1/me/player/play?device_id=" + deviceId, {
        method: "PUT",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(body),
    });             
    return result;
}
export async function pause(deviceId) {
    return await playbackAPICall('PUT', 'pause', deviceId);
}

export async function search(query) {
    await validateToken();
    let result = await fetch("https://api.spotify.com/v1/search?query=" + encodeURIComponent(query) + '&type=album,artist,playlist,track', {
        method: "GET",
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    return result.json();
}

export async function seek(position, deviceId) {
    await validateToken();
    let result = await fetch("https://api.spotify.com/v1/me/player/seek?position_ms=" + position + '&device_id=' + deviceId, {
        method: "PUT",
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    return await result;
}

export async function shuffle(state, deviceId) {
    await validateToken();
    let result = await fetch("https://api.spotify.com/v1/me/player/shuffle?state=" + (state == true) + '&device_id=' + deviceId, {
        method: "PUT",
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    return result;
}

export async function repeat(state, deviceId) {
    await validateToken();
    let result = await fetch("https://api.spotify.com/v1/me/player/repeat?state=" + state + '&device_id=' + deviceId, {
        method: "PUT",
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    return result;
}

setup();
