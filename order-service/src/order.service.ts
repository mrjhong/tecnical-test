import { Order } from './types';
import * as amqp from 'amqplib';

class OrderService {
  private orders: Order[] = [];
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;

  async initialize() {
    this.connection = await amqp.connect('amqp://localhost');
    this.channel = await this.connection.createChannel();
    
    // Cola para respuestas de inventory
    await this.channel.assertQueue('inventory_response_queue');
    
    this.channel.consume('inventory_response_queue', (msg) => {
      if (msg) {
        const response = JSON.parse(msg.content.toString());
        this.handleInventoryResponse(response);
        this.channel?.ack(msg);
      }
    });
  }

  async createOrder(order: Omit<Order, 'status'>): Promise<Order> {
    const newOrder: Order = {
      ...order,
      status: 'created'
    };
    
    this.orders.push(newOrder);
    
    // Enviar a inventory para validación
    this.channel?.sendToQueue(
      'inventory_queue',
      Buffer.from(JSON.stringify({
        orderId: newOrder.orderId,
        items: newOrder.items
      })),
      { replyTo: 'inventory_response_queue' }
    );
    
    return newOrder;
  }

  private handleInventoryResponse(response: any) {
    const order = this.orders.find(o => o.orderId === response.orderId);
    if (!order) return;
    
    if (response.isValid) {
      order.status = 'inventory_checked';
      // Enviar a delivery
      this.channel?.sendToQueue(
        'delivery_queue',
        Buffer.from(JSON.stringify({
          orderId: order.orderId,
          products: order.items,
          shippingAddress: order.shippingAddress,
          status: 'pending'
        }))
      );
      order.status = 'delivery_processing';
    } else {
      order.status = 'inventory_failed';
    }
  }

  getOrderStatus(orderId: string) {
    return this.orders.find(o => o.orderId === orderId);
  }
}

export const orderService = new OrderService();