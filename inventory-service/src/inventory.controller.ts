import { Request, Response } from 'express';
import { inventoryService } from './inventory.service';

export const getInventory = async (req: Request, res: Response) => {
  res.json(inventoryService.getInventory());
};