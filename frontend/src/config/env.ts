const hostFromWindow = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const protocolFromWindow = typeof window !== 'undefined'
  ? window.location.protocol.replace(':', '')
  : 'http';

const apiProtocol = import.meta.env.VITE_API_PROTOCOL || protocolFromWindow;
const apiHost = import.meta.env.VITE_API_HOST || hostFromWindow;
const apiPort = import.meta.env.VITE_API_PORT || '3000';

export const API_BASE_URL = import.meta.env.VITE_API_URL || `${apiProtocol}://${apiHost}:${apiPort}`;
