import { RequestFormErrors, RequestFormValues } from "./types";

export function validateRequestForm(
  values: RequestFormValues
): RequestFormErrors {
  const errors: RequestFormErrors = {};

  if (!values.requestTitle.trim()) {
    errors.requestTitle = "Request title is required.";
  }

  if (!values.destinationCountry.trim()) {
    errors.destinationCountry = "Destination country is required.";
  }

  if (!values.quantityValue.trim()) {
    errors.quantityValue = "Quantity value is required.";
  }

  if (!values.quantityUnit.trim()) {
    errors.quantityUnit = "Quantity unit is required.";
  }

  if (!values.requestBrief.trim()) {
    errors.requestBrief = "Request brief is required.";
  }

  return errors;
}

export function hasRequestFormErrors(errors: RequestFormErrors): boolean {
  return Object.keys(errors).length > 0;
}