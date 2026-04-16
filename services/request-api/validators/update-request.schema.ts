import { z } from "zod";

export const updateRequestSchema = z.object({
  request_title: z.string().min(1),
  destination_country: z.string().min(1),
  quantity_value: z.string().min(1),
  quantity_unit: z.string().min(1),
  request_brief: z.string().min(1),

  preferred_supplier_country: z.string().optional().default(""),
  certifications_required: z.string().optional().default(""),
  packaging_requirements: z.string().optional().default(""),
  shipping_preference: z.string().optional().default(""),
  budget_range: z.string().optional().default(""),
  target_delivery_timeline: z.string().optional().default("")
});

export type UpdateRequestBody = z.infer<typeof updateRequestSchema>;