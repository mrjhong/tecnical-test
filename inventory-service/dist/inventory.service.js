"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventoryService = void 0;
const amqp = __importStar(require("amqplib"));
class InventoryService {
    constructor() {
        this.inventory = [
            { productId: '1', name: 'Product 1', quantity: 10, price: 100 },
            { productId: '2', name: 'Product 2', quantity: 5, price: 200 },
            { productId: '3', name: 'Product 3', quantity: 3, price: 150 },
        ];
        this.connection = null;
        this.channel = null;
    }
    async initialize() {
        this.connection = await amqp.connect('amqp://localhost');
        this.channel = await this.connection.createChannel();
        // Cola para recibir solicitudes de validación
        await this.channel.assertQueue('inventory_queue');
        this.channel.consume('inventory_queue', async (msg) => {
            var _a, _b;
            if (msg) {
                const request = JSON.parse(msg.content.toString());
                const response = this.checkInventory(request);
                // Publicar respuesta en la cola de respuesta
                (_a = this.channel) === null || _a === void 0 ? void 0 : _a.sendToQueue(msg.properties.replyTo, Buffer.from(JSON.stringify(response)), { correlationId: msg.properties.correlationId });
                (_b = this.channel) === null || _b === void 0 ? void 0 : _b.ack(msg);
            }
        });
    }
    checkInventory(request) {
        const invalidItems = [];
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
            const inventoryItem = this.inventory.find(i => i.productId === item.productId);
            inventoryItem.quantity -= item.quantity;
        });
        return {
            orderId: request.orderId,
            isValid: true,
            message: 'Inventory reserved successfully'
        };
    }
    getInventory() {
        return this.inventory;
    }
}
exports.inventoryService = new InventoryService();
//# sourceMappingURL=inventory.service.js.map