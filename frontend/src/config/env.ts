const apiUrl = import.meta.env.VITE_API_URL;

function getApiBaseUrl(): string {
  if (apiUrl) {
    return apiUrl;
  }

  const protocolFromWindow = typeof window !== 'undefined'
    ? window.location.protocol.replace(':', '')
    : 'http';
  const hostFromWindow = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
  const apiProtocol = import.meta.env.VITE_API_PROTOCOL || protocolFromWindow;
  const localApiHost = hostFromWindow === 'localhost' ? '127.0.0.1' : hostFromWindow;
  const apiHost = import.meta.env.VITE_API_HOST || localApiHost;
  const apiPort = import.meta.env.VITE_API_PORT
    || (apiHost === 'localhost' || apiHost === '127.0.0.1' ? '5000' : '');

  return apiPort
    ? `${apiProtocol}://${apiHost}:${apiPort}`
    : `${apiProtocol}://${apiHost}`;
}

export const API_BASE_URL = getApiBaseUrl();
