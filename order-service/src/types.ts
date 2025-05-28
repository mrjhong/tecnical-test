export interface Order {
  orderId: string;
  customerId: string;
  items: {
    productId: string;
    quantity: number;
  }[];
  shippingAddress: string;
  status: 'created' | 'processing' | 'inventory_validated' | 'inventory_failed' | 'inventory_timeout' | 
          'delivery_processing' | 'completed' | 'delivered' | 'delivery_cancelled' | 'delivery_failed' | 'failed';
}

// Tipos para respuestas de API
export interface OrderResponse {
  message: string;
  order: {
    orderId: string;
    customerId: string;
    status: Order['status'];
    items: Order['items'];
    shippingAddress: string;
  };
}

export interface OrderStatusResponse {
  orderId: string;
  customerId: string;
  status: Order['status'];
  items: Order['items'];
  shippingAddress: string;
  timestamp: string;
}

export interface OrderStats {
  total: number;
  completed: number;
  pending: number;
  statusBreakdown: Record<string, number>;
}

// inventory-service/src/types.ts
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

// delivery-service/src/types.ts
export interface DeliveryOrder {
  orderId: string;
  products: {
    productId: string;
    quantity: number;
  }[];
  shippingAddress: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'failed';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DeliveryStatusUpdate {
  orderId: string;
  status: DeliveryOrder['status'];
  timestamp: string;
  service: 'delivery';
  message?: string;
}