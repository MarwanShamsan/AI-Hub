import { z } from "zod";

export const createDealFromRequestSchema = z.object({
  request_id: z.string().min(1),
  buyer_id: z.string().min(1),
  supplier_id: z.string().min(1),
  deal_title: z.string().min(1),
  currency: z.string().min(1)
});

export type CreateDealFromRequestBody = z.infer<typeof createDealFromRequestSchema>;