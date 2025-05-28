import { OrderRequest, OrderResponse } from '../types';
import * as amqp from 'amqplib';

interface PendingOrder {
  orderRequest: OrderRequest;
  resolve: (response: OrderResponse) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
  step: 'inventory_validation' | 'delivery_creation';
}

class OrderService {
  // Solo mantiene referencias temporales para coordinación
  private pendingOrders: Map<string, PendingOrder> = new Map();
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private readonly PROCESS_TIMEOUT = 15000; // 15 segundos timeout total

  async initialize() {
    try {
      this.connection = await amqp.connect('amqp://localhost');
      this.channel = await this.connection.createChannel();
      
      // Colas para respuestas
      await this.channel.assertQueue('inventory_response_queue');
      await this.channel.assertQueue('delivery_response_queue');
      
      // Escuchar respuestas del inventory
      this.channel.consume('inventory_response_queue', (msg) => {
        if (msg) {
          const response = JSON.parse(msg.content.toString());
          this.handleInventoryResponse(response);
          this.channel?.ack(msg);
        }
      });

      // Escuchar respuestas del delivery (confirmación de creación)
      this.channel.consume('delivery_response_queue', (msg) => {
        if (msg) {
          const response = JSON.parse(msg.content.toString());
          this.handleDeliveryResponse(response);
          this.channel?.ack(msg);
        }
      });

      console.log('Order service initialized successfully (coordinator mode)');
    } catch (error) {
      console.error('Failed to initialize order service:', error);
      throw error;
    }
  }

  async processOrder(orderRequest: OrderRequest): Promise<OrderResponse> {
    return new Promise(async (resolve, reject) => {
      console.log(`Processing order request ${orderRequest.orderId}`);
      
      // Configurar timeout para todo el proceso
      const timeout = setTimeout(() => {
        this.pendingOrders.delete(orderRequest.orderId);
        reject(new Error(`Order processing timeout for order ${orderRequest.orderId}`));
      }, this.PROCESS_TIMEOUT);

      // Guardar la orden pendiente
      this.pendingOrders.set(orderRequest.orderId, {
        orderRequest,
        resolve,
        reject,
        timeout,
        step: 'inventory_validation'
      });

      try {
        // Paso 1: Validar inventario
        if (this.channel) {
          await this.channel.sendToQueue(
            'inventory_queue',
            Buffer.from(JSON.stringify({
              orderId: orderRequest.orderId,
              items: orderRequest.items
            })),
            { 
              replyTo: 'inventory_response_queue',
              correlationId: orderRequest.orderId
            }
          );
          console.log(`Sent inventory validation request for order ${orderRequest.orderId}`);
        } else {
          throw new Error('Channel not available');
        }
      } catch (error) {
        // Limpiar timeout y rechazar
        clearTimeout(timeout);
        this.pendingOrders.delete(orderRequest.orderId);
        reject(new Error(`Failed to send inventory validation: ${error}`));
      }
    });
  }

  private async handleInventoryResponse(response: any) {
    const pendingOrder = this.pendingOrders.get(response.orderId);
    
    if (!pendingOrder || pendingOrder.step !== 'inventory_validation') {
      console.log(`No pending inventory validation found for order: ${response.orderId}`);
      return;
    }

    if (!response.isValid) {
      // Si falla el inventario, terminar proceso
      clearTimeout(pendingOrder.timeout);
      this.pendingOrders.delete(response.orderId);
      
      pendingOrder.resolve({
        orderId: response.orderId,
        success: false,
        status: 'inventory_failed',
        message: response.message || 'Inventory validation failed'
      });
      return;
    }

    console.log(`Order ${response.orderId} passed inventory validation`);
    
    try {
      // Paso 2: Enviar al delivery service para crear la orden
      pendingOrder.step = 'delivery_creation';
      
      if (this.channel) {
        await this.channel.sendToQueue(
          'delivery_create_queue',
          Buffer.from(JSON.stringify({
            ...pendingOrder.orderRequest,
            inventoryValidated: true
          })),
          { 
            replyTo: 'delivery_response_queue',
            correlationId: response.orderId
          }
        );
        console.log(`Sent order creation request to delivery service for order ${response.orderId}`);
      }
      
    } catch (error) {
      console.error(`Error sending to delivery service: ${error}`);
      clearTimeout(pendingOrder.timeout);
      this.pendingOrders.delete(response.orderId);
      
      pendingOrder.reject(new Error(`Failed to send to delivery service: ${error}`));
    }
  }

  private handleDeliveryResponse(response: any) {
    const pendingOrder = this.pendingOrders.get(response.orderId);
    
    if (!pendingOrder || pendingOrder.step !== 'delivery_creation') {
      console.log(`No pending delivery creation found for order: ${response.orderId}`);
      return;
    }

    // Limpiar timeout y resolver
    clearTimeout(pendingOrder.timeout);
    this.pendingOrders.delete(response.orderId);
    
    if (response.success) {
      console.log(`Order ${response.orderId} successfully created in delivery service`);
      pendingOrder.resolve({
        orderId: response.orderId,
        success: true,
        status: response.status || 'created',
        message: response.message || 'Order created successfully',
        order: response.order
      });
    } else {
      console.log(`Order ${response.orderId} failed to create in delivery service`);
      pendingOrder.resolve({
        orderId: response.orderId,
        success: false,
        status: 'creation_failed',
        message: response.message || 'Failed to create order'
      });
    }
  }

  // Método para obtener estadísticas del coordinador
  getCoordinatorStats() {
    return {
      pendingProcesses: this.pendingOrders.size,
      activeSteps: Array.from(this.pendingOrders.values()).reduce((acc, order) => {
        acc[order.step] = (acc[order.step] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  // Método para consultar estado - delega al delivery service
  async getOrderStatus(orderId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.channel) {
        reject(new Error('Channel not available'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for order status'));
      }, 5000);

      // Crear cola temporal para la respuesta
      this.channel.assertQueue('', { exclusive: true }).then((q) => {
        this.channel!.consume(q.queue, (msg) => {
          if (msg) {
            clearTimeout(timeout);
            const response = JSON.parse(msg.content.toString());
            this.channel?.ack(msg);
            resolve(response);
          }
        });

        // Solicitar estado al delivery service
        this.channel!.sendToQueue(
          'delivery_status_queue',
          Buffer.from(JSON.stringify({ orderId })),
          { replyTo: q.queue }
        );
      });
    });
  }
}

export const orderService = new OrderService();