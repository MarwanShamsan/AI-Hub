import { SupplierQualificationStatus } from "../types/supplier";

export type SupplierStatusTone = "neutral" | "warning" | "danger" | "success";

export type SupplierStatusPresentation = {
  labelKey: string;
  descriptionKey: string;
  tone: SupplierStatusTone;
};

export function getSupplierStatusPresentation(
  status: SupplierQualificationStatus | null | undefined
): SupplierStatusPresentation {
  switch (status) {
    case "DRAFT":
      return {
        labelKey: "status.DRAFT",
        descriptionKey: "statusDescription.DRAFT",
        tone: "neutral"
      };

    case "PROFILE_INCOMPLETE":
      return {
        labelKey: "status.PROFILE_INCOMPLETE",
        descriptionKey: "statusDescription.PROFILE_INCOMPLETE",
        tone: "warning"
      };

    case "READY_FOR_REVIEW":
      return {
        labelKey: "status.READY_FOR_REVIEW",
        descriptionKey: "statusDescription.READY_FOR_REVIEW",
        tone: "neutral"
      };

    case "PENDING_REVIEW":
      return {
        labelKey: "status.PENDING_REVIEW",
        descriptionKey: "statusDescription.PENDING_REVIEW",
        tone: "neutral"
      };

    case "MISSING_REQUIREMENTS":
      return {
        labelKey: "status.MISSING_REQUIREMENTS",
        descriptionKey: "statusDescription.MISSING_REQUIREMENTS",
        tone: "warning"
      };

    case "REJECTED_PREDEAL":
      return {
        labelKey: "status.REJECTED_PREDEAL",
        descriptionKey: "statusDescription.REJECTED_PREDEAL",
        tone: "danger"
      };

    case "APPROVED_FOR_DISCOVERY":
      return {
        labelKey: "status.APPROVED_FOR_DISCOVERY",
        descriptionKey: "statusDescription.APPROVED_FOR_DISCOVERY",
        tone: "success"
      };

    default:
      return {
        labelKey: "status.UNKNOWN",
        descriptionKey: "statusDescription.UNKNOWN",
        tone: "neutral"
      };
  }
}

export function isSupplierApproved(
  status: SupplierQualificationStatus | null | undefined
): boolean {
  return status === "APPROVED_FOR_DISCOVERY";
}

export function isSupplierReadyOrUnderReview(
  status: SupplierQualificationStatus | null | undefined
): boolean {
  return status === "READY_FOR_REVIEW" || status === "PENDING_REVIEW";
}

export function supplierNeedsAction(
  status: SupplierQualificationStatus | null | undefined
): boolean {
  return (
    status === "PROFILE_INCOMPLETE" ||
    status === "MISSING_REQUIREMENTS" ||
    status === "REJECTED_PREDEAL"
  );
}