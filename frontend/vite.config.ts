import { tmpdir } from 'node:os';
import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const explicitApiUrl = env.VITE_API_URL || env.API_URL;
  const parsedApiUrl = explicitApiUrl ? new URL(explicitApiUrl) : null;
  const apiProtocol = env.VITE_API_PROTOCOL || parsedApiUrl?.protocol.replace(':', '') || 'http';
  const apiHost = env.VITE_API_HOST || env.HOST_IP || parsedApiUrl?.hostname || '127.0.0.1';
  const apiPort = env.VITE_API_PORT || env.PORT || parsedApiUrl?.port || '5000';
  const frontendPort = Number(env.VITE_PORT || 5173);
  const apiTarget = `${apiProtocol}://${apiHost}:${apiPort}`;

  return {
    plugins: [react()],
    cacheDir: path.join(tmpdir(), 'pedido-frontend-vite-cache'),
    server: {
      allowedHosts: ['pedido.uppermu.com.br'],
      host: true,
      port: frontendPort,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: mode === 'development',
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': ['qrcode'],
          },
        },
      },
      chunkSizeWarningLimit: 500,
    },
  };
});