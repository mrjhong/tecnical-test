import { InventoryItem, InventoryCheckRequest, InventoryCheckResponse } from './types';
import * as amqp from 'amqplib';

class InventoryService {
  private inventory: InventoryItem[] = [
    { productId: '1', name: 'Product 1', quantity: 10, price: 100 },
    { productId: '2', name: 'Product 2', quantity: 5, price: 200 },
    { productId: '3', name: 'Product 3', quantity: 3, price: 150 },
  ];
  
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;

  async initialize() {
    this.connection = await amqp.connect('amqp://localhost');
    this.channel = await this.connection.createChannel();
    
    // Cola para recibir solicitudes de validación
    await this.channel.assertQueue('inventory_queue');
    
    this.channel.consume('inventory_queue', async (msg) => {
      if (msg) {
        const request: InventoryCheckRequest = JSON.parse(msg.content.toString());
        const response = this.checkInventory(request);
        
        // Publicar respuesta en la cola de respuesta
        this.channel?.sendToQueue(
          msg.properties.replyTo,
          Buffer.from(JSON.stringify(response)),
          { correlationId: msg.properties.correlationId }
        );
        
        this.channel?.ack(msg);
      }
    });
  }

  checkInventory(request: InventoryCheckRequest): InventoryCheckResponse {
    const invalidItems: string[] = [];
    
    for (const item of request.items) {
      const inventoryItem = this.inventory.find(i => i.productId === item.productId);
      
      if (!inventoryItem || inventoryItem.quantity < item.quantity) {
        invalidItems.push(item.productId);
      }
    }
    
    if (invalidItems.length > 0) {
      return {
        orderId: request.orderId,
        isValid: false,
        message: `Insufficient stock for products: ${invalidItems.join(', ')}`
      };
    }
    
    // Simular reserva de inventario
    request.items.forEach(item => {
      const inventoryItem = this.inventory.find(i => i.productId === item.productId)!;
      inventoryItem.quantity -= item.quantity;
    });
    
    return {
      orderId: request.orderId,
      isValid: true,
      message: 'Inventory reserved successfully'
    };
  }

    getInventory(): InventoryItem[] {
        return this.inventory;
    }
}

export const inventoryService = new InventoryService();