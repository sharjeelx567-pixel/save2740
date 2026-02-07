import { apiClient } from "@/lib/api-client";
import { API } from "@/lib/constants";
import { ApiResponse, WalletData } from "@/lib/types";

export const WalletService = {
  /**
   * Get current wallet data
   */
  async getWalletData(): Promise<ApiResponse<WalletData>> {
    return apiClient.get<WalletData>(API.ENDPOINTS.WALLET);
  },

  /**
   * Get transaction history
   */
  async getTransactions(type?: string, startDate?: string, endDate?: string): Promise<ApiResponse<any>> {
    let url = API.ENDPOINTS.TRANSACTIONS;
    const params = new URLSearchParams();
    if (type) params.append("type", type);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    return apiClient.get<any>(url);
  },

  /**
   * Get pending transactions
   */
  async getPendingTransactions(): Promise<ApiResponse<any>> {
    return apiClient.get<any>(API.ENDPOINTS.TRANSACTIONS_PENDING);
  },

  /**
   * Get failed transactions
   */
  async getFailedTransactions(): Promise<ApiResponse<any>> {
    return apiClient.get<any>(API.ENDPOINTS.TRANSACTIONS_FAILED);
  },

  /**
   * Deposit money to wallet
   */
  async deposit(amount: number, paymentMethodId: string, currency: string = 'usd'): Promise<ApiResponse<any>> {
    return apiClient.post<any>(API.ENDPOINTS.WALLET_DEPOSIT, {
      amount,
      paymentMethodId,
      currency
    });
  },

  /**
   * Withdraw money from wallet
   */
  async withdraw(amount: number, bankAccountId: string, reason?: string): Promise<ApiResponse<any>> {
    return apiClient.post<any>(API.ENDPOINTS.WALLET_WITHDRAW, {
      amount,
      bankAccountId,
      reason
    });
  },

  /**
   * Get wallet limits
   */
  async getLimits(): Promise<ApiResponse<any>> {
    return apiClient.get<any>(API.ENDPOINTS.WALLET_LIMITS);
  },

  /**
   * Get escrow balance
   */
  async getEscrowBalance(): Promise<ApiResponse<any>> {
    return apiClient.get<any>(API.ENDPOINTS.WALLET_ESCROW);
  },

  /**
   * Freeze wallet (admin only typically)
   */
  async freezeWallet(reason: string): Promise<ApiResponse<any>> {
    return apiClient.post<any>(API.ENDPOINTS.WALLET_FREEZE, { reason });
  },

  /**
   * Unfreeze wallet
   */
  async unfreezeWallet(): Promise<ApiResponse<any>> {
    return apiClient.post<any>(API.ENDPOINTS.WALLET_UNFREEZE, {});
  },
};

