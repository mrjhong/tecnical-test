"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrderStatus = exports.createOrder = void 0;
const order_service_1 = require("./order.service");
const createOrder = async (req, res) => {
    try {
        const order = await order_service_1.orderService.createOrder(req.body);
        res.status(201).json(order);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create order' });
    }
};
exports.createOrder = createOrder;
const getOrderStatus = async (req, res) => {
    const { orderId } = req.params;
    const order = order_service_1.orderService.getOrderStatus(orderId);
    if (!order) {
        return res.status(404).json({ error: 'Order not found' });
    }
    return res.json(order);
};
exports.getOrderStatus = getOrderStatus;
//# sourceMappingURL=order.controller.js.map