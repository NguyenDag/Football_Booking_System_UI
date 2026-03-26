import { apiClient } from "./apiClient";

export interface PaymentInfo {
    accountNumber: string;
    bankName: string;
    accountName: string;
}

export const paymentService = {
    getPaymentInfo: async () => {
        const response = await apiClient('/payments/info');
        return response.data;
    },
    syncSePay: async () => {
        const response = await apiClient('/payments/sync-sepay');
        return response.data;
    }
};
