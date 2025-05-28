import express from 'express';
import { inventoryService } from './services/inventory.service';
import inventoryRoutes from './routes/inventory.routes';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// Rutas
app.use(inventoryRoutes);

app.listen(PORT, async () => {
  try {
    await inventoryService.initialize();
    console.log(`Inventory service running on port ${PORT}`);
    console.log('Available endpoints:');
    console.log('  GET /inventory - Get all inventory');
    console.log('  POST /inventory/add-stock - Add stock to product');
  } catch (error) {
    console.error('Failed to start inventory service:', error);
    process.exit(1);
  }
});