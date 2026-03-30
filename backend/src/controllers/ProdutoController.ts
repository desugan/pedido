import { Request, Response } from 'express';
import { ProdutoService } from '../services/ProdutoService';

export class ProdutoController {
  private service = new ProdutoService();

  async getAll(_req: Request, res: Response): Promise<void> {
    try {
      res.json(await this.service.getAllProdutos());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(500).json({ error: message });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const produto = await this.service.getProdutoById(Number(req.params.id));
      if (!produto) {
        res.status(404).json({ error: 'Produto não encontrado' });
        return;
      }
      res.json(produto);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(400).json({ error: message });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const produto = await this.service.createProduto(req.body);
      res.status(201).json(produto);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(400).json({ error: message });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const produto = await this.service.updateProduto(Number(req.params.id), req.body);
      if (!produto) {
        res.status(404).json({ error: 'Produto não encontrado' });
        return;
      }
      res.json(produto);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(400).json({ error: message });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const ok = await this.service.deleteProduto(Number(req.params.id));
      if (!ok) {
        res.status(404).json({ error: 'Produto não encontrado' });
        return;
      }
      res.json({ message: 'Produto deletado com sucesso' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(400).json({ error: message });
    }
  }
}
