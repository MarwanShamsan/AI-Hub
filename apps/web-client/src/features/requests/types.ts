export type RequestFormValues = {
  requestTitle: string;
  destinationCountry: string;
  quantityValue: string;
  quantityUnit: string;
  requestBrief: string;

  preferredSupplierCountry: string;
  certificationsRequired: string;
  packagingRequirements: string;
  shippingPreference: string;
  budgetRange: string;
  targetDeliveryTimeline: string;
};

export type RequestFormErrors = Partial<Record<keyof RequestFormValues, string>>;