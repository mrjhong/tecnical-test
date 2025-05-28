import { DeliveryOrder } from '../types';
import * as amqp from 'amqplib';
import { Connection, Channel } from 'amqplib';
import { Order } from '../models/Order';
import { OrderItem } from '../models/OrderItem';
import sequelize from '../config/database';

class DeliveryService {
  private connection: Connection | null = null;
  private channel: Channel | null = null;

  async initialize() {
    try {
      // Inicializar base de datos
      await this.initializeDatabase();
      
      // Inicializar RabbitMQ
      this.connection = await amqp.connect('amqp://localhost');
      this.channel = await this.connection.createChannel();
      
      // Colas para recibir órdenes y consultas
      await this.channel.assertQueue('delivery_create_queue');
      await this.channel.assertQueue('delivery_status_queue');
      
      // Escuchar solicitudes de creación de órdenes
      this.channel.consume('delivery_create_queue', (msg) => {
        if (msg) {
          try {
            const orderRequest = JSON.parse(msg.content.toString());
            this.createOrder(orderRequest, msg.properties.replyTo, msg.properties.correlationId);
            this.channel?.ack(msg);
          } catch (error) {
            console.error('Error processing order creation:', error);
            this.channel?.nack(msg, false, false);
          }
        }
      });

      // Escuchar solicitudes de estado
      this.channel.consume('delivery_status_queue', (msg) => {
        if (msg) {
          try {
            const request = JSON.parse(msg.content.toString());
            this.getOrderStatusRequest(request, msg.properties.replyTo);
            this.channel?.ack(msg);
          } catch (error) {
            console.error('Error processing status request:', error);
            this.channel?.nack(msg, false, false);
          }
        }
      });

      console.log('Delivery service initialized successfully with database persistence');
    } catch (error) {
      console.error('Failed to initialize delivery service:', error);
      throw error;
    }
  }

  private async initializeDatabase() {
    try {
      // Sincronizar modelos con la base de datos
      await sequelize.authenticate();
      console.log('Database connection established successfully');
      
      // Crear tablas si no existen
      await sequelize.sync({ alter: true });
      console.log('Database tables synchronized');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  async createOrder(orderRequest: any, replyTo?: string, correlationId?: string) {
    const transaction = await sequelize.transaction();
    
    try {
      console.log(`Creating order ${orderRequest.orderId} in database`);
      
      // Calcular total
      const totalAmount = orderRequest.items.reduce((sum: number, item: any) => {
        // En un caso real, aquí buscarías el precio del producto
        return sum + (item.quantity * 100); // Precio ficticio
      }, 0);

      // Crear la orden principal
      const order = await Order.create({
        id: orderRequest.orderId,
        customerId: orderRequest.customerId,
        status: 'created',
        totalAmount,
        shippingAddress: orderRequest.shippingAddress
      }, { transaction });

      // Crear los items de la orden
      const orderItems = await Promise.all(
        orderRequest.items.map((item: any) => 
          OrderItem.create({
            orderId: orderRequest.orderId,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: 100, // Precio ficticio
            totalPrice: item.quantity * 100
          }, { transaction })
        )
      );

      await transaction.commit();
      
      console.log(`Order ${orderRequest.orderId} created successfully in database`);
      
      // Responder al order-service
      if (replyTo && this.channel) {
        await this.channel.sendToQueue(
          replyTo,
          Buffer.from(JSON.stringify({
            orderId: orderRequest.orderId,
            success: true,
            status: 'created',
            message: 'Order created successfully',
            order: {
              orderId: order.id,
              customerId: order.customerId,
              status: order.status,
              totalAmount: order.totalAmount,
              shippingAddress: order.shippingAddress,
              items: orderItems.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice
              }))
            }
          })),
          { correlationId }
        );
      }
      
      // Iniciar el proceso de envío asíncrono
      this.startDeliveryProcess(orderRequest.orderId);
      
    } catch (error) {
      await transaction.rollback();
      console.error(`Error creating order ${orderRequest.orderId}:`, error);
      
      // Responder con error al order-service
      if (replyTo && this.channel) {
        await this.channel.sendToQueue(
          replyTo,
          Buffer.from(JSON.stringify({
            orderId: orderRequest.orderId,
            success: false,
            status: 'creation_failed',
            message: `Error creating order: ${error}`
          })),
          { correlationId }
        );
      }
    }
  }

  private async startDeliveryProcess(orderId: string) {
    // Simular procesamiento de entrega
    setTimeout(async () => {
      await this.updateOrderStatus(orderId, 'processing');
      console.log(`Order ${orderId} moved to processing`);
      
      // Simular tiempo de preparación
      setTimeout(async () => {
        await this.updateOrderStatus(orderId, 'shipped');
        console.log(`Order ${orderId} shipped`);
        
        // Simular tiempo de entrega
        setTimeout(async () => {
          await this.updateOrderStatus(orderId, 'delivered');
          console.log(`Order ${orderId} delivered`);
        }, 8000); // 8 segundos para entrega
      }, 5000); // 5 segundos para preparación
    }, 3000); // 3 segundos inicial
  }

  private async updateOrderStatus(orderId: string, status: string) {
    try {
      const [updatedRows] = await Order.update(
        { status: status },
        { where: { id: orderId } }
      );
      
      if (updatedRows > 0) {
        console.log(`Order ${orderId} status updated to ${status}`);
        
        // Notificar cambio de estado (si fuera necesario)
        // await this.notifyStatusChange(orderId, status);
      }
    } catch (error) {
      console.error(`Error updating order ${orderId} status:`, error);
    }
  }

  private async getOrderStatusRequest(request: any, replyTo?: string) {
    try {
      const order = await this.getOrderById(request.orderId);
      
      if (replyTo && this.channel) {
        await this.channel.sendToQueue(
          replyTo,
          Buffer.from(JSON.stringify(order))
        );
      }
    } catch (error) {
      if (replyTo && this.channel) {
        await this.channel.sendToQueue(
          replyTo,
          Buffer.from(JSON.stringify({
            error: 'Order not found',
            orderId: request.orderId
          }))
        );
      }
    }
  }

  // Métodos públicos para la API REST
  async getAllOrders() {
    try {
      const orders = await Order.findAll({
        include: [{
          model: OrderItem,
          as: 'items'
        }],
        order: [['createdAt', 'DESC']]
      });

      return orders.map(order => ({
        orderId: order.id,
        customerId: order.customerId,
        status: order.status,
        totalAmount: order.totalAmount,
        shippingAddress: order.shippingAddress,
        items: order.items?.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice
        })) || [],
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      }));
    } catch (error) {
      console.error('Error getting all orders:', error);
      throw error;
    }
  }

  async getOrderById(orderId: string) {
    try {
      const order = await Order.findByPk(orderId, {
        include: [{
          model: OrderItem,
          as: 'items'
        }]
      });

      if (!order) {
        throw new Error('Order not found');
      }

      return {
        orderId: order.id,
        customerId: order.customerId,
        status: order.status,
        totalAmount: order.totalAmount,
        shippingAddress: order.shippingAddress,
        items: order.items?.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice
        })) || [],
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      };
    } catch (error) {
      console.error(`Error getting order ${orderId}:`, error);
      throw error;
    }
  }

  async getOrderStatistics() {
    try {
      const totalOrders = await Order.count();
      const statusBreakdown = await Order.findAll({
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('status')), 'count']
        ],
        group: ['status'],
        raw: true
      });

      const recentOrders = await Order.count({
        where: {
          createdAt: {
            [require('sequelize').Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24h
          }
        }
      });

      return {
        totalOrders,
        recentOrders,
        statusBreakdown: statusBreakdown.reduce((acc: any, item: any) => {
          acc[item.status] = parseInt(item.count);
          return acc;
        }, {})
      };
    } catch (error) {
      console.error('Error getting order statistics:', error);
      throw error;
    }
  }
}

export const deliveryService = new DeliveryService();