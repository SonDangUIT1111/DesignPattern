import { RequestHandler } from "express";
import { MongoDBPaymentAdapter } from "../adapters/MongoDBPaymentAdapter";
import { IPaymentProvider } from "../interfaces/IPaymentProvider";

// Initialize the payment provider
const paymentProvider: IPaymentProvider = new MongoDBPaymentAdapter();

export const getPaymentHistoriesByUserId: RequestHandler = async (req, res, next) => {
    try {
        const { userId } = req.query;
        
        if (!userId || typeof userId !== 'string') {
            return res.status(400).json({ message: "Invalid userId parameter" });
        }

        const histories = await paymentProvider.getPaymentHistory(userId);
        
        if (!histories || histories.length === 0) {
            return res.status(404).json({ message: "No payment histories found for this user" });
        }
        
        res.status(200).json(histories);
    } catch (error) {
        next(error);
    }
};

export const processPayment: RequestHandler = async (req, res, next) => {
    try {
        const { userId, price, packageId, paymentMethod } = req.body;

        if (!userId || typeof userId !== 'string' || 
            !price || typeof price !== 'number' ||
            !packageId || typeof packageId !== 'string' ||
            !paymentMethod || typeof paymentMethod !== 'string') {
            return res.status(400).json({ message: "Invalid parameters" });
        }

        const payment = await paymentProvider.processPayment(userId, price, packageId, paymentMethod);
        res.status(200).json(payment);
    } catch (error) {
        next(error);
    }
};

export const refundPayment: RequestHandler = async (req, res, next) => {
    try {
        const { transactionId } = req.params;

        if (!transactionId) {
            return res.status(400).json({ message: "Transaction ID is required" });
        }

        const refund = await paymentProvider.refundPayment(transactionId);
        res.status(200).json(refund);
    } catch (error) {
        next(error);
    }
};