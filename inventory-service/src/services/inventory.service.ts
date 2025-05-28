// inventory-service/src/services/inventory.service.ts
import { InventoryItem, InventoryCheckRequest, InventoryCheckResponse } from '../types';
import * as amqp from 'amqplib';

class InventoryService {
  private inventory: InventoryItem[] = [
    { productId: '1', name: 'Laptop Gaming', quantity: 10, price: 1299.99 },
    { productId: '2', name: 'Wireless Mouse', quantity: 50, price: 29.99 },
    { productId: '3', name: 'Mechanical Keyboard', quantity: 25, price: 149.99 },
    { productId: '4', name: 'Monitor 4K', quantity: 8, price: 399.99 },
    { productId: '5', name: 'Headphones', quantity: 15, price: 199.99 },
  ];
  
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;

  async initialize() {
    try {
      this.connection = await amqp.connect('amqp://localhost');
      this.channel = await this.connection.createChannel();
      
      // Cola para recibir solicitudes de validación
      await this.channel.assertQueue('inventory_queue');
      
      this.channel.consume('inventory_queue', async (msg) => {
        if (msg) {
          try {
            const request: InventoryCheckRequest = JSON.parse(msg.content.toString());
            console.log(`Processing inventory check for order ${request.orderId}`);
            
            const response = this.checkInventory(request);
            
            // Enviar respuesta usando replyTo y correlationId
            if (msg.properties.replyTo) {
              await this.channel?.sendToQueue(
                msg.properties.replyTo,
                Buffer.from(JSON.stringify(response)),
                { 
                  correlationId: msg.properties.correlationId || request.orderId
                }
              );
              console.log(`Sent inventory response for order ${request.orderId}: ${response.isValid ? 'VALID' : 'INVALID'}`);
            }
            
            this.channel?.ack(msg);
          } catch (error) {
            console.error('Error processing inventory check:', error);
            this.channel?.nack(msg, false, false);
          }
        }
      });
      
      console.log('Inventory service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize inventory service:', error);
      throw error;
    }
  }

  checkInventory(request: InventoryCheckRequest): InventoryCheckResponse {
    const invalidItems: string[] = [];
    const checkedItems: { productId: string; requestedQty: number; availableQty: number }[] = [];
    
    // Verificar disponibilidad para cada item
    for (const item of request.items) {
      const inventoryItem = this.inventory.find(i => i.productId === item.productId);
      
      if (!inventoryItem) {
        invalidItems.push(`${item.productId} (product not found)`);
        checkedItems.push({ 
          productId: item.productId, 
          requestedQty: item.quantity, 
          availableQty: 0 
        });
      } else if (inventoryItem.quantity < item.quantity) {
        invalidItems.push(`${item.productId} (requested: ${item.quantity}, available: ${inventoryItem.quantity})`);
        checkedItems.push({ 
          productId: item.productId, 
          requestedQty: item.quantity, 
          availableQty: inventoryItem.quantity 
        });
      } else {
        checkedItems.push({ 
          productId: item.productId, 
          requestedQty: item.quantity, 
          availableQty: inventoryItem.quantity 
        });
      }
    }
    
    // Si hay items inválidos, retornar error
    if (invalidItems.length > 0) {
      return {
        orderId: request.orderId,
        isValid: false,
        message: `Insufficient stock for: ${invalidItems.join(', ')}`
      };
    }
    
    // Si todo está bien, reservar inventario
    try {
      this.reserveInventory(request.items);
      
      return {
        orderId: request.orderId,
        isValid: true,
        message: 'Inventory reserved successfully',
        items: checkedItems.map(item => {
          const inventoryItem = this.inventory.find(i => i.productId === item.productId)!;
          return {
            productId: item.productId,
            name: inventoryItem.name,
            quantity: inventoryItem.quantity, // cantidad después de la reserva
            price: inventoryItem.price
          };
        })
      };
    } catch (error) {
      return {
        orderId: request.orderId,
        isValid: false,
        message: `Error reserving inventory: ${error}`
      };
    }
  }

  private reserveInventory(items: { productId: string; quantity: number }[]) {
    for (const item of items) {
      const inventoryItem = this.inventory.find(i => i.productId === item.productId);
      if (inventoryItem && inventoryItem.quantity >= item.quantity) {
        inventoryItem.quantity -= item.quantity;
        console.log(`Reserved ${item.quantity} units of product ${item.productId}. Remaining: ${inventoryItem.quantity}`);
      } else {
        throw new Error(`Cannot reserve ${item.quantity} units of product ${item.productId}`);
      }
    }
  }

  getInventory(): InventoryItem[] {
    return this.inventory.map(item => ({ ...item })); // Retornar copia para evitar mutaciones
  }

  // Método para agregar stock (útil para testing)
  addStock(productId: string, quantity: number): boolean {
    const item = this.inventory.find(i => i.productId === productId);
    if (item) {
      item.quantity += quantity;
      console.log(`Added ${quantity} units to product ${productId}. New quantity: ${item.quantity}`);
      return true;
    }
    return false;
  }
}

export const inventoryService = new InventoryService();