const en = {
  app: {
    name: "Supplier Portal",
    tagline: "Supplier onboarding, qualification, and discovery readiness."
  },

  nav: {
    dashboard: "Dashboard",
    profile: "Profile",
    documents: "Documents",
    qualification: "Qualification",
    contracts: "Contracts",
    inspection: "Inspection",
    shipment: "Shipment",
    logout: "Logout",
    supplierAccount: "Supplier account"
  },

  locale: {
    label: "Language",
    english: "English",
    arabic: "العربية"
  },

  auth: {

    register: {
    title:
      "Create supplier account",

    subtitle:
      "Register your company to begin supplier onboarding and qualification.",

    username:
      "Username",

    usernamePlaceholder:
      "Choose a username",

    usernameInvalid:
      "Use 3–32 lowercase letters, numbers, dots, underscores, or hyphens.",

    email:
      "Business email",

    emailPlaceholder:
      "Enter your business email",

    emailRequired:
      "Email is required.",

    password:
      "Password",

    passwordPlaceholder:
      "Create a password",

    passwordPolicy:
      "Password must contain 8–128 characters, including at least one letter and one number.",

    confirmPassword:
      "Confirm password",

    confirmPasswordPlaceholder:
      "Enter the password again",

    passwordMismatch:
      "Passwords do not match.",

    submit:
      "Create supplier account",

    submitting:
      "Creating account...",

    failed:
      "Unable to create the supplier account.",

    pendingTitle:
      "Verify your business email",

    pendingDescription:
      "A verification link was sent to the email address below. Open it before signing in.",

    returnToLogin:
      "Return to sign in",

    haveAccount:
      "Already have an account?",

    signIn:
      "Sign in"
  },

  verifyEmail: {
    loadingTitle:
      "Verifying your email",

    loadingDescription:
      "Please wait while we verify your supplier account.",

    successTitle:
      "Email verified",

    successDescription:
      "Your supplier account has been verified. You can now sign in.",

    signIn:
      "Sign in",

    errorTitle:
      "Verification failed",

    missingToken:
      "The verification link does not contain a valid token.",

    failed:
      "The email address could not be verified.",

    returnToLogin:
      "Return to sign in"
  },


    login: {
      noAccount:
        "Do not have a partner account?",

      createAccount:
        "Create supplier account",

      title:
        "Supplier sign in",

      subtitle:
        "Access your supplier onboarding and qualification workspace.",

      identifier:
        "Username or email",

      identifierPlaceholder:
        "Enter your username or email",

      identifierRequired:
        "Username or email is required.",

      password:
        "Password",

      passwordPlaceholder:
        "Enter your password",

      passwordRequired:
        "Password is required.",

      submit:
        "Sign in",

      submitting:
        "Signing in...",

      failed:
        "Unable to sign in.",

      verificationEmail:
        "Verification email",

      verificationEmailPlaceholder:
        "Enter your registered email",

      verificationEmailRequired:
        "Enter the email used to create the supplier account.",

      resend:
        "Resend verification email",

      resending:
        "Sending verification email...",

      verificationSent:
        "If the account is eligible, a verification email has been sent.",

      resendFailed:
        "Unable to resend the verification email.",

      forgotPassword:
        "Forgot your password?",
    },

    passwordReset: {
      forgotTitle:
        "Forgot your password?",

      forgotSubtitle:
        "Enter your verified email address and we will send you a secure reset link.",

      email:
        "Email address",

      emailPlaceholder:
        "supplier@example.com",

      emailRequired:
        "Enter your email address.",

      sendLink:
        "Send reset link",

      sending:
        "Sending reset link...",

      requestAccepted:
        "Your request has been accepted.",

      checkInbox:
        "If an eligible account exists for this email, a password reset link has been sent.",

      requestFailed:
        "The request could not be completed. Please try again.",

      resetTitle:
        "Create a new password",

      resetSubtitle:
        "Choose a strong password for your AI Hub supplier account.",

      newPassword:
        "New password",

      newPasswordPlaceholder:
        "Enter a new password",

      confirmPassword:
        "Confirm new password",

      confirmPasswordPlaceholder:
        "Enter the password again",

      passwordHelp:
        "Use at least 8 characters with at least one letter and one number.",

      passwordPolicy:
        "The password must contain at least 8 characters, one letter, and one number.",

      passwordMismatch:
        "The passwords do not match.",

      tokenInvalid:
        "This password reset link is invalid.",

      tokenExpired:
        "This password reset link has expired. Request a new link.",

      tokenConsumed:
        "This password reset link has already been used.",

      confirmFailed:
        "The password could not be reset. Please request a new link.",

      resetButton:
        "Reset password",

      resetting:
        "Resetting password...",

      resetSuccess:
        "Your password has been reset successfully. All previous sessions have been signed out.",

      loginNow:
        "Sign in with the new password",

      returnToLogin:
        "Return to sign in"
    },

    errors: {

      emailAlreadyVerified:
      "This email address is already verified.",

    verificationTokenInvalid:
      "The verification link is invalid.",

    verificationTokenExpired:
      "The verification link has expired.",

    verificationTokenConsumed:
      "This verification link has already been used.",

    usernameAlreadyExists:
      "This username is already in use.",

    emailAlreadyExists:
      "This email address is already registered.",

    invalidRegistrationPayload:
      "Review the registration information and try again.",

    passwordPolicyFailed:
      "The password does not meet the security requirements.",
      invalidCredentials:
        "The username/email or password is incorrect.",

      emailNotVerified:
        "Verify your email before signing in.",

      roleMismatch:
        "This account is not a supplier account.",

      resendRateLimited:
        "Too many verification requests. Try again later.",

      userNotAvailable:
        "This supplier account is not available.",

      unauthorized:
        "You are not authorized to access this portal.",

      requestFailed:
        "The request could not be completed."
    }
  },

  dashboard: {
    title: "Complete your supplier onboarding",
    subtitle:
      "Create a qualified supplier profile by completing company information, uploading required business documents, and passing pre-deal qualification.",
    completeProfile: "Complete profile",
    uploadDocuments: "Upload documents",
    loadErrorTitle: "Unable to load dashboard",
    currentStatus: "Current status",
    supplierType: "Supplier type",
    missingProfileFields: "Missing profile fields",
    missingRequiredDocuments: "Missing required documents",
    onboardingChecklistTitle: "Onboarding checklist",
    onboardingChecklistSubtitle:
      "Follow these steps to qualify your supplier profile for discovery."
  },

  profile: {
    title: "Company profile",
    subtitle:
      "Tell us who you are as a supplier. This information is required before document qualification review.",
    openDocuments: "Open documents",
    updateFailed: "Profile update failed",
    saved: "Profile saved",
    updatedSuccessfully: "Supplier profile updated successfully.",
    incompleteTitle: "Profile incomplete",
    incompleteText:
      "Complete the required profile fields before qualification review. Missing: {{fields}}",
    saveButton: "Save supplier profile",

    businessIdentityTitle: "Business identity",
    businessIdentitySubtitle:
      "This information identifies your legal business entity.",
    supplierType: "Supplier type",
    legalName: "Legal name",
    registrationNumber: "Registration number",
    registrationCountry: "Registration country",

    businessOperationsTitle: "Business operations",
    businessOperationsSubtitle:
      "Describe your core business and product scope.",
    businessCategory: "Business category",
    productCategories: "Product categories",

    operationalContactTitle: "Operational contact",
    operationalContactSubtitle:
      "Who should we contact for operational qualification matters?",
    contactName: "Contact name",
    contactEmail: "Contact email",
    contactPhone: "Contact phone",
    declaredLicenseExpiryDate: "Declared license expiry date",

    currentStateTitle: "Current supplier state",
    currentStateSubtitle:
      "A quick summary of your supplier onboarding record.",
    qualificationStatus: "Qualification status",
    lastReasonCode: "Last reason code",
    lastReasonText: "Last reason text",

    placeholderLegalName: "Supplier legal entity name",
    placeholderRegistrationNumber: "Commercial or registration number",
    placeholderRegistrationCountry: "Country of registration",
    placeholderBusinessCategory: "e.g. Industrial Materials",
    placeholderProductCategories: "Comma separated values",
    placeholderContactName: "Operational contact name",
    placeholderContactEmail: "supplier@example.com",
    placeholderContactPhone: "+967...",
    placeholderDate: "YYYY-MM-DD"
  },

  documents: {
    title: "Business documents",
    subtitle:
      "Upload the required business documents first. You can also add optional supporting documents to strengthen your supplier profile.",
    uploadSelected: "Upload selected document",
    uploading: "Uploading...",
    actionFailed: "Document action failed",
    successTitle: "Success",
    uploadedSuccessfully: "Document uploaded successfully.",
    submittedForReview: "The document was uploaded and submitted for review.",
    processingFailed:
      "The document could not be processed right now. The issue was logged internally.",
    missingRequiredTitle: "Missing required documents",
    missingRequiredText:
      "Upload all required documents for your supplier type before qualification review.",

    requiredTitle: "Required documents",
    requiredSubtitle:
      "These are the documents needed for qualification readiness.",
    uploaded: "Uploaded",
    required: "Required",
    replace: "Replace",
    upload: "Upload",
    notUploadedYet: "Not uploaded yet",
    uploadedMeta: "Uploaded: {{file}}",
    declaredNumber: "Declared number",
    expiry: "Expiry",

    uploadPanelRequiredTitle: "Upload required document",
    uploadPanelOptionalTitle: "Upload optional supporting document",
    selectedDocumentType: "Selected document type: {{type}}",
    optionalSubtitle:
      "Optional documents can support your supplier profile, but they do not replace required documents.",
    addOptionalDocument: "Add optional document",
    documentType: "Document type",
    file: "File",
    selectFile: "Select file",
    chooseFileHelp: "Choose a PDF or supported business document file.",
    selectedFile: "Selected: {{file}}",
    declaredDocumentNumber: "Declared document number",
    declaredExpiryDate: "Declared expiry date",
    notes: "Notes",
    optionalNotesPlaceholder: "Optional notes about this document",
    issuingCountry: "Issuing country",
    issuingCountryPlaceholder: "Defaults to the company registration country",
    uploadNewVersion: "Upload newer version",
    previousVersions: "Previous versions",
    evidenceNoticeTitle: "Submitted files are retained",
    evidenceNoticeText:
      "Uploaded evidence cannot be deleted. Upload a newer version when a document must be replaced.",
    uploadedReviewRequired:
      "The document was uploaded, extracted, and is ready for your review.",
    uploadedExtractionFailed:
      "The document was retained, but automatic extraction failed. Upload a clearer version or contact support.",
    processingFailedTitle: "Automatic extraction was not completed",
    processingFailedHelp:
      "The uploaded evidence is still retained. Upload a clearer version to create a new extraction.",
    reviewExtractedData: "Review extracted information",
    provider: "Provider",
    model: "Model",
    field: "Field",
    extractedValue: "Extracted value",
    supplierValue: "Supplier-declared value",
    confidence: "Confidence",
    confirmExtracted: "Confirm extracted information",
    reportCorrection: "Report an incorrect value",
    correctionReason: "Reason for correction",
    correctionReasonPlaceholder:
      "Explain why the extracted value is incorrect.",
    correctionReasonRequired: "Enter a reason for the correction.",
    correctionDifferenceRequired:
      "Change at least one value before submitting a correction.",
    submitCorrection: "Submit correction",
    cancelCorrection: "Cancel",
    savingDeclaration: "Saving...",
    latestDeclarationConfirmed:
      "Your latest declaration confirms the extracted values.",
    latestDeclarationCorrected:
      "Your latest declaration contains one or more corrections.",
    noStructuredFields:
      "No structured fields were extracted from this version. Upload a clearer document.",

    reviewStatus: {
      PROCESSING_FAILED: "Extraction failed",
      REVIEW_REQUIRED: "Review required",
      CONFIRMED: "Confirmed",
      CORRECTION_SUBMITTED: "Correction submitted"
    },

    validation: {
      documentTypeRequired: "Document type is required.",
      fileRequired: "Select a file to upload.",
      fileTooLarge: "File size must be 15 MB or less."
    },

    errorReason: {
      REQUEST_FAILED: "The request failed. Try again.",
      FILE_REQUIRED: "Select a file to upload.",
      FILE_TOO_LARGE: "File size must be 15 MB or less.",
      INVALID_DOCUMENT_TYPE: "The selected document type is invalid.",
      UNSUPPORTED_DOCUMENT_CONTENT_TYPE:
        "Upload a supported PDF or image file.",
      INVALID_SUPERSEDED_FILE:
        "The document version being replaced is no longer current.",
      REPLACEMENT_DOCUMENT_TYPE_MISMATCH:
        "A replacement must use the same document type.",
      DUPLICATE_SUPPLIER_DOCUMENT:
        "This exact file has already been uploaded.",
      DUPLICATE_FILE_DIFFERENT_REQUIREMENT:
        "This exact file is already attached to a different requirement.",
      DOCUMENT_EXTRACTION_NOT_AVAILABLE:
        "There is no extraction available for this document.",
      STALE_DOCUMENT_EXTRACTION:
        "A newer extraction exists. Reload the page and review it.",
      INVALID_DOCUMENT_DECLARATION:
        "The document declaration is invalid.",
      DOCUMENT_DECLARATION_FAILED:
        "The declaration could not be saved.",
      SUPPLIER_FILE_UPLOAD_FAILED:
        "The document could not be uploaded."
    },

    uploadedRequiredTitle: "Uploaded required documents",
    uploadedRequiredSubtitle:
      "These required documents are currently attached to your supplier profile.",
    noRequiredDocsTitle: "No required documents uploaded yet",
    noRequiredDocsText:
      "Upload the required documents first to move your supplier profile toward qualification.",

    optionalTitle: "Optional supporting documents",
    optionalListSubtitle:
      "These documents are optional. They can strengthen your supplier profile, but they do not replace required documents.",
    noOptionalDocsTitle: "No optional documents uploaded yet",
    noOptionalDocsText:
      "Optional supporting documents can be added later if needed.",

    delete: "Delete",
    deleting: "Deleting...",
    confirmDeleteFile: "Are you sure you want to delete this document?",
    deletedSuccessfully: "Document deleted successfully.",

    fields: {
      legalName: "Legal name",
      licenseNumber: "License number",
      registrationNumber: "Registration number",
      issueDate: "Issue date",
      expiryDate: "Expiry date",
      issuingAuthority: "Issuing authority",
      country: "Country",
      taxNumber: "Tax number",
      authorizationNumber: "Authorization number",
      certificateReference: "Certificate reference",
      factoryName: "Factory name",
      documentReference: "Document reference"
    },

    extractionSummary: {
      documentType: "Document type",
      legalName: "Legal name",
      registrationNumber: "Registration number",
      expiryDate: "Expiry date",
      issueDate: "Issue date",
      issuingAuthority: "Issuing authority",
      countryHint: "Country hint",
      certificateReference: "Certificate reference"
    }
  },

  qualification: {
    title: "Qualification status",
    subtitle:
      "Review your supplier qualification result, missing requirements, and the next action needed to become eligible for discovery.",
    runReview: "Run qualification review",
    evaluating: "Evaluating...",
    openDocuments: "Open documents",
    requestFailed: "Qualification request failed",

    currentStatusTitle: "Current qualification status",
    latestReviewTitle: "Latest review",
    latestReviewSubtitle:
      "The latest pre-deal supplier qualification decision.",

    internalStatus: "Internal status",
    lastReasonCode: "Last reason code",
    lastReasonText: "Last reason text",
    latestDecision: "Latest decision",
    decision: "Decision",
    reasonCode: "Reason code",
    reasonText: "Reason text",
    decidedAt: "Decided at",

    noReviewTitle: "No review result yet",
    noReviewText:
      "Run qualification review after completing your supplier profile and uploading required documents.",

    missingProfileTitle: "Missing profile requirements",
    missingProfileSubtitle:
      "These profile fields must be completed before approval.",
    profileLooksCompleteTitle: "Profile looks complete",
    profileLooksCompleteText:
      "The required profile fields are already filled.",

    missingDocumentsTitle: "Missing required documents",
    missingDocumentsSubtitle:
      "These required documents are determined by your supplier type.",
    requiredDocsUploadedTitle: "Required documents uploaded",
    requiredDocsUploadedText:
      "All current required document types are present.",

    nextActionTitle: "Next action",
    nextActionSubtitle:
      "Use the suggested next step to move your supplier profile forward.",
    completeCompanyProfile: "Complete company profile",
    completeCompanyProfileText:
      "Add supplier type, legal identity, registration details, and operational contact information.",
    uploadRequiredDocuments: "Upload required documents",
    uploadRequiredDocumentsText:
      "Add the missing business documents required for your supplier type.",
    runReviewNow: "Run qualification review now"
  },

  status: {
    DRAFT: "Account created",
    PROFILE_INCOMPLETE: "Profile incomplete",
    READY_FOR_REVIEW: "Ready for review",
    PENDING_REVIEW: "Under review",
    MISSING_REQUIREMENTS: "More information required",
    REJECTED_PREDEAL: "Qualification not approved",
    APPROVED_FOR_DISCOVERY: "Qualified for discovery",
    UNKNOWN: "Unknown status"
  },

  statusDescription: {
    DRAFT: "Start your supplier onboarding by completing your company profile.",
    PROFILE_INCOMPLETE:
      "Complete the required company information before qualification review.",
    READY_FOR_REVIEW:
      "Your supplier profile is complete and ready for internal review.",
    PENDING_REVIEW: "Your supplier profile is currently under internal review.",
    MISSING_REQUIREMENTS:
      "Additional information or documents are required to continue the review.",
    REJECTED_PREDEAL:
      "Your supplier profile did not pass pre-deal qualification.",
    APPROVED_FOR_DISCOVERY:
      "Your supplier profile is eligible for supplier discovery.",
    UNKNOWN: "Supplier qualification status is not available."
  },

  supplierType: {
    manufacturer: "Manufacturer",
    trading_company: "Trading company",
    exporter: "Exporter",
    distributor: "Distributor",
    other: "Other"
  },

  documentType: {
    LEGAL_REGISTRATION: "Legal registration",
    TRADE_LICENSE: "Trade license",
    TAX_REGISTRATION: "Tax registration",
    MANUFACTURING_LICENSE: "Manufacturing license",
    EXPORT_LICENSE: "Export license",
    DISTRIBUTION_AUTHORIZATION: "Distribution authorization",
    QUALITY_CERTIFICATE: "Quality certificate",
    FACTORY_PROFILE: "Factory profile",
    OTHER: "Other"
  },

  documentRequirementDescription: {
    LEGAL_REGISTRATION:
      "Proof that the company is a legally registered entity.",
    TRADE_LICENSE:
      "Valid business or trade license for the supplier entity.",
    MANUFACTURING_LICENSE:
      "Proof that the supplier is authorized to operate as a manufacturer."
  },

  nextAction: {
    defaultTitle: "Complete your onboarding",
    defaultText:
      "Finish the next required step to move your supplier profile forward.",
    defaultCta: "Complete profile",

    completeProfileTitle: "Complete company profile",
    completeProfileText:
      "Add the required company information before qualification review.",
    completeProfileCta: "Go to profile",

    uploadDocumentsTitle: "Upload required documents",
    uploadDocumentsText:
      "Your supplier type requires supporting business documents.",
    uploadDocumentsCta: "Upload documents",

    readyForReviewTitle: "Your supplier file is ready for review",
    readyForReviewText:
      "Your company profile and required documents are complete. No action is required from you right now.",
    readyForReviewCta: "View qualification status",

    pendingReviewTitle: "Your supplier file is under review",
    pendingReviewText:
      "Your file and documents are currently being reviewed by the internal team.",
    pendingReviewCta: "View qualification status",

    missingRequirementsTitle: "Additional requirements are needed",
    missingRequirementsText:
      "Review the qualification status to see which documents or information are still required.",
    missingRequirementsCta: "View qualification status",

    rejectedTitle: "Your file was not approved",
    rejectedText:
      "Review the qualification result to understand the reason and any next steps if available.",
    rejectedCta: "View qualification status",

    qualifiedTitle: "Supplier qualified",
    qualifiedText: "Your supplier profile is now eligible for discovery.",
    qualifiedCta: "View status"
  },

  onboardingChecklist: {
    accountCreatedTitle: "Account created",
    accountCreatedDetail: "Your supplier login account is active.",

    completeProfileTitle: "Complete company profile",
    completeProfileDoneDetail: "Required company information is complete.",
    completeProfileMissingDetail: "Missing fields: {{fields}}",

    uploadDocumentsTitle: "Upload required documents",
    uploadDocumentsDoneDetail: "All required documents are uploaded.",
    uploadDocumentsMissingDetail: "Missing documents: {{documents}}",

    reviewTitle: "Qualification review",
    reviewReadyDetail:
      "The required documents were uploaded and the file is ready for internal review.",
    reviewPendingDetail:
      "Your supplier file is currently under internal review.",
    reviewMissingRequirementsDetail:
      "The review found missing requirements or additional documents are needed.",
    reviewRejectedDetail:
      "The internal review is complete and the file was not approved before the deal.",
    reviewApprovedDetail:
      "The internal review is complete and the supplier file has been approved for discovery."
  },

  qualificationSummary: {
    title: "Qualification summary",
    currentStatus: "Current status",
    lastReasonCode: "Last reason code",
    lastReasonText: "Last reason text",
    latestReviewDecision: "Latest review decision"
  },

  requiredDocuments: {
    title: "Required documents",
    subtitle: "The required documents depend on your declared supplier type.",
    documentTypeLabel: "Document type",
    uploaded: "Uploaded",
    notUploaded: "Not uploaded",
    fileLabel: "File",
    versionLabel: "Version",
    currentVersion: "Current",
    declaredNumberLabel: "Declared number",
    declaredExpiryLabel: "Declared expiry"
  },

  common: {
    listSeparator: ", "
  },

  qualificationProfileField: {
    supplier_type:
      "Supplier type",

    legal_name:
      "Legal name",

    registration_number:
      "Registration number",

    registration_country:
      "Registration country",

    operational_contact_email:
      "Operational contact email"
  },

  qualificationReasonCode: {
    SUPPLIER_PROFILE_NOT_FOUND:
      "Supplier profile not found",

    PROFILE_FIELDS_MISSING:
      "Supplier profile fields missing",

    REQUIRED_DOCUMENTS_MISSING:
      "Required documents missing",

    QUALIFICATION_DOCUMENTS_NOT_EXTRACTED:
      "Document data not extracted",

    QUALIFICATION_DOCUMENT_UNREADABLE:
      "Document unreadable",

    DOCUMENT_EXTRACTION_INCOMPLETE:
      "Document extraction incomplete",

    DOCUMENT_REVIEW_REQUIRED:
      "Document review required",

    DOCUMENT_CORRECTIONS_PENDING_VALIDATION:
      "Document corrections require validation",

    STALE_DOCUMENT_DECLARATION:
      "Confirmation uses an outdated extraction",

    DECLARED_DOCUMENT_EXPIRED:
      "Declared document expired",

    LICENSE_EXPIRED:
      "License expired",

    DOCUMENT_EXPIRED:
      "Document expired",

    INVALID_ISSUE_DATE:
      "Invalid issue date",

    INVALID_EXPIRY_DATE:
      "Invalid expiry date",

    ISSUE_DATE_IN_FUTURE:
      "Issue date is in the future",

    ISSUE_DATE_AFTER_EXPIRY:
      "Issue date is after expiry",

    LEGAL_NAME_MISMATCH:
      "Legal name mismatch",

    REGISTRATION_NUMBER_MISMATCH:
      "Registration number mismatch",

    ISSUING_COUNTRY_MISMATCH:
      "Issuing country mismatch",

    DOCUMENT_TYPE_MISMATCH:
      "Document type mismatch",

    DUPLICATE_EVIDENCE_ACROSS_REQUIREMENTS:
      "Evidence reused across requirements",

    FILE_HASH_MISSING:
      "File hash missing",

    LOW_CONFIDENCE_FIELD:
      "Low-confidence data",

    DOCUMENT_VALIDATION_FAILED:
      "Document validation failed",

    QUALIFIED_FOR_DISCOVERY:
      "Qualified for discovery",

    UNKNOWN:
      "Qualification reason unavailable"
  },

  qualificationReason: {
    genericDocument:
      "a required document",

    genericDocuments:
      "the required documents",

    unspecifiedFields:
      "the required fields",

    SUPPLIER_PROFILE_NOT_FOUND:
      "The supplier profile has not been created yet.",

    PROFILE_FIELDS_MISSING:
      "The supplier profile is incomplete. Required fields: {{fields}}.",

    REQUIRED_DOCUMENTS_MISSING:
      "Missing required documents: {{documents}}.",

    QUALIFICATION_DOCUMENTS_NOT_EXTRACTED:
      "Data extraction has not been completed for {{document}}.",

    QUALIFICATION_DOCUMENT_UNREADABLE:
      "{{document}} could not be read. Upload a clearer copy.",

    DOCUMENT_EXTRACTION_INCOMPLETE:
      "The extracted data from {{document}} is incomplete.",

    DOCUMENT_REVIEW_REQUIRED:
      "The extracted data from {{document}} must be confirmed or corrected by the supplier.",

    DOCUMENT_CORRECTIONS_PENDING_VALIDATION:
      "Corrections were submitted for {{document}} and still require validation.",

    STALE_DOCUMENT_DECLARATION:
      "The confirmation for {{document}} is linked to an outdated extraction. Review the latest version.",

    DECLARED_DOCUMENT_EXPIRED:
      "The supplier-provided data indicates that {{document}} has expired.",

    DOCUMENT_EXPIRED:
      "{{document}} has expired.",

    DOCUMENT_EXPIRED_WITH_DATE:
      "{{document}} expired on {{date}}.",

    INVALID_ISSUE_DATE:
      "The issue date in {{document}} could not be interpreted.",

    INVALID_EXPIRY_DATE:
      "The expiry date in {{document}} could not be interpreted.",

    ISSUE_DATE_IN_FUTURE:
      "The issue date in {{document}} is in the future.",

    ISSUE_DATE_AFTER_EXPIRY:
      "The issue date in {{document}} occurs after its expiry date.",

    LEGAL_NAME_MISMATCH:
      "The legal name extracted from {{document}} does not match the legal name in the supplier profile.",

    REGISTRATION_NUMBER_MISMATCH:
      "The registration number extracted from {{document}} does not match the registration number in the supplier profile.",

    ISSUING_COUNTRY_MISMATCH:
      "The issuing country of {{document}} does not match the supplier registration country.",

    DOCUMENT_TYPE_MISMATCH:
      "The uploaded file content does not match the selected document type: {{document}}.",

    DUPLICATE_EVIDENCE_ACROSS_REQUIREMENTS:
      "The same file was used to satisfy multiple different requirements. Upload a valid independent document for each requirement.",

    FILE_HASH_MISSING:
      "The SHA-256 hash is missing for {{document}}.",

    LOW_CONFIDENCE_FIELD:
      "{{document}} contains low-confidence data that requires review.",

    DOCUMENT_VALIDATION_FAILED:
      "One or more documents did not pass the required validation rules.",

    QUALIFIED_FOR_DISCOVERY:
      "The supplier passed pre-deal qualification and is eligible to participate in discovery.",

    UNKNOWN:
      "The supplier profile did not pass the current qualification requirements. Review the required information and documents."
  }
} as const;

export default en;
