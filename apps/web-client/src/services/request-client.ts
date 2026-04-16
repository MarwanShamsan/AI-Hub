import { apiClient } from "../lib/apiClient";
import { getAccessToken } from "../lib/storage";
import type { RequestFormValues } from "../features/requests/types";

export type RequestRecord = {
  request_id: string;
  tenant_id: string;
  created_by: string;
  status: "DRAFT" | "READY_FOR_DISCOVERY" | "DISCOVERY_IN_PROGRESS" | "READY_FOR_HANDOFF";
  raw_input: RequestPayload;
  normalized_input: RequestPayload;
  confirmed_input: RequestPayload;
  created_at: string;
  updated_at: string;
};

export type RequestFileRecord = {
  id: string;
  request_id: string;
  tenant_id: string;
  uploaded_by: string;
  file_name: string;
  content_type: string;
  file_size_bytes: number;
  created_at: string;
};

export type RequestExtractionRecord = {
  id: string;
  request_id: string;
  tenant_id: string;
  source_file_id: string | null;
  source_type: "PDF_TEXT" | "PDF_OCR" | "IMAGE_OCR" | "MANUAL_MERGE";
  extracted_text: string | null;
  extracted_payload: Record<string, unknown>;
  confidence_payload: Record<string, unknown>;
  missing_fields: unknown[];
  warnings: unknown[];
  review_status: "PENDING_REVIEW" | "CONFIRMED" | "REJECTED" | "SUPERSEDED";
  created_by: string;
  confirmed_by: string | null;
  confirmed_at: string | null;
  created_at: string;
};

export type RequestPayload = {
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

export type CreateRequestResponse = {
  status: "ACCEPTED";
  request: RequestRecord;
};

export type GetRequestResponse = {
  status: "ACCEPTED";
  request: RequestRecord;
};

export type ListRequestsResponse = {
  status: "ACCEPTED";
  count: number;
  requests: RequestRecord[];
};

export type ListRequestFilesResponse = {
  status: "ACCEPTED";
  count: number;
  files: RequestFileRecord[];
};

export type UploadRequestFileResponse = {
  status: "ACCEPTED";
  file: RequestFileRecord;
};

export type ListRequestExtractionsResponse = {
  status: "ACCEPTED";
  count: number;
  extractions: RequestExtractionRecord[];
};

export type CreateRequestExtractionResponse = {
  status: "ACCEPTED";
  extraction: RequestExtractionRecord;
};

export function mapFormValuesToRequestPayload(
  values: RequestFormValues
): RequestPayload {
  return {
    request_title: values.requestTitle.trim(),
    destination_country: values.destinationCountry.trim(),
    quantity_value: values.quantityValue.trim(),
    quantity_unit: values.quantityUnit.trim(),
    request_brief: values.requestBrief.trim(),
    preferred_supplier_country: values.preferredSupplierCountry.trim(),
    certifications_required: values.certificationsRequired.trim(),
    packaging_requirements: values.packagingRequirements.trim(),
    shipping_preference: values.shippingPreference.trim(),
    budget_range: values.budgetRange.trim(),
    target_delivery_timeline: values.targetDeliveryTimeline.trim()
  };
}

async function uploadMultipartFile<T>(
  path: string,
  file: File
): Promise<T> {
  const token = getAccessToken();

  if (!token) {
    throw new Error("MISSING_OR_INVALID_AUTH");
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${import.meta.env.VITE_REQUEST_API_URL || "http://localhost:3003"}${path}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.message || err?.reason || err?.error || "Upload failed");
  }

  return response.json();
}

export const requestClient = {
  createRequest: (values: RequestFormValues) =>
    apiClient.requestPost<CreateRequestResponse>(
      "/requests",
      mapFormValuesToRequestPayload(values)
    ),

  getRequests: () =>
    apiClient.requestGet<ListRequestsResponse>("/requests"),

  getRequest: (requestId: string) =>
    apiClient.requestGet<GetRequestResponse>(`/requests/${requestId}`),

  updateRequest: (requestId: string, values: RequestFormValues) =>
    apiClient.requestPut<CreateRequestResponse>(
      `/requests/${requestId}`,
      mapFormValuesToRequestPayload(values)
    ),

  getRequestFiles: (requestId: string) =>
    apiClient.requestGet<ListRequestFilesResponse>(`/requests/${requestId}/files`),

  uploadRequestFile: (requestId: string, file: File) =>
    uploadMultipartFile<UploadRequestFileResponse>(
      `/requests/${requestId}/files`,
      file
    ),

  getRequestExtractions: (requestId: string) =>
    apiClient.requestGet<ListRequestExtractionsResponse>(
      `/requests/${requestId}/extractions`
    ),

  runRequestExtraction: (requestId: string) =>
    apiClient.requestPost<CreateRequestExtractionResponse>(
      `/requests/${requestId}/extract`
    )
};