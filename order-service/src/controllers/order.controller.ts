import { Request, Response } from 'express';
import { orderService } from '../services/order.service';

export const createOrderController = async (req: Request, res: Response): Promise<any> => {
  try {
    const { orderId, customerId, items, shippingAddress } = req.body;
    
    // Validaciones
    if (!orderId || !customerId || !items || !shippingAddress) {
      return res.status(400).json({ 
        error: 'Missing required fields: orderId, customerId, items, shippingAddress' 
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        error: 'Items must be a non-empty array' 
      });
    }

    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({ 
          error: 'Each item must have productId and positive quantity' 
        });
      }
    }

    console.log(`Coordinating order creation for ${orderId}`);
    
    // Procesar orden (coordinación completa)
    const result = await orderService.processOrder({
      orderId,
      customerId,
      items,
      shippingAddress
    });
    
    if (result.success) {
      res.status(201).json({
        message: result.message,
        orderId: result.orderId,
        status: result.status,
        order: result.order
      });
    } else {
      const statusCode = result.status === 'inventory_failed' ? 422 : 400;
      res.status(statusCode).json({
        error: result.message,
        orderId: result.orderId,
        status: result.status
      });
    }
    
  } catch (error) {
    console.error('Error coordinating order creation:', error);
    
    if (error instanceof Error && error.message.includes('timeout')) {
      return res.status(408).json({ 
        error: 'Order processing timeout',
        details: error.message
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to process order', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getOrderStatusController = async (req: Request, res: Response): Promise<any> => {
  try {
    const { orderId } = req.params;
    
    // Delegar consulta al delivery service
    const order = await orderService.getOrderStatus(orderId);
    
    if (order.error) {
      return res.status(404).json(order);
    }
    
    res.json(order);
  } catch (error) {
    console.error('Error getting order status:', error);
    res.status(500).json({ 
      error: 'Failed to get order status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getCoordinatorStatsController = async (req: Request, res: Response): Promise<any> => {
  try {
    const stats = orderService.getCoordinatorStats();
    res.json({
      service: 'order-coordinator',
      ...stats
    });
  } catch (error) {
    console.error('Error getting coordinator stats:', error);
    res.status(500).json({ 
      error: 'Failed to get coordinator statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};