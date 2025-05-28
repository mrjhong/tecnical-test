"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const delivery_service_1 = require("./services/delivery.service");
const delivery_route_1 = __importDefault(require("./routes/delivery.route"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3002;
app.use(express_1.default.json());
// Rutas
app.use(delivery_route_1.default);
app.listen(PORT, async () => {
    try {
        await delivery_service_1.deliveryService.initialize();
        console.log(`Delivery service running on port ${PORT}`);
        console.log('Available endpoints:');
        console.log('  GET /delivery/:orderId - Get delivery status');
        console.log('  GET /deliveries - Get all deliveries');
        console.log('  POST /delivery/:orderId/simulate-issue - Simulate delivery issue');
    }
    catch (error) {
        console.error('Failed to start delivery service:', error);
        process.exit(1);
    }
});
//# sourceMappingURL=server.js.map