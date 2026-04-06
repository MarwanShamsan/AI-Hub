import { RequestFormErrors, RequestFormValues } from "./types";

export function validateRequestForm(
  values: RequestFormValues
): RequestFormErrors {
  const errors: RequestFormErrors = {};

  if (!values.productName.trim()) {
    errors.productName = "Product name is required.";
  }

  if (!values.targetCountry.trim()) {
    errors.targetCountry = "Target country is required.";
  }

  if (!values.quantity.trim()) {
    errors.quantity = "Quantity is required.";
  }

  if (!values.requirements.trim()) {
    errors.requirements = "Constraints and requirements are required.";
  }

  return errors;
}

export function hasRequestFormErrors(errors: RequestFormErrors): boolean {
  return Object.keys(errors).length > 0;
}