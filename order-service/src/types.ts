export interface Order {
    orderId: string;
    customerId: string;
    items: {
      productId: string;
      quantity: number;
    }[];
    shippingAddress: string;
    status: 'created' | 'inventory_checked' | 'inventory_failed' | 'delivery_processing' | 'completed';
  }