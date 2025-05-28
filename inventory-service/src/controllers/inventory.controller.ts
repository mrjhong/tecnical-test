import { Request, Response } from 'express';
import { inventoryService } from '../services/inventory.service';

export const getInventoryController = async (req: Request, res: Response): Promise<any> => {
  try {
    const inventory = inventoryService.getInventory();
    res.json({
      count: inventory.length,
      inventory
    });
  } catch (error) {
    console.error('Error getting inventory:', error);
    res.status(500).json({ 
      error: 'Failed to get inventory',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const addStockController = async (req: Request, res: Response): Promise<any> => {
  try {
    const { productId, quantity } = req.body;
    
    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({
        error: 'Product ID and positive quantity are required'
      });
    }

    const success = inventoryService.addStock(productId, quantity);
    
    if (success) {
      res.json({
        message: 'Stock added successfully',
        productId,
        quantityAdded: quantity
      });
    } else {
      res.status(404).json({
        error: 'Product not found',
        productId
      });
    }
  } catch (error) {
    console.error('Error adding stock:', error);
    res.status(500).json({ 
      error: 'Failed to add stock',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};