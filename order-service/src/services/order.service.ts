import { Order } from '../types';
import * as amqp from 'amqplib';

interface PendingOrder {
  order: Order;
  resolve: (order: Order) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
}

class OrderService {
  private orders: Order[] = [];
  private pendingOrders: Map<string, PendingOrder> = new Map();
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private readonly INVENTORY_TIMEOUT = 10000; // 10 segundos timeout

  async initialize() {
    try {
      this.connection = await amqp.connect('amqp://localhost');
      this.channel = await this.connection.createChannel();
      
      // Colas para respuestas
      await this.channel.assertQueue('inventory_response_queue');
      await this.channel.assertQueue('order_status_updates');
      
      // Escuchar respuestas del inventory
      this.channel.consume('inventory_response_queue', (msg) => {
        if (msg) {
          const response = JSON.parse(msg.content.toString());
          this.handleInventoryResponse(response);
          this.channel?.ack(msg);
        }
      });

      // Escuchar actualizaciones de estado desde delivery
      this.channel.consume('order_status_updates', (msg) => {
        if (msg) {
          const update = JSON.parse(msg.content.toString());
          this.handleStatusUpdate(update);
          this.channel?.ack(msg);
        }
      });

      console.log('Order service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize order service:', error);
      throw error;
    }
  }

  async createOrder(orderData: Omit<Order, 'status'>): Promise<Order> {
    return new Promise(async (resolve, reject) => {
      const newOrder: Order = {
        ...orderData,
        status: 'created'
      };
      
      console.log(`Creating order ${newOrder.orderId}`);
      
      // Configurar timeout para la respuesta del inventory
      const timeout = setTimeout(() => {
        this.pendingOrders.delete(newOrder.orderId);
        newOrder.status = 'inventory_timeout';
        this.orders.push(newOrder);
        reject(new Error(`Inventory validation timeout for order ${newOrder.orderId}`));
      }, this.INVENTORY_TIMEOUT);

      // Guardar la orden pendiente
      this.pendingOrders.set(newOrder.orderId, {
        order: newOrder,
        resolve,
        reject,
        timeout
      });

      try {
        // Enviar a inventory para validación
        if (this.channel) {
          await this.channel.sendToQueue(
            'inventory_queue',
            Buffer.from(JSON.stringify({
              orderId: newOrder.orderId,
              items: newOrder.items
            })),
            { 
              replyTo: 'inventory_response_queue',
              correlationId: newOrder.orderId
            }
          );
          console.log(`Sent inventory validation request for order ${newOrder.orderId}`);
        } else {
          throw new Error('Channel not available');
        }
      } catch (error) {
        // Limpiar timeout y rechazar
        clearTimeout(timeout);
        this.pendingOrders.delete(newOrder.orderId);
        newOrder.status = 'failed';
        this.orders.push(newOrder);
        reject(new Error(`Failed to send inventory validation: ${error}`));
      }
    });
  }

  private async handleInventoryResponse(response: any) {
    const pendingOrder = this.pendingOrders.get(response.orderId);
    
    if (!pendingOrder) {
      console.log(`No pending order found for inventory response: ${response.orderId}`);
      return;
    }

    // Limpiar timeout
    clearTimeout(pendingOrder.timeout);
    
    const order = pendingOrder.order;
    
    if (response.isValid) {
      order.status = 'inventory_validated';
      console.log(`Order ${order.orderId} inventory validated successfully`);
      
      try {
        // Enviar a delivery service
        if (this.channel) {
          await this.channel.sendToQueue(
            'delivery_queue',
            Buffer.from(JSON.stringify({
              orderId: order.orderId,
              products: order.items,
              shippingAddress: order.shippingAddress,
              status: 'pending'
            }))
          );
          order.status = 'delivery_processing';
          console.log(`Order ${order.orderId} sent to delivery service`);
        }
        
        // Agregar a la lista de órdenes y resolver la promesa
        this.orders.push(order);
        this.pendingOrders.delete(response.orderId);
        pendingOrder.resolve(order);
        
      } catch (error) {
        console.error(`Error sending to delivery service: ${error}`);
        order.status = 'delivery_failed';
        this.orders.push(order);
        this.pendingOrders.delete(response.orderId);
        pendingOrder.reject(new Error(`Failed to send to delivery service: ${error}`));
      }
    } else {
      order.status = 'inventory_failed';
      console.log(`Order ${order.orderId} failed inventory validation: ${response.message}`);
      
      // Agregar a la lista de órdenes y resolver con estado de fallo
      this.orders.push(order);
      this.pendingOrders.delete(response.orderId);
      pendingOrder.resolve(order); // Resolver con el estado de fallo, no rechazar
    }
  }

  private handleStatusUpdate(update: any) {
    const order = this.orders.find(o => o.orderId === update.orderId);
    if (order) {
      const previousStatus = order.status;
      
      // Mapear estados del delivery service a estados del order
      switch (update.status) {
        case 'processing':
          order.status = 'delivery_processing';
          break;
        case 'shipped':
          order.status = 'completed';
          break;
        case 'delivered':
          order.status = 'delivered';
          break;
        case 'cancelled':
          order.status = 'delivery_cancelled';
          break;
        default:
          order.status = update.status;
      }
      
      console.log(`Order ${order.orderId} status updated from ${previousStatus} to ${order.status}`);
    }
  }

  getOrderStatus(orderId: string): Order | undefined {
    // Buscar primero en órdenes completadas
    const completedOrder = this.orders.find(o => o.orderId === orderId);
    if (completedOrder) {
      return completedOrder;
    }
    
    // Buscar en órdenes pendientes
    const pendingOrder = this.pendingOrders.get(orderId);
    if (pendingOrder) {
      return {
        ...pendingOrder.order,
        status: 'processing' // Indicar que está en proceso
      };
    }
    
    return undefined;
  }

  getAllOrders(): Order[] {
    // Combinar órdenes completadas y pendientes
    const allOrders = [...this.orders];
    
    // Agregar órdenes pendientes con estado 'processing'
    this.pendingOrders.forEach((pendingOrder, orderId) => {
      allOrders.push({
        ...pendingOrder.order,
        status: 'processing'
      });
    });
    
    return allOrders;
  }

  // Método para obtener estadísticas
  getOrderStats() {
    const completed = this.orders.length;
    const pending = this.pendingOrders.size;
    const statusCount = this.orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      total: completed + pending,
      completed,
      pending,
      statusBreakdown: statusCount
    };
  }
}

export const orderService = new OrderService();