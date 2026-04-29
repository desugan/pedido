import { Request, Response } from 'express';
import { FornecedorService } from '../services/FornecedorService';

export class FornecedorController {
  private service = new FornecedorService();

  async getAll(_req: Request, res: Response): Promise<void> {
    try {
      res.json(await this.service.getAllFornecedores());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(500).json({ error: message });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const fornecedor = await this.service.getFornecedorById(Number(req.params.id));
      if (!fornecedor) {
        res.status(404).json({ error: 'Fornecedor não encontrado' });
        return;
      }
      res.json(fornecedor);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(400).json({ error: message });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const fornecedor = await this.service.createFornecedor(req.body);
      res.status(201).json(fornecedor);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(400).json({ error: message });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const fornecedor = await this.service.updateFornecedor(Number(req.params.id), req.body);
      if (!fornecedor) {
        res.status(404).json({ error: 'Fornecedor não encontrado' });
        return;
      }
      res.json(fornecedor);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(400).json({ error: message });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const ok = await this.service.deleteFornecedor(Number(req.params.id));
      if (!ok) {
        res.status(404).json({ error: 'Fornecedor não encontrado' });
        return;
      }
      res.json({ message: 'Fornecedor deletado com sucesso' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(400).json({ error: message });
    }
  }
}
