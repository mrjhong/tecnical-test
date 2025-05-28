import express from 'express';
import { deliveryService } from './services/delivery.service';
import deliveryRoutes from './routes/delivery.route';

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());

// Rutas
app.use(deliveryRoutes);




app.listen(PORT, async () => {
  try {
    await deliveryService.initialize();
    console.log(`Delivery service running on port ${PORT}`);
    console.log('Available endpoints:');
    console.log('  GET /delivery/:orderId - Get delivery status');
    console.log('  GET /deliveries - Get all deliveries');
    console.log('  POST /delivery/:orderId/simulate-issue - Simulate delivery issue');
  } catch (error) {
    console.error('Failed to start delivery service:', error);
    process.exit(1);
  }
});