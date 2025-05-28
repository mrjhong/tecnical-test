// delivery-service/src/delivery.service.ts
import { DeliveryOrder } from '../types';
import * as amqp from 'amqplib';
import { Connection, Channel } from 'amqplib';

class DeliveryService {
  private orders: DeliveryOrder[] = [];
  private connection: Connection | null = null;
  private channel: Channel | null = null;

  async initialize() {
    try {
      this.connection = await amqp.connect('amqp://localhost');
      this.channel = await this.connection.createChannel();
      
      // Cola para recibir pedidos listos para despacho
      await this.channel.assertQueue('delivery_queue');
      // Cola para enviar actualizaciones de estado al order-service
      await this.channel.assertQueue('order_status_updates');
      
      this.channel.consume('delivery_queue', (msg) => {
        if (msg) {
          try {
            const order: DeliveryOrder = JSON.parse(msg.content.toString());
            this.processOrder(order);
            this.channel?.ack(msg);
          } catch (error) {
            console.error('Error processing delivery order:', error);
            this.channel?.nack(msg, false, false);
          }
        }
      });

      console.log('Delivery service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize delivery service:', error);
      throw error;
    }
  }

  async processOrder(order: DeliveryOrder) {
    console.log(`Processing delivery for order ${order.orderId}`);
    
    // Agregar orden con estado inicial
    const deliveryOrder: DeliveryOrder = { 
      ...order, 
      status: 'processing' 
    };
    this.orders.push(deliveryOrder);
    
    // Notificar al order-service que estamos procesando
    await this.notifyOrderStatus(order.orderId, 'processing');
    
    // Simular tiempo de procesamiento y preparación
    setTimeout(async () => {
      try {
        // // Simular posible fallo (5% de probabilidad)
        // if (Math.random() < 0.05) {
        //   await this.updateOrderStatus(order.orderId, 'cancelled');
        //   console.log(`Order ${order.orderId} cancelled during processing`);
        //   return;
        // }

        await this.updateOrderStatus(order.orderId, 'shipped');
        console.log(`Orden ${order.orderId} enviada `);
        
        // Simular tiempo de entrega
        setTimeout(async () => {
          await this.updateOrderStatus(order.orderId, 'delivered');
          console.log(`Orden ${order.orderId} enviada`);
        }, 5000); // 5 segundos para simular entrega
        
      } catch (error) {
        console.error(`Error actualizando orden ${order.orderId}:`, error);
        await this.updateOrderStatus(order.orderId, 'cancelled');
      }
    }, 3000); // 3 segundos para procesar
  }

  async updateOrderStatus(orderId: string, status: DeliveryOrder['status']) {
    const order = this.orders.find(o => o.orderId === orderId);
    if (order) {
      const previousStatus = order.status;
      order.status = status;
      console.log(`Orden ${orderId} actualizada de ${previousStatus} a ${status}`);
      
      // Notificar al order-service
      await this.notifyOrderStatus(orderId, status);
    }
  }

  private async notifyOrderStatus(orderId: string, status: DeliveryOrder['status']) {
    if (this.channel) {
      try {
        const statusUpdate = {
          orderId,
          status,
          timestamp: new Date().toISOString(),
          service: 'delivery'
        };
        
        await this.channel.sendToQueue(
          'order_status_updates',
          Buffer.from(JSON.stringify(statusUpdate))
        );
        
        console.log(`estado de orden ${orderId} enviado: ${status}`);
      } catch (error) {
        console.error(`error alenviar actulizacion de estado ${orderId}:`, error);
      }
    }
  }

  getOrderStatus(orderId: string) {
    const order = this.orders.find(o => o.orderId === orderId);
    return order ? {
      orderId,
      status: order.status,
      shippingAddress: order.shippingAddress,
      products: order.products
    } : { orderId, status: 'not_found' };
  }

  getAllOrders(): DeliveryOrder[] {
    return this.orders.map(order => ({ ...order }));
  }

  // Método para simular problemas de entrega
  async simulateDeliveryIssue(orderId: string) {
    const order = this.orders.find(o => o.orderId === orderId);
    if (order && order.status !== 'delivered' && order.status !== 'cancelled') {
      await this.updateOrderStatus(orderId, 'cancelled');
      return true;
    }
    return false;
  }
}

export const deliveryService = new DeliveryService();