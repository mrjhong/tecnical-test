import express from 'express';
import { createOrder, getOrderStatus } from './order.controller';
import { orderService } from './order.service';

const app = express();
const PORT = 3000;

app.use(express.json());

app.post('/orders', createOrder);
app.get('/orders/:orderId', getOrderStatus);

app.listen(PORT, async () => {
  await orderService.initialize();
  console.log(`Order service running on port ${PORT}`);
});