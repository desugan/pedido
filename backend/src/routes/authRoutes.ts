import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { getLoginLog } from '../loginLog';

const router = Router();
const controller = new AuthController();

router.post('/login', controller.login.bind(controller));
router.post('/alterar-senha', controller.alterarSenha.bind(controller));
router.get('/login-log', (_req, res) => { res.json(getLoginLog()); });

export default router;
