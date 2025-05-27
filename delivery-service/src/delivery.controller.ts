import { Request, Response } from 'express';
import { deliveryService } from './delivery.service';

export const getOrderStatus = async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const status = deliveryService.getOrderStatus(orderId);
  res.json({ orderId, status });
};