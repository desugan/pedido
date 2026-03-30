import { Request, Response } from 'express';
import { RelatorioService } from '../services/RelatorioService';

export class RelatorioController {
  private service = new RelatorioService();

  async relatorioPedidos(req: Request, res: Response): Promise<void> {
    try {
      const { dataInicio, dataFim, status } = req.query as Record<string, string | undefined>;
      const result = await this.service.gerarRelatorioPedidos(dataInicio, dataFim, status);
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(400).json({ error: message });
    }
  }

  async relatorioPagamentos(req: Request, res: Response): Promise<void> {
    try {
      const { dataInicio, dataFim, status } = req.query as Record<string, string | undefined>;
      const result = await this.service.gerarRelatorioPagamentos(dataInicio, dataFim, status);
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(400).json({ error: message });
    }
  }

  async relatorioClientes(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.query as Record<string, string | undefined>;
      const result = await this.service.gerarRelatorioClientes(status);
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(400).json({ error: message });
    }
  }

  async relatorioVendas(req: Request, res: Response): Promise<void> {
    try {
      const { dataInicio, dataFim } = req.query as Record<string, string | undefined>;
      const result = await this.service.gerarRelatorioVendas(dataInicio, dataFim);
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(400).json({ error: message });
    }
  }

  async relatorioUsuario(req: Request, res: Response): Promise<void> {
    try {
      const id_cliente = Number(req.query.id_cliente);
      if (!id_cliente || isNaN(id_cliente)) {
        res.status(400).json({ error: 'id_cliente obrigatório' });
        return;
      }
      const result = await this.service.gerarRelatorioUsuario(id_cliente);
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(400).json({ error: message });
    }
  }
}
