import { DataTypes, Model } from 'sequelize';
import sequelize from '../shared/db/database'

export interface OrderAttributes {
  id: string;
  customerId: string;
  status: 'created' | 'inventory_validated' | 'inventory_failed' | 'delivery_scheduled' | 'completed' | 'cancelled';
  totalAmount: number;
  shippingAddress: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Order extends Model<OrderAttributes> implements OrderAttributes {
  public id!: string;
  public customerId!: string;
  public status!: 'created' | 'inventory_validated' | 'inventory_failed' | 'delivery_scheduled' | 'completed' | 'cancelled';
  public totalAmount!: number;
  public shippingAddress!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Order.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  customerId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('created', 'inventory_validated', 'inventory_failed', 'delivery_scheduled', 'completed', 'cancelled'),
    defaultValue: 'created'
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  shippingAddress: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'Order',
  tableName: 'orders'
});