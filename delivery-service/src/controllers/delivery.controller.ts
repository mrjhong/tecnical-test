import { Request, Response } from 'express';
import { deliveryService } from '../services/delivery.service';

export const getOrderStatusController = async (req: Request, res: Response): Promise<any> => {
  try {
    const { orderId } = req.params;
    const result = deliveryService.getOrderStatus(orderId);
    
    if (result.status === 'not_found') {
      return res.status(404).json({
        error: 'Order not found in delivery service',
        orderId
      });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error getting delivery status:', error);
    res.status(500).json({ 
      error: 'Failed to get delivery status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getAllDeliveriesController = async (req: Request, res: Response): Promise<any> => {
  try {
    const deliveries = deliveryService.getAllOrders();
    res.json({
      count: deliveries.length,
      deliveries
    });
  } catch (error) {
    console.error('Error getting all deliveries:', error);
    res.status(500).json({ 
      error: 'Failed to get deliveries',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const simulateIssueController = async (req: Request, res: Response): Promise<any> => {
  try {
    const { orderId } = req.params;
    const success = await deliveryService.simulateDeliveryIssue(orderId);
    
    if (success) {
      res.json({
        message: 'Delivery issue simulated successfully',
        orderId
      });
    } else {
      res.status(400).json({
        error: 'Order not found or cannot be cancelled',
        orderId
      });
    }
  } catch (error) {
    console.error('Error simulating delivery issue:', error);
    res.status(500).json({ 
      error: 'Failed to simulate delivery issue',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};