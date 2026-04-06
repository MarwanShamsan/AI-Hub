export type RequestFormValues = {
  productName: string;
  targetCountry: string;
  quantity: string;
  requirements: string;
};

export type RequestFormErrors = Partial<Record<keyof RequestFormValues, string>>;