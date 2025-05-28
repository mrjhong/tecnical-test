import express from 'express';
import { createOrderController, getOrderStatusController, getAllOrdersController,getOrderStatsController } from '../controllers/order.controller';

const router = express.Router();

// Rutas
router.post('/orders', createOrderController);
router.get('/orders/:orderId', getOrderStatusController);
router.get('/orders', getAllOrdersController);
router.get('/stats', getOrderStatsController);

export default router;