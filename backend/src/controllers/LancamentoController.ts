import { Request, Response } from 'express';
import { LancamentoService } from '../services/LancamentoService';

export class LancamentoController {
  private service = new LancamentoService();

  async getAll(_req: Request, res: Response): Promise<void> {
    try {
      res.json(await this.service.getAllLancamentos());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(500).json({ error: message });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const lancamento = await this.service.getLancamentoById(Number(req.params.id));
      if (!lancamento) {
        res.status(404).json({ error: 'Lançamento não encontrado' });
        return;
      }
      res.json(lancamento);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(400).json({ error: message });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const lancamento = await this.service.createLancamento(req.body);
      res.status(201).json(lancamento);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(400).json({ error: message });
    }
  }

  async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const status = String(req.body?.status || '');
      const lancamento = await this.service.updateStatus(id, status);

      if (!lancamento) {
        res.status(404).json({ error: 'Lançamento não encontrado' });
        return;
      }

      res.json(lancamento);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(400).json({ error: message });
    }
  }
}
