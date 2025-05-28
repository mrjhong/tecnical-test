import { Request, Response } from 'express';
import { deliveryService } from '../services/delivery.service';

export const getAllOrdersController = async (req: Request, res: Response): Promise<any> => {
  try {
    const orders = await deliveryService.getAllOrders();
    res.json({
      count: orders.length,
      orders
    });
  } catch (error) {
    console.error('Error getting all orders:', error);
    res.status(500).json({ 
      error: 'Failed to get orders',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getOrderByIdController = async (req: Request, res: Response): Promise<any> => {
  try {
    const { orderId } = req.params;
    const order = await deliveryService.getOrderById(orderId);
    res.json(order);
  } catch (error) {
    if (error instanceof Error && error.message === 'Order not found') {
      return res.status(404).json({
        error: 'Order not found',
        orderId: req.params.orderId
      });
    }
    console.error('Error getting order by ID:', error);
    res.status(500).json({ 
      error: 'Failed to get order',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getOrderStatsController = async (req: Request, res: Response): Promise<any> => {
  try {
    const stats = await deliveryService.getOrderStatistics();
    res.json(stats);
  } catch (error) {
    console.error('Error getting order statistics:', error);
    res.status(500).json({ 
      error: 'Failed to get order statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateOrderStatusController = async (req: Request, res: Response): Promise<any> => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    if (!status || !['processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status. Must be one of: processing, shipped, delivered, cancelled'
      });
    }
    
    // Esta funcionalidad se puede implementar si se necesita actualización manual
    res.json({
      message: 'Manual status update not implemented - orders update automatically',
      orderId,
      requestedStatus: status
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ 
      error: 'Failed to update order status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};