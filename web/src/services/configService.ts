import api from './api';

export const configService = {
  /**
   * Retorna a chave PIX configurada.
   * @returns {Promise<string>}
   */
  async getPixKey(): Promise<string> {
    const response = await api.get('/api/config/pix-key');
    return response.data?.pixKey || '';
  },

  /**
   * Salva a chave PIX.
   * @param {string} pixKey - Chave PIX.
   * @returns {Promise<string>}
   */
  async setPixKey(pixKey: string): Promise<string> {
    const response = await api.put('/api/config/pix-key', { pixKey });
    return response.data?.pixKey || '';
  },

  /**
   * Retorna o nome do titular PIX.
   * @returns {Promise<string>}
   */
  async getPixNome(): Promise<string> {
    const response = await api.get('/api/config/pix-nome');
    return response.data?.pixNome || '';
  },

  /**
   * Salva o nome do titular PIX.
   * @param {string} pixNome - Nome do titular.
   * @returns {Promise<string>}
   */
  async setPixNome(pixNome: string): Promise<string> {
    const response = await api.put('/api/config/pix-nome', { pixNome });
    return response.data?.pixNome || '';
  },
};
