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
        this.connection = await amqp.connect('amqp://localhost');
        this.channel = await this.connection.createChannel();
        // Cola para recibir pedidos listos para despacho
        await this.channel.assertQueue('delivery_queue');
        this.channel.consume('delivery_queue', (msg) => {
            var _a;
            if (msg) {
                const order = JSON.parse(msg.content.toString());
                this.processOrder(order);
                (_a = this.channel) === null || _a === void 0 ? void 0 : _a.ack(msg);
            }
        });
    }
    async processOrder(order) {
        console.log(`Processing delivery for order ${order.orderId}`);
        this.orders.push(Object.assign(Object.assign({}, order), { status: 'processing' }));
        // Simular tiempo de procesamiento
        setTimeout(() => {
            this.updateOrderStatus(order.orderId, 'shipped');
            console.log(`Order ${order.orderId} shipped`);
        }, 3000);
    }
    updateOrderStatus(orderId, status) {
        const order = this.orders.find(o => o.orderId === orderId);
        if (order) {
            order.status = status;
        }
    }
    getOrderStatus(orderId) {
        var _a;
        return ((_a = this.orders.find(o => o.orderId === orderId)) === null || _a === void 0 ? void 0 : _a.status) || 'not_found';
    }
}
exports.deliveryService = new DeliveryService();
//# sourceMappingURL=delivery.service.js.map