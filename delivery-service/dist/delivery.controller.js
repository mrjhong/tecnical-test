"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrderStatus = void 0;
const delivery_service_1 = require("./delivery.service");
const getOrderStatus = async (req, res) => {
    const { orderId } = req.params;
    const status = delivery_service_1.deliveryService.getOrderStatus(orderId);
    res.json({ orderId, status });
};
exports.getOrderStatus = getOrderStatus;
//# sourceMappingURL=delivery.controller.js.map