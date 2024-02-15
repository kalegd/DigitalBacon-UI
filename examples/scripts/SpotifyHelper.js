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
    window.location.href = authUrl.toString();
};

export async function getRecentlyPlayed() {
    await validateToken();
    let result = await fetch("https://api.spotify.com/v1/me/player/recently-played", {
        method: "GET", headers: { Authorization: `Bearer ${accessToken}` }
    });
    return await result.json();
}

setup();
