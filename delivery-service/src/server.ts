import express from 'express';
import { getOrderStatus } from './delivery.controller';
import { deliveryService } from './delivery.service';

const app = express();
const PORT = 3002;

app.use(express.json());

app.get('/delivery/:orderId', getOrderStatus);

app.listen(PORT, async () => {
  await deliveryService.initialize();
  console.log(`Delivery service running on port ${PORT}`);
});