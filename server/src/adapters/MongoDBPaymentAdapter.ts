import { IPaymentProvider, PaymentHistory } from '../interfaces/IPaymentProvider';
import PaymentHistories from '../models/paymentHistories';

export class MongoDBPaymentAdapter implements IPaymentProvider {
    async getPaymentHistory(userId: string): Promise<PaymentHistory[]> {
        try {
            const histories = await PaymentHistories.find({ userId }).exec();
            return histories.map(history => ({
                userId: history.userId,
                orderDate: history.orderDate,
                paymentMethod: history.paymentMethod,
                status: history.status,
                price: history.price,
                packageId: history.packageId
            }));
        } catch (error: any) {
            throw new Error(`Failed to fetch payment history: ${error.message}`);
        }
    }

    async processPayment(
        userId: string, 
        price: number, 
        packageId: string, 
        paymentMethod: string
    ): Promise<PaymentHistory> {
        try {
            const newPayment = await PaymentHistories.create({
                userId,
                orderDate: new Date(),
                paymentMethod,
                status: 'completed',
                price,
                packageId
            });

            return {
                userId: newPayment.userId,
                orderDate: newPayment.orderDate,
                paymentMethod: newPayment.paymentMethod,
                status: newPayment.status,
                price: newPayment.price,
                packageId: newPayment.packageId
            };
        } catch (error: any) {
            throw new Error(`Failed to process payment: ${error.message}`);
        }
    }

    async refundPayment(transactionId: string): Promise<PaymentHistory> {
        try {
            const payment = await PaymentHistories.findById(transactionId);
            if (!payment) {
                throw new Error('Payment not found');
            }

            payment.status = 'refunded';
            await payment.save();

            return {
                userId: payment.userId,
                orderDate: payment.orderDate,
                paymentMethod: payment.paymentMethod,
                status: payment.status,
                price: payment.price,
                packageId: payment.packageId
            };
        } catch (error: any) {
            throw new Error(`Failed to refund payment: ${error.message}`);
        }
    }
} 