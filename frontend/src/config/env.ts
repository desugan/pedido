const hostFromWindow = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
const protocolFromWindow = typeof window !== 'undefined'
  ? window.location.protocol.replace(':', '')
  : 'http';

const apiProtocol = import.meta.env.VITE_API_PROTOCOL || protocolFromWindow;
const localApiHost = hostFromWindow === 'localhost' ? '127.0.0.1' : hostFromWindow;
const apiHost = import.meta.env.VITE_API_HOST || localApiHost;
const apiPort = import.meta.env.VITE_API_PORT
  || (apiHost === 'localhost' || apiHost === '127.0.0.1' ? '5000' : '');

const fallbackApiBaseUrl = apiPort
  ? `${apiProtocol}://${apiHost}:${apiPort}`
  : `${apiProtocol}://${apiHost}`;

export const API_BASE_URL = import.meta.env.VITE_API_URL
  || (import.meta.env.DEV ? '' : fallbackApiBaseUrl);
