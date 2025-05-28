import express from 'express';
import { getInventoryController, addStockController } from '../controllers/inventory.controller';

const router = express.Router();

// Rutas
router.get('/inventory', getInventoryController);
router.post('/inventory/add-stock', addStockController);

export default router;