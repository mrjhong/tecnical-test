"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInventory = void 0;
const inventory_service_1 = require("./inventory.service");
const getInventory = async (req, res) => {
    res.json(inventory_service_1.inventoryService.getInventory());
};
exports.getInventory = getInventory;
//# sourceMappingURL=inventory.controller.js.map