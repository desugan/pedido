import api from './api';

export const configService = {
  async getPixKey(): Promise<string> {
    const response = await api.get('/api/config/pix-key');
    return response.data?.pixKey || '';
  },

  async setPixKey(pixKey: string): Promise<string> {
    const response = await api.put('/api/config/pix-key', { pixKey });
    return response.data?.pixKey || '';
  },

  async getPixNome(): Promise<string> {
    const response = await api.get('/api/config/pix-nome');
    return response.data?.pixNome || '';
  },

  async setPixNome(pixNome: string): Promise<string> {
    const response = await api.put('/api/config/pix-nome', { pixNome });
    return response.data?.pixNome || '';
  },
};
