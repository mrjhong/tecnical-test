// order-service/src/order.controller.ts
import { Request, Response } from 'express';
import { orderService } from '../services/order.service';

export const createOrderController = async (req: Request, res: Response): Promise<any>  => {
  try {
    // Validar datos de entrada
    const { orderId, customerId, items, shippingAddress } = req.body;
    
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

    // Validar cada item
    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({ 
          error: 'Each item must have productId and positive quantity' 
        });
      }
    }

    console.log(`Received order creation request for ${orderId}`);
    
    // Crear orden y esperar respuesta del inventory
    const order = await orderService.createOrder({
      orderId,
      customerId,
      items,
      shippingAddress
    });
    
    // Determinar código de respuesta basado en el estado
    let statusCode = 201;
    let message = 'Order created successfully';
    
    switch (order.status) {
      case 'inventory_failed':
        statusCode = 422; // Unprocessable Entity
        message = 'Order created but inventory validation failed';
        break;
      case 'delivery_processing':
        statusCode = 201;
        message = 'Order created and sent to delivery';
        break;
      case 'inventory_validated':
        statusCode = 201;
        message = 'Order created and inventory validated';
        break;
      default:
        statusCode = 201;
        message = 'Order created successfully';
    }
    
    res.status(statusCode).json({
      message,
      order: {
        orderId: order.orderId,
        customerId: order.customerId,
        status: order.status,
        items: order.items,
        shippingAddress: order.shippingAddress
      }
    });
    
  } catch (error) {
    console.error('Error creating order:', error);
    
    // Determinar tipo de error
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return res.status(408).json({ 
          error: 'Order creation timeout - inventory service not responding',
          details: error.message
        });
      } else if (error.message.includes('inventory validation')) {
        return res.status(503).json({ 
          error: 'Inventory service unavailable',
          details: error.message
        });
      } else if (error.message.includes('delivery service')) {
        return res.status(503).json({ 
          error: 'Delivery service unavailable',
          details: error.message
        });
      }
    }
    
    res.status(500).json({ 
      error: 'Failed to create order', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getOrderStatusController = async (req: Request, res: Response): Promise<any>  => {
  try {
    const { orderId } = req.params;
    const order = orderService.getOrderStatus(orderId);
    
    if (!order) {
      return res.status(404).json({ 
        error: 'Order not found',
        orderId 
      });
    }
    
    res.json({
      orderId: order.orderId,
      customerId: order.customerId,
      status: order.status,
      items: order.items,
      shippingAddress: order.shippingAddress,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting order status:', error);
    res.status(500).json({ 
      error: 'Failed to get order status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getAllOrdersController = async (req: Request, res: Response): Promise<any> => {
  try {
    const orders = orderService.getAllOrders();
    const stats = orderService.getOrderStats();
    
    res.json({
      statistics: stats,
      orders: orders.map(order => ({
        orderId: order.orderId,
        customerId: order.customerId,
        status: order.status,
        itemCount: order.items.length,
        shippingAddress: order.shippingAddress
      }))
    });
  } catch (error) {
    console.error('Error getting all orders:', error);
    res.status(500).json({ 
      error: 'Failed to get orders',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Nuevo endpoint para obtener estadísticas
export const getOrderStatsController = async (req: Request, res: Response): Promise<any>  => {
  try {
    const stats = orderService.getOrderStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting order stats:', error);
    res.status(500).json({ 
      error: 'Failed to get order statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};