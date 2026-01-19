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
  async getTransactions(): Promise<ApiResponse<any>> {
    return apiClient.get<any>(API.ENDPOINTS.TRANSACTIONS);
  },
};
