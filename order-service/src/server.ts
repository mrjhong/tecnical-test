import express from 'express';
import { orderService } from './services/order.service';
import orderRoutes from './routes/order.route';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Rutas
app.use( orderRoutes);


app.listen(PORT, async () => {
  try {
    await orderService.initialize();
    console.log(`Order service running on port ${PORT}`);
    console.log('Available endpoints:');
    console.log('  POST /orders - Create new order');
    console.log('  GET /orders/:orderId - Get order status');
    console.log('  GET /orders - Get all orders');
  } catch (error) {
    console.error('Failed to start order service:', error);
    process.exit(1);
  }
});