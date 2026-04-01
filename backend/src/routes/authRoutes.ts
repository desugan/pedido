import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { getLoginLog } from '../loginLog';
import { requireAuth } from '../middleware/auth';

const router = Router();
const controller = new AuthController();

router.post('/login', controller.login.bind(controller));
router.post('/alterar-senha', requireAuth, controller.alterarSenha.bind(controller));
router.get('/login-log', requireAuth, (_req, res) => { res.json(getLoginLog()); });

export default router;
