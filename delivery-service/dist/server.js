"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const delivery_controller_1 = require("./delivery.controller");
const delivery_service_1 = require("./delivery.service");
const app = (0, express_1.default)();
const PORT = 3002;
app.use(express_1.default.json());
app.get('/delivery/:orderId', delivery_controller_1.getOrderStatus);
app.listen(PORT, async () => {
    await delivery_service_1.deliveryService.initialize();
    console.log(`Delivery service running on port ${PORT}`);
});
//# sourceMappingURL=server.js.map