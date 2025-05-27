import express from 'express';
import { getInventory } from './inventory.controller';
import { inventoryService } from './inventory.service';

const app = express();
const PORT = 3001;

app.use(express.json());

app.get('/inventory', getInventory);

app.listen(PORT, async () => {
  await inventoryService.initialize();
  console.log(`Inventory service running on port ${PORT}`);
});