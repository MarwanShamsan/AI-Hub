import type { Messages } from "../types";

export const en: Messages = {
  "common.loading": "Loading...",
  "common.yes": "Yes",
  "common.no": "No",
  "common.notAvailable": "—",
  "common.logout": "Logout",
  "common.language": "Language",
  "common.backToDeals": "← Back to deals",

  "layout.appName": "AI Hub",
  "layout.nav.dashboard": "Dashboard",
  "layout.nav.newRequest": "New Request",
  "layout.nav.discovery": "Discovery",
  "layout.nav.deals": "Deals",
  "layout.nav.disputes": "Disputes",
  "layout.nav.certificates": "Certificates",
  "layout.nav.myRequests": "My Requests",

    "auth.login.title": "Sign in",
    "auth.login.subtitle":
      "Access your AI Hub client workspace.",
    "auth.login.identifier":
      "Username or email",
    "auth.login.identifierRequired":
      "Username or email is required.",
    "auth.login.identifierPlaceholder":
      "Enter your username or email",
    "auth.login.password": "Password",
    "auth.login.passwordRequired":
      "Password is required.",
    "auth.login.passwordPlaceholder":
      "Enter your password",
    "auth.login.failed":
      "Unable to sign in.",
    "auth.login.submit": "Sign in",
    "auth.login.submitting":
      "Signing in...",
    "auth.login.forgotPassword":
      "Forgot password?",
    "auth.login.newHere":
      "New to AI Hub?",
    "auth.login.createAccount":
      "Create a client account",
    "auth.login.verificationEmail":
      "Verification email",
    "auth.login.verificationEmailRequired":
      "Enter the email address used to create the account.",
    "auth.login.verificationEmailPlaceholder":
      "Enter your email address",
    "auth.login.resendVerification":
      "Resend verification email",
    "auth.login.resendingVerification":
      "Sending verification email...",
    "auth.login.verificationSent":
      "If the account is eligible, a verification email has been sent.",
    "auth.login.resendFailed":
      "Unable to resend the verification email.",

    "auth.register.title":
      "Create Client Account",
    "auth.register.subtitle":
      "Create a client account to access sourcing requests and deal tracking.",
    "auth.register.username":
      "Username",
    "auth.register.usernameRequired":
      "Username is required.",
    "auth.register.usernameInvalid":
      "Use 3–32 lowercase letters, numbers, dots, underscores, or hyphens.",
    "auth.register.usernamePlaceholder":
      "Choose a username",
    "auth.register.email": "Email",
    "auth.register.emailRequired":
      "Email is required.",
    "auth.register.password":
      "Password",
    "auth.register.passwordRequired":
      "Password is required.",
    "auth.register.passwordPolicy":
      "Password must contain 8–128 characters, including at least one letter and one number.",
    "auth.register.passwordMismatch":
      "Passwords do not match.",
    "auth.register.failed":
      "Unable to create the account.",
    "auth.register.emailPlaceholder":
      "Enter your email address",
    "auth.register.passwordPlaceholder":
      "Create a password",
    "auth.register.confirmPassword":
      "Confirm password",
    "auth.register.confirmPasswordPlaceholder":
      "Enter the password again",
    "auth.register.submit":
      "Create Client Account",
    "auth.register.submitting":
      "Creating account...",
    "auth.register.haveAccount":
      "Already have an account?",
    "auth.register.signIn":
      "Sign in",
    "auth.register.pendingTitle":
      "Verify your email",
    "auth.register.pendingDescription":
      "We sent a verification link to the email address below. Open it before signing in.",
    "auth.register.returnToLogin":
      "Return to sign in",

    "auth.errors.emailNotVerified":
      "Verify your email address before signing in.",
    "auth.errors.emailAlreadyVerified":
      "This email address is already verified.",
    "auth.errors.verificationTokenInvalid":
      "The verification link is invalid.",
    "auth.errors.verificationTokenExpired":
      "The verification link has expired.",
    "auth.errors.verificationTokenConsumed":
      "This verification link has already been used.",
    "auth.errors.resendRateLimited":
      "Too many verification requests. Try again later.",
    "auth.errors.invalidCredentials":
      "The username/email or password is incorrect.",
    "auth.errors.roleMismatch":
      "This account is not a client account.",
    "auth.errors.usernameAlreadyExists":
      "This username is already in use.",
    "auth.errors.emailAlreadyExists":
      "This email address is already registered.",
    "auth.errors.invalidRegistrationPayload":
      "Review the registration information and try again.",
    "auth.errors.passwordPolicyFailed":
      "The password does not meet the security requirements.",
    "auth.errors.sessionExpired":
      "Your session has expired. Sign in again.",
    "auth.errors.unauthorized":
      "You are not authorized to perform this action.",
    "auth.errors.userNotAvailable":
      "This account is not available.",
    "auth.errors.requestFailed":
      "The request could not be completed.",

  "dashboard.title": "Dashboard",
  "dashboard.subtitle":
    "Read-only derived deal overview from sovereign query projections.",
  "dashboard.loading": "Loading dashboard...",
  "dashboard.failed": "Failed to load dashboard",
  "dashboard.totalDeals": "Total Deals",
  "dashboard.inTransit": "In Transit",
  "dashboard.disputed": "Disputed",
  "dashboard.completed": "Completed",
  "dashboard.recentDeals": "Recent Deals",
  "dashboard.viewAllDeals": "View all deals",
  "dashboard.noDeals": "No deals found.",
  "dashboard.status": "Status",
  "dashboard.lastEvent": "Last Event",
  "dashboard.updatedAt": "Updated At",
  "dashboard.quickActions": "Quick Actions",

  "deals.list.title": "Deals",
  "deals.list.subtitle": "Read-only deal list from `GET /deals` query projection.",
  "deals.list.statusFilter": "Status",
  "deals.list.loading": "Loading deals...",
  "deals.list.failed": "Failed to load deals",
  "deals.list.empty": "No deals found.",
  "deals.list.supplier": "Supplier",
  "deals.list.currency": "Currency",
  "deals.list.status": "Status",
  "deals.list.lastEvent": "Last Event",
  "deals.list.updatedAt": "Updated At",
  "deals.list.all": "ALL",

  "deals.details.missingDealId": "Missing deal id",
  "deals.details.loading": "Loading deal details...",
  "deals.details.failed": "Failed to load deal details",
  "deals.details.notFound": "Deal not found.",
  "deals.details.status": "Status",
  "deals.details.lastEvent": "Last Event",
  "deals.details.lastEventAt": "Last Event At",
  "deals.details.updatedAt": "Updated At",
  "deals.details.lifecycle": "Lifecycle",
  "deals.details.summary": "Deal Summary",
  "deals.details.tokens": "Tokens",
  "deals.details.dealId": "Deal ID",
  "deals.details.buyerId": "Buyer ID",
  "deals.details.supplierId": "Supplier ID",
  "deals.details.currency": "Currency",
  "deals.details.inspectionPassed": "Inspection Passed",
  "deals.details.shipmentVerified": "Shipment Verified",
  "deals.details.disputeOpen": "Dispute Open",
  "deals.details.dealClosed": "Deal Closed",
  "deals.details.tokenAIssued": "Token A Issued",
  "deals.details.tokenBIssued": "Token B Issued",
  "deals.details.tokenCIssued": "Token C Issued",

  "deals.lifecycle.created": "Created",
  "deals.lifecycle.inspectionPassed": "Inspection Passed",
  "deals.lifecycle.tokenAIssued": "Token A Issued",
  "deals.lifecycle.shipmentVerified": "Shipment Verified",
  "deals.lifecycle.tokenBIssued": "Token B Issued",
  "deals.lifecycle.timerStarted": "Timer Started",
  "deals.lifecycle.timerExpired": "Timer Expired",
  "deals.lifecycle.tokenCIssued": "Token C Issued",
  "deals.lifecycle.dealClosed": "Deal Closed",

  "deals.timeline.title": "Derived Timeline",
  "deals.timeline.dealCreated": "Deal Created",
  "deals.timeline.inspectionPassed": "Inspection Passed",
  "deals.timeline.tokenAIssued": "Token A Issued",
  "deals.timeline.shipmentVerified": "Shipment Verified",
  "deals.timeline.tokenBIssued": "Token B Issued",
  "deals.timeline.timerStarted": "Timer Started",
  "deals.timeline.timerExpired": "Timer Expired",
  "deals.timeline.disputeOpened": "Dispute Opened",
  "deals.timeline.tokenCIssued": "Token C Issued",
  "deals.timeline.dealClosed": "Deal Closed",

  "deals.timer.title": "Timer",
  "deals.timer.noProjection": "No timer projection available for this deal.",
  "deals.timer.state": "State",
  "deals.timer.startedAt": "Started At",
  "deals.timer.expiresAt": "Expires At",
  "deals.timer.expiredAt": "Expired At",
  "deals.timer.updatedAt": "Updated At",

  "requests.new.title": "New Sourcing Request",
  "requests.new.description": "Create a new sourcing request for AI supplier discovery.",
  "requests.new.productName": "Product name",
  "requests.new.targetCountry": "Target country",
  "requests.new.quantity": "Quantity",
  "requests.new.requirements": "Constraints and requirements",
  "requests.new.submit": "Submit Request",
  "requests.new.submitting": "Submitting...",

  "requests.new.requestTitle": "What do you need?",
  "requests.new.destinationCountry": "Destination country or market",
  "requests.new.quantityValue": "Quantity value",
  "requests.new.quantityUnit": "Quantity unit",
  "requests.new.requestBrief": "Request brief, requirements, and notes",
  "requests.new.sectionBasic": "Basic Request",
  "requests.new.sectionBasicDescription": "Start with the minimum information needed for supplier discovery.",
  "requests.new.sectionMore": "Additional Details",
  "requests.new.sectionMoreDescription": "Add more details if you want better discovery accuracy.",
  "requests.new.showMoreDetails": "Add more details",
  "requests.new.hideMoreDetails": "Hide extra details",
  "requests.new.preferredSupplierCountry": "Preferred supplier country",
  "requests.new.certificationsRequired": "Certifications or compliance requirements",
  "requests.new.packagingRequirements": "Packaging or labeling requirements",
  "requests.new.shippingPreference": "Shipping preference",
  "requests.new.budgetRange": "Budget range",
  "requests.new.targetDeliveryTimeline": "Target delivery timeline",
  "requests.new.sectionAttachments": "Request Attachments",
  "requests.new.sectionAttachmentsDescription": "Upload request-side files only, such as RFQ, specs, images, or reference documents.",
  "requests.new.attachmentsPlaceholder": "Request attachments upload will be added here.",

  "requests.success.title": "Request Submitted",
  "requests.success.description": "Your sourcing request draft has been captured successfully.",
  "requests.success.summaryTitle": "Request Summary",
  "requests.success.requestTitle": "Request title",
  "requests.success.destinationCountry": "Destination country",
  "requests.success.quantity": "Quantity",
  "requests.success.requestBrief": "Request brief",
  "requests.success.preferredSupplierCountry": "Preferred supplier country",
  "requests.success.certificationsRequired": "Certifications",
  "requests.success.packagingRequirements": "Packaging requirements",
  "requests.success.shippingPreference": "Shipping preference",
  "requests.success.budgetRange": "Budget range",
  "requests.success.targetDeliveryTimeline": "Target delivery timeline",
  "requests.success.createAnother": "Create Another Request",
  "requests.success.backToDashboard": "Back to Dashboard",
  "requests.new.submitFailed": "Failed to save request.",
  "requests.success.savedDescription": "Your request has been saved successfully.",
  "requests.success.requestId": "Request ID",
  "requests.success.status": "Status",

  "requests.list.title": "My Requests",
  "requests.list.description": "View the sourcing requests you created in the non-sovereign request layer.",
  "requests.list.newRequest": "Create New Request",
  "requests.list.loading": "Loading requests...",
  "requests.list.failed": "Failed to load requests.",
  "requests.list.empty": "No requests found yet.",
  "requests.list.requestId": "Request ID",
  "requests.list.quantity": "Quantity",
  "requests.list.updatedAt": "Updated at",
  "requests.list.viewSummary": "View Summary",

  "requests.list.viewDetails": "View Details",

  "requests.details.title": "Request Details",
  "requests.details.description": "Review the saved request and prepare it for the next request-layer steps.",
  "requests.details.backToRequests": "Back to My Requests",
  "requests.details.newRequest": "Create New Request",
  "requests.details.loading": "Loading request details...",
  "requests.details.failed": "Failed to load request details.",
  "requests.details.notFound": "Request not found.",
  "requests.details.missingRequestId": "Request ID is missing.",
  "requests.details.requestId": "Request ID",
  "requests.details.status": "Status",
  "requests.details.updatedAt": "Updated at",
  "requests.details.confirmedInput": "Confirmed Request Data",
  "requests.details.requestTitle": "Request title",
  "requests.details.destinationCountry": "Destination country",
  "requests.details.quantity": "Quantity",
  "requests.details.requestBrief": "Request brief",
  "requests.details.preferredSupplierCountry": "Preferred supplier country",
  "requests.details.certificationsRequired": "Certifications",
  "requests.details.packagingRequirements": "Packaging requirements",
  "requests.details.shippingPreference": "Shipping preference",
  "requests.details.budgetRange": "Budget range",
  "requests.details.targetDeliveryTimeline": "Target delivery timeline",
  "requests.details.nextStepTitle": "Next Step",
  "requests.details.nextStepDescription": "Request-side file upload and AI extraction review will be added here next.",

  "requests.details.filesTitle": "Request Files",
  "requests.details.uploadFile": "Upload Request File",
  "requests.details.uploading": "Uploading file...",
  "requests.details.filesDescription": "Upload request-side catalogs, specs, RFQs, or reference files for later AI extraction.",
  "requests.details.filesLoading": "Loading request files...",
  "requests.details.filesEmpty": "No request files uploaded yet.",
  "requests.details.filesFailed": "Failed to load request files.",
  "requests.details.filesUploadFailed": "Failed to upload request file.",

  "requests.details.extractionsTitle": "AI Extraction",
  "requests.details.extractNow": "Extract with AI",
  "requests.details.extracting": "Running extraction...",
  "requests.details.extractionsDescription": "Run a non-sovereign AI-assisted extraction from the saved request data and uploaded request files.",
  "requests.details.extractionsLoading": "Loading extraction results...",
  "requests.details.extractionsEmpty": "No extraction results yet.",
  "requests.details.extractionsFailed": "Failed to load extraction results.",
  "requests.details.extractionsRunFailed": "Failed to run extraction.",
  "requests.details.extractionSourceType": "Source type",
  "requests.details.extractionStatus": "Review status",
  "requests.details.extractionCreatedAt": "Created at",
  "requests.details.extractedFields": "Extracted Fields",
  "requests.details.missingFields": "Missing Fields",
  "requests.details.warnings": "Warnings",
  "requests.details.noMissingFields": "No missing fields detected.",
  "requests.details.noWarnings": "No warnings.",

  "requests.details.reviewExtraction": "Review Extracted Data",

  "requests.review.title": "Review Extracted Data",
  "requests.review.description": "Review the extracted file data in a clear customer-facing format before confirming or editing it.",
  "requests.review.backToDetails": "Back to Request Details",
  "requests.review.loading": "Loading review data...",
  "requests.review.failed": "Failed to load review data.",
  "requests.review.empty": "No extraction results to review yet.",
  "requests.review.summaryTitle": "Quick Summary",
  "requests.review.proposedRequestTitle": "Proposed Request Data",
  "requests.review.missingFieldsTitle": "Missing Information",
  "requests.review.warningsTitle": "Warnings and Notes",
  "requests.review.noMissingFields": "No missing fields.",
  "requests.review.noWarnings": "No warnings.",
  "requests.review.nextStepTitle": "Next Step",
  "requests.review.nextStepDescription": "The next logical step is to add a confirm action that writes the reviewed data back into confirmed_input.",

  "discovery.title": "Supplier Discovery",
  "discovery.description": "AI-driven supplier discovery results will appear here.",
  "discovery.empty": "No results yet.",

  "disputes.title": "Disputes",
  "disputes.description": "Track open disputes and previous dispute outcomes.",
  "disputes.empty": "No disputes yet.",

  "certificates.title": "Certificates",
  "certificates.description": "Closure certificates and final documents.",
  "certificates.empty": "No certificates available.",
  
  "layout.workspaceTagline": "Sovereign trade execution workspace",
  "dashboard.quickActionsSubtitle": "Workspace shortcuts",

  "auth.verifyEmail.loadingTitle":
  "Verifying your email",
  "auth.verifyEmail.loadingDescription":
    "Please wait while we verify your email address.",
  "auth.verifyEmail.successTitle":
    "Email verified",
  "auth.verifyEmail.successDescription":
    "Your email address has been verified. You can now sign in.",
  "auth.verifyEmail.signIn":
    "Sign in",
  "auth.verifyEmail.errorTitle":
    "Verification failed",
  "auth.verifyEmail.missingToken":
    "The verification link does not contain a valid token.",
  "auth.verifyEmail.failed":
    "The email address could not be verified.",
  "auth.verifyEmail.returnToLogin":
    "Return to sign in",

      // Password reset
  "auth.passwordReset.forgotTitle":
    "Forgot your password?",

  "auth.passwordReset.forgotSubtitle":
    "Enter your verified email address and we will send you a secure reset link.",

  "auth.passwordReset.email":
    "Email address",

  "auth.passwordReset.emailPlaceholder":
    "client@example.com",

  "auth.passwordReset.emailRequired":
    "Enter your email address.",

  "auth.passwordReset.sendLink":
    "Send reset link",

  "auth.passwordReset.sending":
    "Sending reset link...",

  "auth.passwordReset.requestAccepted":
    "Your request has been accepted.",

  "auth.passwordReset.checkInbox":
    "If an eligible account exists for this email, a password reset link has been sent.",

  "auth.passwordReset.requestFailed":
    "The request could not be completed. Please try again.",

  "auth.passwordReset.resetTitle":
    "Create a new password",

  "auth.passwordReset.resetSubtitle":
    "Choose a strong password for your AI Hub client account.",

  "auth.passwordReset.newPassword":
    "New password",

  "auth.passwordReset.newPasswordPlaceholder":
    "Enter a new password",

  "auth.passwordReset.confirmPassword":
    "Confirm new password",

  "auth.passwordReset.confirmPasswordPlaceholder":
    "Enter the password again",

  "auth.passwordReset.passwordHelp":
    "Use at least 8 characters with at least one letter and one number.",

  "auth.passwordReset.passwordPolicy":
    "The password must contain at least 8 characters, one letter, and one number.",

  "auth.passwordReset.passwordMismatch":
    "The passwords do not match.",

  "auth.passwordReset.tokenInvalid":
    "This password reset link is invalid.",

  "auth.passwordReset.tokenExpired":
    "This password reset link has expired. Request a new link.",

  "auth.passwordReset.tokenConsumed":
    "This password reset link has already been used.",

  "auth.passwordReset.confirmFailed":
    "The password could not be reset. Please request a new link.",

  "auth.passwordReset.resetButton":
    "Reset password",

  "auth.passwordReset.resetting":
    "Resetting password...",

  "auth.passwordReset.resetSuccess":
    "Your password has been reset successfully. All previous sessions have been signed out.",

  "auth.passwordReset.loginNow":
    "Sign in with the new password",

  "auth.passwordReset.returnToLogin":
    "Return to sign in"
};