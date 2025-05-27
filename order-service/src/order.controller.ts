import express,{ Request, Response } from 'express';
import { orderService } from './order.service';

export const createOrder = async (req: Request, res: Response) => {
  try {
    const order = await orderService.createOrder(req.body);
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order' });
  }
};


export const getOrderStatus = async (req: Request, res:any) => {
   const { orderId } = req.params;
  const order = orderService.getOrderStatus(orderId);
  
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  return res.json(order);
};