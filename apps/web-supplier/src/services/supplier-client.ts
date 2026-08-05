import { apiRequest } from "../lib/apiClient";

import {
  SupplierDocumentDeclarationField,
  SupplierDocumentDeclarationRecord,
  SupplierDocumentDeclarationType,
  SupplierDocumentReviewRecord,
  SupplierDocumentType,
  SupplierExtractionRecord,
  SupplierFileRecord,
  SupplierProfileRecord,
  SupplierQualificationReviewRecord,
  SupplierRecord,
  UpdateSupplierProfileInput
} from "../types/supplier";

type BootstrapResponse = {
  status: string;
  supplier: SupplierRecord;
  profile: SupplierProfileRecord | null;
};

type ProfileResponse = {
  status: string;
  supplier: SupplierRecord;
  profile: SupplierProfileRecord | null;
};

type FilesResponse = {
  status: string;
  count: number;
  files: SupplierFileRecord[];
};

type DocumentReviewsResponse = {
  status: string;
  count: number;
  documents: SupplierDocumentReviewRecord[];
};

type QualificationResponse = {
  status: string;
  supplier: SupplierRecord;
  profile: SupplierProfileRecord | null;
  latest_review: SupplierQualificationReviewRecord | null;
};

type UploadFileResponse = {
  status:
    | "ACCEPTED"
    | "ACCEPTED_WITH_PROCESSING_ERROR";

  file: SupplierFileRecord;

  extraction: SupplierExtractionRecord | null;

  processing_error: string | null;
};

type SubmitDocumentDeclarationResponse = {
  status: string;
  declaration: SupplierDocumentDeclarationRecord;
};

type QualificationEvaluationResponse = {
  status: string;
  supplier: SupplierRecord | null;
  review: SupplierQualificationReviewRecord;
};

type ApiErrorDetails = {
  status?: number;
  reason?: string;
  serverMessage?: string;
  responseBody?: unknown;
};

type ApiClientError = Error & ApiErrorDetails;

function isPlainObject(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function readStringProperty(
  value: unknown,
  propertyName: string
): string | null {
  if (!isPlainObject(value)) {
    return null;
  }

  const propertyValue =
    value[propertyName];

  if (
    typeof propertyValue !== "string" ||
    !propertyValue.trim()
  ) {
    return null;
  }

  return propertyValue.trim();
}

function getErrorReason(
  error: unknown
): string {
  if (
    error instanceof Error &&
    error.message.trim()
  ) {
    return error.message.trim();
  }

  if (
    isPlainObject(error) &&
    typeof error.message === "string" &&
    error.message.trim()
  ) {
    return error.message.trim();
  }

  return "REQUEST_FAILED";
}

function normalizeClientError(
  error: unknown
): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error(
    getErrorReason(error)
  );
}

async function readJsonSafe(
  response: Response
): Promise<Record<string, unknown> | null> {
  const text =
    await response.text();

  if (!text.trim()) {
    return null;
  }

  try {
    const parsed =
      JSON.parse(text) as unknown;

    if (isPlainObject(parsed)) {
      return parsed;
    }

    console.error(
      "[supplier-client] Unexpected non-object JSON response",
      {
        status: response.status,
        parsed
      }
    );

    return null;
  } catch {
    console.error(
      "[supplier-client] Non-JSON response",
      {
        status: response.status,
        statusText: response.statusText,
        body: text
      }
    );

    return null;
  }
}

async function requestJson<T>(
  path: string,
  init: RequestInit
): Promise<T> {
  let response: Response;

  try {
    response = await apiRequest(
      "request",
      path,
      init
    );
  } catch (transportError: unknown) {
    console.error(
      "[supplier-client] Transport request failed",
      {
        path,
        error: transportError
      }
    );

    throw normalizeClientError(
      transportError
    );
  }

  const data =
    await readJsonSafe(response);

  if (!response.ok) {
    const reason =
      readStringProperty(
        data,
        "reason"
      ) ??
      `HTTP_${response.status}`;

    const serverMessage =
      readStringProperty(
        data,
        "message"
      );

    console.error(
      "[supplier-client] API request rejected",
      {
        path,
        status: response.status,
        reason,
        serverMessage,
        responseBody: data
      }
    );

    const error =
      new Error(reason) as ApiClientError;

    error.status =
      response.status;

    error.reason =
      reason;

    error.serverMessage =
      serverMessage ?? undefined;

    error.responseBody =
      data;

    throw error;
  }

  if (!data) {
    console.error(
      "[supplier-client] Empty or invalid API response",
      {
        path,
        status: response.status
      }
    );

    throw new Error(
      "INVALID_EMPTY_API_RESPONSE"
    );
  }

  return data as unknown as T;
}

async function bootstrapSupplier():
  Promise<BootstrapResponse> {
  return requestJson<BootstrapResponse>(
    "/suppliers/me/bootstrap",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json"
      },

      body: "{}"
    }
  );
}

async function withSupplierBootstrap<T>(
  work: () => Promise<T>
): Promise<T> {
  try {
    return await work();
  } catch (error: unknown) {
    const reason =
      getErrorReason(error);

    if (
      reason !==
      "SUPPLIER_NOT_FOUND"
    ) {
      throw normalizeClientError(
        error
      );
    }

    await bootstrapSupplier();

    return work();
  }
}

function isSupplierDocumentReviewRecord(
  value: unknown
): value is SupplierDocumentReviewRecord {
  if (!isPlainObject(value)) {
    return false;
  }

  const file =
    value.file;

  return (
    isPlainObject(file) &&
    typeof file.id === "string" &&
    file.id.trim().length > 0
  );
}

function normalizeDocumentReviewsResponse(
  response: DocumentReviewsResponse
): DocumentReviewsResponse {
  if (
    !Array.isArray(
      response.documents
    )
  ) {
    throw new Error(
      "INVALID_DOCUMENT_REVIEWS_RESPONSE"
    );
  }

  const documents =
    response.documents.filter(
      isSupplierDocumentReviewRecord
    );

  if (
    documents.length !==
    response.documents.length
  ) {
    console.warn(
      "[supplier-client] Invalid document review entries were removed",
      {
        received:
          response.documents.length,

        accepted:
          documents.length
      }
    );
  }

  return {
    ...response,
    count: documents.length,
    documents
  };
}

export const supplierClient = {
  bootstrap():
    Promise<BootstrapResponse> {
    return bootstrapSupplier();
  },

  getProfile():
    Promise<ProfileResponse> {
    return withSupplierBootstrap(
      () =>
        requestJson<ProfileResponse>(
          "/suppliers/me/profile",
          {
            method: "GET"
          }
        )
    );
  },

  updateProfile(
    input: UpdateSupplierProfileInput
  ): Promise<ProfileResponse> {
    return withSupplierBootstrap(
      () =>
        requestJson<ProfileResponse>(
          "/suppliers/me/profile",
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify(input)
          }
        )
    );
  },

  getFiles():
    Promise<FilesResponse> {
    return withSupplierBootstrap(
      () =>
        requestJson<FilesResponse>(
          "/suppliers/me/files",
          {
            method: "GET"
          }
        )
    );
  },

  async getDocumentReviews():
    Promise<DocumentReviewsResponse> {
    const response =
      await withSupplierBootstrap(
        () =>
          requestJson<DocumentReviewsResponse>(
            "/suppliers/me/document-reviews",
            {
              method: "GET"
            }
          )
      );

    return normalizeDocumentReviewsResponse(
      response
    );
  },

  async uploadFile(input: {
    file: File;
    document_type: SupplierDocumentType;
    issuing_country?: string;
    supersedes_file_id?: string;
    notes?: string;
  }): Promise<UploadFileResponse> {
    const form =
      new FormData();

    form.append(
      "file",
      input.file
    );

    form.append(
      "document_type",
      input.document_type
    );

    const issuingCountry =
      input.issuing_country?.trim();

    if (issuingCountry) {
      form.append(
        "issuing_country",
        issuingCountry
      );
    }

    const supersedesFileId =
      input.supersedes_file_id?.trim();

    if (supersedesFileId) {
      form.append(
        "supersedes_file_id",
        supersedesFileId
      );
    }

    const notes =
      input.notes?.trim();

    if (notes) {
      form.append(
        "notes",
        notes
      );
    }

    const response =
      await withSupplierBootstrap(
        () =>
          requestJson<UploadFileResponse>(
            "/suppliers/me/files",
            {
              method: "POST",
              body: form
            }
          )
      );

    if (
      !response.file ||
      typeof response.file.id !==
        "string"
    ) {
      console.error(
        "[supplier-client] Invalid upload response",
        response
      );

      throw new Error(
        "INVALID_SUPPLIER_FILE_UPLOAD_RESPONSE"
      );
    }

    return response;
  },

  submitDocumentDeclaration(
    fileId: string,
    input: {
      declaration_type:
        SupplierDocumentDeclarationType;

      declared_fields:
        SupplierDocumentDeclarationField[];

      correction_reason?: string;
    }
  ): Promise<SubmitDocumentDeclarationResponse> {
    const normalizedFileId =
      fileId.trim();

    if (!normalizedFileId) {
      return Promise.reject(
        new Error(
          "SUPPLIER_FILE_ID_REQUIRED"
        )
      );
    }

    if (
      !Array.isArray(
        input.declared_fields
      ) ||
      input.declared_fields.length ===
        0
    ) {
      return Promise.reject(
        new Error(
          "INVALID_DOCUMENT_DECLARATION"
        )
      );
    }

    const correctionReason =
      input.correction_reason?.trim();

    if (
      input.declaration_type ===
        "CORRECTION_SUBMITTED" &&
      !correctionReason
    ) {
      return Promise.reject(
        new Error(
          "CORRECTION_REASON_REQUIRED"
        )
      );
    }

    return withSupplierBootstrap(
      () =>
        requestJson<SubmitDocumentDeclarationResponse>(
          `/suppliers/me/files/${encodeURIComponent(
            normalizedFileId
          )}/declarations`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              declaration_type:
                input.declaration_type,

              declared_fields:
                input.declared_fields,

              correction_reason:
                correctionReason ||
                undefined
            })
          }
        )
    );
  },

  getQualification():
    Promise<QualificationResponse> {
    return withSupplierBootstrap(
      () =>
        requestJson<QualificationResponse>(
          "/suppliers/me/qualification",
          {
            method: "GET"
          }
        )
    );
  },

  evaluateQualification():
    Promise<QualificationEvaluationResponse> {
    return withSupplierBootstrap(
      () =>
        requestJson<QualificationEvaluationResponse>(
          "/suppliers/me/qualification/evaluate",
          {
            method: "POST"
          }
        )
    );
  }
};