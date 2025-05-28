import express from 'express';
import { 
  getAllOrdersController,
  getOrderByIdController, 
  getOrderStatsController,
  updateOrderStatusController
} from '../controllers/delivery.controller';

const router = express.Router();

// Rutas principales de órdenes
router.get('/orders', getAllOrdersController);
router.get('/orders/:orderId', getOrderByIdController);
router.get('/orders/stats/summary', getOrderStatsController);
router.put('/orders/:orderId/status', updateOrderStatusController);

export default router;