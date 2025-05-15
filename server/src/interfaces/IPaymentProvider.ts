export interface PaymentHistory {
    userId: string;
    orderDate: Date;
    paymentMethod: string;
    status: string;
    price: number;
    packageId: string;
}

export interface IPaymentProvider {
    getPaymentHistory(userId: string): Promise<PaymentHistory[]>;
    processPayment(userId: string, price: number, packageId: string, paymentMethod: string): Promise<PaymentHistory>;
    refundPayment(transactionId: string): Promise<PaymentHistory>;
} 