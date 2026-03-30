import { Request, Response } from 'express';
import { UsuarioService } from '../services/UsuarioService';

export class UsuarioController {
  private service = new UsuarioService();

  async getAll(_req: Request, res: Response): Promise<void> {
    try {
      res.json(await this.service.getAllUsuarios());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(500).json({ error: message });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const usuario = await this.service.getUsuarioById(Number(req.params.id));
      if (!usuario) {
        res.status(404).json({ error: 'Usuário não encontrado' });
        return;
      }
      res.json(usuario);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(400).json({ error: message });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const usuario = await this.service.createUsuario(req.body);
      res.status(201).json(usuario);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(400).json({ error: message });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const usuario = await this.service.updateUsuario(Number(req.params.id), req.body);
      if (!usuario) {
        res.status(404).json({ error: 'Usuário não encontrado' });
        return;
      }
      res.json(usuario);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(400).json({ error: message });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const ok = await this.service.deleteUsuario(Number(req.params.id));
      if (!ok) {
        res.status(404).json({ error: 'Usuário não encontrado' });
        return;
      }
      res.json({ message: 'Usuário deletado com sucesso' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(400).json({ error: message });
    }
  }

  async resetSenha(req: Request, res: Response): Promise<void> {
    try {
      const usuario = await this.service.resetSenha(Number(req.params.id));
      if (!usuario) {
        res.status(404).json({ error: 'Usuário não encontrado' });
        return;
      }
      res.json(usuario);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(400).json({ error: message });
    }
  }

  async getPerfis(_req: Request, res: Response): Promise<void> {
    try {
      res.json(await this.service.getPerfis());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(500).json({ error: message });
    }
  }
}
