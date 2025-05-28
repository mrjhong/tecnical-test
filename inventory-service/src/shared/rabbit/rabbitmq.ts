import * as amqp from 'amqplib';

class RabbitMQConnection {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;

  async connect(): Promise<amqp.Channel> {
    if (this.channel) return this.channel;

    try {
      this.connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
      this.channel = await this.connection.createChannel();
      
      // Configurar colas
      await this.channel.assertQueue('inventory_queue', { durable: true });
      await this.channel.assertQueue('delivery_queue', { durable: true });
      await this.channel.assertQueue('order_status_queue', { durable: true });
      
      console.log('Connected to RabbitMQ');
      return this.channel;
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  async close() {
    if (this.channel) await this.channel.close();
    if (this.connection) await this.connection.close();
  }
}

export const rabbitMQ = new RabbitMQConnection();