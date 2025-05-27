export interface DeliveryOrder {
    orderId: string;
    products: {
      productId: string;
      quantity: number;
    }[];
    shippingAddress: string;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  }