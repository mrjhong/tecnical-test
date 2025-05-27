export interface InventoryItem {
    productId: string;
    name: string;
    quantity: number;
    price: number;
  }
  
  export interface InventoryCheckRequest {
    orderId: string;
    items: {
      productId: string;
      quantity: number;
    }[];
  }
  
  export interface InventoryCheckResponse {
    orderId: string;
    isValid: boolean;
    message?: string;
    items?: InventoryItem[];
  }