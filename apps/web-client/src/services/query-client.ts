import { apiClient } from "../lib/apiClient";
import type {
  DealsListResponse,
  DealResponse,
  TimerResponse
} from "../types/api";

export const queryClient = {
  getDeals: () => apiClient.queryGet<DealsListResponse>("/deals"),

  getDeal: (dealId: string) =>
    apiClient.queryGet<DealResponse>(`/deals/${dealId}`),

  getTimer: (dealId: string) =>
    apiClient.queryGet<TimerResponse>(`/deals/${dealId}/timer`)
};