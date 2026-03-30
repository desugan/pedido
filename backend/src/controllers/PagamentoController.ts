import { Request, Response } from 'express';
import { PagamentoService } from '../services/PagamentoService';

export class PagamentoController {
  private service = new PagamentoService();

  async createPagamento(req: Request, res: Response): Promise<void> {
    try {
      const pagamento = await this.service.createPagamento(req.body);
      res.status(201).json(pagamento);
    } catch (error) {
      console.error('Erro ao criar pagamento:', error);
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(message.includes('inválido') || message.includes('obrigatórios') ? 400 : 500).json({ error: message });
    }
  }

  async getPagamentoById(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const pagamento = await this.service.getPagamentoById(id);

      if (!pagamento) {
        res.status(404).json({ error: 'Pagamento não encontrado' });
        return;
      }

      res.json(pagamento);
    } catch (error) {
      console.error('Erro ao buscar pagamento:', error);
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(400).json({ error: message });
    }
  }

  async getAllPagamentos(req: Request, res: Response): Promise<void> {
    try {
      const status = req.query.status as string | undefined;
      const pagamentos = await this.service.getAllPagamentos(status);
      res.json(pagamentos);
    } catch (error) {
      console.error('Erro ao listar pagamentos:', error);
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(400).json({ error: message });
    }
  }

  async getPagamentosByClienteId(req: Request, res: Response): Promise<void> {
    try {
      const clienteId = Number(req.params.clienteId);
      const pagamentos = await this.service.getPagamentosByClienteId(clienteId);
      res.json(pagamentos);
    } catch (error) {
      console.error('Erro ao buscar pagamentos do cliente:', error);
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(400).json({ error: message });
    }
  }

  async updatePagamentoStatus(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const status = req.body.status;
      const updated = await this.service.updatePagamentoStatus(id, status);

      if (!updated) {
        res.status(404).json({ error: 'Pagamento não encontrado' });
        return;
      }

      res.json(updated);
    } catch (error) {
      console.error('Erro ao atualizar status do pagamento:', error);
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(400).json({ error: message });
    }
  }

  async deletePagamento(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const success = await this.service.deletePagamento(id);

      if (!success) {
        res.status(404).json({ error: 'Pagamento não encontrado' });
        return;
      }

      res.json({ message: 'Pagamento deletado com sucesso' });
    } catch (error) {
      console.error('Erro ao deletar pagamento:', error);
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(400).json({ error: message });
    }
  }
}