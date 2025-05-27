"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const order_controller_1 = require("./order.controller");
const order_service_1 = require("./order.service");
const app = (0, express_1.default)();
const PORT = 3000;
app.use(express_1.default.json());
app.post('/orders', order_controller_1.createOrder);
app.get('/orders/:orderId', order_controller_1.getOrderStatus);
app.listen(PORT, async () => {
    await order_service_1.orderService.initialize();
    console.log(`Order service running on port ${PORT}`);
});
//# sourceMappingURL=server.js.map