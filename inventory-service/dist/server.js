"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const inventory_service_1 = require("./services/inventory.service");
const inventory_routes_1 = __importDefault(require("./routes/inventory.routes"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use(express_1.default.json());
// Rutas
app.use(inventory_routes_1.default);
app.listen(PORT, async () => {
    try {
        await inventory_service_1.inventoryService.initialize();
        console.log(`Inventory service running on port ${PORT}`);
        console.log('Available endpoints:');
        console.log('  GET /inventory - Get all inventory');
        console.log('  POST /inventory/add-stock - Add stock to product');
    }
    catch (error) {
        console.error('Failed to start inventory service:', error);
        process.exit(1);
    }
});
//# sourceMappingURL=server.js.map