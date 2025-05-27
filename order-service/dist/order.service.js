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
exports.orderService = void 0;
const amqp = __importStar(require("amqplib"));
class OrderService {
    constructor() {
        this.orders = [];
        this.connection = null;
        this.channel = null;
    }
    async initialize() {
        this.connection = await amqp.connect('amqp://localhost');
        this.channel = await this.connection.createChannel();
        // Cola para respuestas de inventory
        await this.channel.assertQueue('inventory_response_queue');
        this.channel.consume('inventory_response_queue', (msg) => {
            var _a;
            if (msg) {
                const response = JSON.parse(msg.content.toString());
                this.handleInventoryResponse(response);
                (_a = this.channel) === null || _a === void 0 ? void 0 : _a.ack(msg);
            }
        });
    }
    async createOrder(order) {
        var _a;
        const newOrder = Object.assign(Object.assign({}, order), { status: 'created' });
        this.orders.push(newOrder);
        // Enviar a inventory para validación
        (_a = this.channel) === null || _a === void 0 ? void 0 : _a.sendToQueue('inventory_queue', Buffer.from(JSON.stringify({
            orderId: newOrder.orderId,
            items: newOrder.items
        })), { replyTo: 'inventory_response_queue' });
        return newOrder;
    }
    handleInventoryResponse(response) {
        var _a;
        const order = this.orders.find(o => o.orderId === response.orderId);
        if (!order)
            return;
        if (response.isValid) {
            order.status = 'inventory_checked';
            // Enviar a delivery
            (_a = this.channel) === null || _a === void 0 ? void 0 : _a.sendToQueue('delivery_queue', Buffer.from(JSON.stringify({
                orderId: order.orderId,
                products: order.items,
                shippingAddress: order.shippingAddress,
                status: 'pending'
            })));
            order.status = 'delivery_processing';
        }
        else {
            order.status = 'inventory_failed';
        }
    }
    getOrderStatus(orderId) {
        return this.orders.find(o => o.orderId === orderId);
    }
}
exports.orderService = new OrderService();
//# sourceMappingURL=order.service.js.map