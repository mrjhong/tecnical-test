import express from 'express';
import { getOrderStatusController, getAllDeliveriesController, simulateIssueController } from '../controllers/delivery.controller';

const router = express.Router();

// Rutas
router.get('/delivery/:orderId', getOrderStatusController);
router.get('/deliveries', getAllDeliveriesController);
router.post('/delivery/:orderId/simulate-issue', simulateIssueController);

export default router;