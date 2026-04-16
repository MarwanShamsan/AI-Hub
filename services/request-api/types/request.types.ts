export type RequestInputPayload = {
  request_title: string;
  destination_country: string;
  quantity_value: string;
  quantity_unit: string;
  request_brief: string;

  preferred_supplier_country: string;
  certifications_required: string;
  packaging_requirements: string;
  shipping_preference: string;
  budget_range: string;
  target_delivery_timeline: string;
};

export type CreateRequestPayload = {
  tenant_id: string;
  created_by: string;
  raw_input: RequestInputPayload;
  normalized_input?: RequestInputPayload;
  confirmed_input?: RequestInputPayload;
};

export type UpdateRequestPayload = {
  raw_input: RequestInputPayload;
  normalized_input?: RequestInputPayload;
  confirmed_input?: RequestInputPayload;
};

export type RequestRecord = {
  request_id: string;
  tenant_id: string;
  created_by: string;
  status: "DRAFT" | "READY_FOR_DISCOVERY" | "DISCOVERY_IN_PROGRESS" | "READY_FOR_HANDOFF";
  raw_input: RequestInputPayload;
  normalized_input: RequestInputPayload;
  confirmed_input: RequestInputPayload;
  created_at: string;
  updated_at: string;
};