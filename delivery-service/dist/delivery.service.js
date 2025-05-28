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
exports.deliveryService = void 0;
const amqp = __importStar(require("amqplib"));
class DeliveryService {
    constructor() {
        this.orders = [];
        this.connection = null;
        this.channel = null;
    }
    async initialize() {
        try {
            this.connection = await amqp.connect('amqp://localhost');
            this.channel = await this.connection.createChannel();
            // Cola para recibir pedidos listos para despacho
            await this.channel.assertQueue('delivery_queue');
            // Cola para enviar actualizaciones de estado al order-service
            await this.channel.assertQueue('order_status_updates');
            this.channel.consume('delivery_queue', (msg) => {
                var _a, _b;
                if (msg) {
                    try {
                        const order = JSON.parse(msg.content.toString());
                        this.processOrder(order);
                        (_a = this.channel) === null || _a === void 0 ? void 0 : _a.ack(msg);
                    }
                    catch (error) {
                        console.error('Error processing delivery order:', error);
                        (_b = this.channel) === null || _b === void 0 ? void 0 : _b.nack(msg, false, false);
                    }
                }
            });
            console.log('Delivery service initialized successfully');
        }
        catch (error) {
            console.error('Failed to initialize delivery service:', error);
            throw error;
        }
    }
    async processOrder(order) {
        console.log(`Processing delivery for order ${order.orderId}`);
        // Agregar orden con estado inicial
        const deliveryOrder = Object.assign(Object.assign({}, order), { status: 'processing' });
        this.orders.push(deliveryOrder);
        // Notificar al order-service que estamos procesando
        await this.notifyOrderStatus(order.orderId, 'processing');
        // Simular tiempo de procesamiento y preparación
        setTimeout(async () => {
            try {
                // Simular posible fallo (5% de probabilidad)
                if (Math.random() < 0.05) {
                    await this.updateOrderStatus(order.orderId, 'cancelled');
                    console.log(`Order ${order.orderId} cancelled during processing`);
                    return;
                }
                await this.updateOrderStatus(order.orderId, 'shipped');
                console.log(`Order ${order.orderId} shipped successfully`);
                // Simular tiempo de entrega
                setTimeout(async () => {
                    await this.updateOrderStatus(order.orderId, 'delivered');
                    console.log(`Order ${order.orderId} delivered`);
                }, 5000); // 5 segundos para simular entrega
            }
            catch (error) {
                console.error(`Error updating order ${order.orderId}:`, error);
                await this.updateOrderStatus(order.orderId, 'cancelled');
            }
        }, 3000); // 3 segundos para procesar
    }
    async updateOrderStatus(orderId, status) {
        const order = this.orders.find(o => o.orderId === orderId);
        if (order) {
            const previousStatus = order.status;
            order.status = status;
            console.log(`Order ${orderId} status updated from ${previousStatus} to ${status}`);
            // Notificar al order-service
            await this.notifyOrderStatus(orderId, status);
        }
    }
    async notifyOrderStatus(orderId, status) {
        if (this.channel) {
            try {
                const statusUpdate = {
                    orderId,
                    status,
                    timestamp: new Date().toISOString(),
                    service: 'delivery'
                };
                await this.channel.sendToQueue('order_status_updates', Buffer.from(JSON.stringify(statusUpdate)));
                console.log(`Status update sent for order ${orderId}: ${status}`);
            }
            catch (error) {
                console.error(`Failed to send status update for order ${orderId}:`, error);
            }
        }
    }
    getOrderStatus(orderId) {
        const order = this.orders.find(o => o.orderId === orderId);
        return order ? {
            orderId,
            status: order.status,
            shippingAddress: order.shippingAddress,
            products: order.products
        } : { orderId, status: 'not_found' };
    }
    getAllOrders() {
        return this.orders.map(order => (Object.assign({}, order)));
    }
    // Método para simular problemas de entrega
    async simulateDeliveryIssue(orderId) {
        const order = this.orders.find(o => o.orderId === orderId);
        if (order && order.status !== 'delivered' && order.status !== 'cancelled') {
            await this.updateOrderStatus(orderId, 'cancelled');
            return true;
        }
        return false;
    }
}
exports.deliveryService = new DeliveryService();
//# sourceMappingURL=delivery.service.js.map