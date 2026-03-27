import { apiClient } from './apiClient';

export interface TransactionDTO {
  transactionId: number;
  transactionType: string;
  direction: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  status: string;
  createdAt: string;
  bookingId?: number;
}

export interface WalletDTO {
  balance: number;
  recentTransactions: TransactionDTO[];
}

export const walletService = {
  async getMyWallet(): Promise<WalletDTO> {
    const response = await apiClient('/wallets/my-wallet');
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message || 'Không thể lấy thông tin ví');
  },

  async payBooking(bookingId: number): Promise<boolean> {
    const response = await apiClient(`/wallets/pay-booking/${bookingId}`, {
      method: 'POST'
    });
    if (response.success) {
      return true;
    }
    throw new Error(response.message || 'Thanh toán bằng ví thất bại');
  }
};
