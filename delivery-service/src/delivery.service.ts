import { DeliveryOrder } from './types';
import * as amqp from 'amqplib';
import { Connection, Channel } from 'amqplib';
class DeliveryService {
  private orders: DeliveryOrder[] = [];
  private connection: Connection | null = null;
  private channel: Channel | null = null;

  async initialize() {
    this.connection = await amqp.connect('amqp://localhost');
    this.channel = await this.connection.createChannel();
    
    // Cola para recibir pedidos listos para despacho
    await this.channel.assertQueue('delivery_queue');
    
    this.channel.consume('delivery_queue', (msg) => {
      if (msg) {
        const order: DeliveryOrder = JSON.parse(msg.content.toString());
        this.processOrder(order);
        this.channel?.ack(msg);
      }
    });
  }

  async processOrder(order: DeliveryOrder) {
    console.log(`Processing delivery for order ${order.orderId}`);
    this.orders.push({ ...order, status: 'processing' });
    
    // Simular tiempo de procesamiento
    setTimeout(() => {
      this.updateOrderStatus(order.orderId, 'shipped');
      console.log(`Order ${order.orderId} shipped`);
    }, 3000);
  }

  updateOrderStatus(orderId: string, status: DeliveryOrder['status']) {
    const order = this.orders.find(o => o.orderId === orderId);
    if (order) {
      order.status = status;
    }
  }

  getOrderStatus(orderId: string) {
    return this.orders.find(o => o.orderId === orderId)?.status || 'not_found';
  }
}

export const deliveryService = new DeliveryService();