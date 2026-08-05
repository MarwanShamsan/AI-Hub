import { z } from "zod";

export const updateSupplierProfileSchema = z.object({
  supplier_type: z
    .enum([
      "manufacturer",
      "trading_company",
      "exporter",
      "distributor",
      "other"
    ])
    .optional(),

  legal_name: z.string().trim().min(1).max(255).optional(),
  registration_number: z.string().trim().min(1).max(255).optional(),
  registration_country: z.string().trim().min(1).max(255).optional(),
  business_category: z.string().trim().min(1).max(255).optional(),
  product_categories: z.array(z.string().trim().min(1).max(255)).optional(),
  operational_contact_name: z.string().trim().min(1).max(255).optional(),
  operational_contact_email: z.string().trim().email().max(255).optional(),
  operational_contact_phone: z.string().trim().min(3).max(50).optional(),
  declared_license_expiry_date: z.string().trim().min(1).max(50).nullable().optional()
});