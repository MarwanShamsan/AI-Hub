export type RequestQuantity = {
  value: number;
  unit: string;
};

export type RequestCreatedPayload = {
  product_name: string;
  target_country: string;
  quantity: RequestQuantity;
  requirements_text: string;
  certifications_required?: string[];
  commercial_notes?: string;
};