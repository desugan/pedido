import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PIX_KEY_CONFIG = 'pix_key';
const PIX_NOME_CONFIG = 'pix_nome';

export class ConfigRepository {
  async getPixKey(): Promise<string | null> {
    const rows = await prisma.$queryRawUnsafe<Array<{ config_value: string | null }>>(
      'SELECT config_value FROM app_config WHERE config_key = ? LIMIT 1',
      PIX_KEY_CONFIG
    );

    return rows[0]?.config_value || null;
  }

  async setPixKey(pixKey: string): Promise<string> {
    await prisma.$executeRawUnsafe(
      `INSERT INTO app_config (config_key, config_value)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE config_value = VALUES(config_value), updated_at = CURRENT_TIMESTAMP`,
      PIX_KEY_CONFIG,
      pixKey
    );

    return pixKey;
  }

  async getPixNome(): Promise<string | null> {
    const rows = await prisma.$queryRawUnsafe<Array<{ config_value: string | null }>>(
      'SELECT config_value FROM app_config WHERE config_key = ? LIMIT 1',
      PIX_NOME_CONFIG
    );

    return rows[0]?.config_value || null;
  }

  async setPixNome(nome: string): Promise<string> {
    await prisma.$executeRawUnsafe(
      `INSERT INTO app_config (config_key, config_value)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE config_value = VALUES(config_value), updated_at = CURRENT_TIMESTAMP`,
      PIX_NOME_CONFIG,
      nome
    );

    return nome;
  }
}
