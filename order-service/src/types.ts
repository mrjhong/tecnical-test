export interface OrderRequest {
  orderId: string;
  customerId: string;
  items: {
    productId: string;
    quantity: number;
  }[];
  shippingAddress: string;
}

export interface OrderResponse {
  orderId: string;
  success: boolean;
  status: string;
  message: string;
  order?: {
    orderId: string;
    customerId: string;
    status: string;
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
  };
}

export interface CoordinatorStats {
  pendingProcesses: number;
  activeSteps: Record<string, number>;
}