import { apiClient } from "./apiClient";

export interface PaymentInfo {
    accountNumber: string;
    bankName: string;
    accountName: string;
}

export interface SyncResult {
    totalProcessed: number;
    paidBookingIds: number[];
    partiallyPaidBookingIds: number[];
}

export const paymentService = {
    getPaymentInfo: async (): Promise<PaymentInfo> => {
        const response = await apiClient('/payments/info');
        return response.data;
    },
    syncSePay: async (): Promise<SyncResult> => {
        const response = await apiClient('/payments/sync-sepay');
        return response.data;
    }
};
