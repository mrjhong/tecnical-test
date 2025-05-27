"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const inventory_controller_1 = require("./inventory.controller");
const inventory_service_1 = require("./inventory.service");
const app = (0, express_1.default)();
const PORT = 3001;
app.use(express_1.default.json());
app.get('/inventory', inventory_controller_1.getInventory);
app.listen(PORT, async () => {
    await inventory_service_1.inventoryService.initialize();
    console.log(`Inventory service running on port ${PORT}`);
});
//# sourceMappingURL=server.js.map