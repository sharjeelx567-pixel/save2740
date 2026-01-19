/**
 * Wallet API service
 * Encapsulates all wallet-related API calls and data transformations
 */

import { apiClient } from "@/lib/api-client";
import { API } from "@/lib/constants";
import { WalletData, TransactionsResponse, ApiResponse } from "@/lib/types";

/**
 * Wallet service class
 * Provides methods for wallet operations
 */
export class WalletService {
  /**
   * Fetch wallet balance and account details
   * @returns Promise with wallet data or error
   */
  static async getWalletData(): Promise<ApiResponse<WalletData>> {
    return apiClient.get<WalletData>(API.ENDPOINTS.WALLET);
  }

  /**
   * Fetch transaction history
   * @param type - Filter by transaction type
   * @param startDate - Filter by start date
   * @param endDate - Filter by end date
   * @returns Promise with transactions list or error
   */
  static async getTransactions(
    type?: string,
    startDate?: string,
    endDate?: string
  ): Promise<ApiResponse<TransactionsResponse>> {
    const params = new URLSearchParams();
    if (type) params.append("type", type);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const queryString = params.toString();
    const endpoint = queryString
      ? `${API.ENDPOINTS.TRANSACTIONS}?${queryString}`
      : API.ENDPOINTS.TRANSACTIONS;

    return apiClient.get<TransactionsResponse>(endpoint);
  }

  /**
   * Process wallet top-up (funding)
   * @param amount - Amount to add
   * @param paymentMethodId - Payment method identifier
   * @param paymentType - Type of payment (card, bank, etc.)
   * @returns Promise with transaction details or error
   */
  static async fundWallet(
    amount: number,
    paymentMethodId: string,
    paymentType: string
  ) {
    return apiClient.post(`${API.ENDPOINTS.WALLET}/fund`, {
      amount,
      paymentMethodId,
      paymentType,
    });
  }

  /**
   * Process wallet withdrawal
   * @param amount - Amount to withdraw
   * @param bankAccountId - Bank account for withdrawal
   * @returns Promise with transaction details or error
   */
  static async withdrawFromWallet(amount: number, bankAccountId: string) {
    return apiClient.post(`${API.ENDPOINTS.WALLET}/withdrawal`, {
      amount,
      bankAccountId,
    });
  }
}
