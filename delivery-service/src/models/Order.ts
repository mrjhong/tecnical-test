import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import { OrderItem } from './OrderItem';

export interface OrderAttributes {
  id: string;
  customerId: string;
  status: 'created' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | String;
  totalAmount: number;
  shippingAddress: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Order extends Model<OrderAttributes> implements OrderAttributes {
  public id!: string;
  public customerId!: string;
  public status!: 'created' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  public totalAmount!: number;
  public shippingAddress!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  
  // Asociación con OrderItems
  public items?: OrderItem[];
}

Order.init({
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  customerId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('created', 'processing', 'shipped', 'delivered', 'cancelled'),
    defaultValue: 'created'
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  shippingAddress: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'Order',
  tableName: 'orders',
  timestamps: true
});