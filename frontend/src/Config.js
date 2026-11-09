import packageJson from '../package.json';

export const API_BASE = 'https://api.flottekueche.de/';
// export const API_BASE = 'http://localhost:8000/';
export const FASTKITCHEN_VERSION = `v${packageJson.version}`;

export const gateFetch = (url, options = {}) => {
    // The gate token is an HttpOnly cookie on the API domain, so it must be
    // explicitly included on cross-origin requests.
    return fetch(url, { ...options, credentials: 'include' }).then((response) => {
        if (
            response.status === 401 &&
            response.headers.get('X-Gate-Required') === '1'
        ) {
            window.dispatchEvent(new Event('gate:unauthorized'));
        }
        return response;
    });
};

export const gateImageUrl = (url) => {
    // <img> requests to the API automatically send the host-only gate cookie.
    return url;
};
