export interface DeliveryOrder {
  orderId: string;
  customerId: string;
  status: 'created' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  totalAmount: number;
  shippingAddress: string;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OrderCreationRequest {
  orderId: string;
  customerId: string;
  items: {
    productId: string;
    quantity: number;
  }[];
  shippingAddress: string;
  inventoryValidated: boolean;
}

export interface OrderStatistics {
  totalOrders: number;
  recentOrders: number;
  statusBreakdown: Record<string, number>;
}

// inventory-service/src/types.ts (sin cambios)
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
  timestamp?: string;
}