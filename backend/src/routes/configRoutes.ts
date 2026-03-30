import { Router } from 'express';
import { ConfigController } from '../controllers/ConfigController';

const router = Router();
const controller = new ConfigController();

router.get('/pix-key', controller.getPixKey.bind(controller));
router.put('/pix-key', controller.setPixKey.bind(controller));

export default router;
