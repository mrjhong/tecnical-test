import express from 'express';
import { 
  createOrderController, 
  getOrderStatusController, 
  getCoordinatorStatsController 
} from '../controllers/order.controller';

const router = express.Router();

// Rutas del coordinador
router.post('/orders', createOrderController);
router.get('/orders/:orderId/status', getOrderStatusController);
router.get('/coordinator/stats', getCoordinatorStatsController);

export default router;