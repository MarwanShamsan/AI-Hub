import { apiClient } from "../lib/apiClient";

export const commandClient = {
  createDealFromRequest: (payload: {
    request_id: string;
    buyer_id: string;
    supplier_id: string;
    deal_title: string;
    currency: string;
  }) => apiClient.commandPost("/deals/from-request", payload)
};