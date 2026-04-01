import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiProtocol = env.VITE_API_PROTOCOL || 'http';
  const apiHost = env.VITE_API_HOST || env.HOST_IP || 'localhost';
  const apiPort = env.VITE_API_PORT || env.PORT || '3000';
  const frontendPort = Number(env.VITE_PORT || 5173);
  const apiTarget = `${apiProtocol}://${apiHost}:${apiPort}`;

  return {
    plugins: [react()],
    server: {
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
      sourcemap: true,
    },
  };
});
