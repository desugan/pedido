import { Request, Response } from 'express';
import { ConfigService } from '../services/ConfigService';

export class ConfigController {
  private service = new ConfigService();

  async getPixKey(_req: Request, res: Response): Promise<void> {
    try {
      const pixKey = await this.service.getPixKey();
      res.json({ pixKey });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(500).json({ error: message });
    }
  }

  async setPixKey(req: Request, res: Response): Promise<void> {
    try {
      const pixKey = await this.service.setPixKey(req.body?.pixKey);
      res.json({ pixKey });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(400).json({ error: message });
    }
  }
}
