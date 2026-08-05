const ar = {
  app: {
    name: "بوابة المورد",
    tagline: "تهيئة المورد، التأهيل، والاستعداد للاكتشاف."
  },

  nav: {
    dashboard: "لوحة التحكم",
    profile: "الملف التعريفي",
    documents: "الوثائق",
    qualification: "التأهيل",
    contracts: "العقود",
    inspection: "التفتيش",
    shipment: "الشحنة",
    logout: "تسجيل الخروج",
    supplierAccount: "حساب المورد"
  },

  locale: {
    label: "اللغة",
    english: "English",
    arabic: "العربية"
  },

  auth: {
    register: {
      title:
        "إنشاء حساب مورد",

      subtitle:
        "سجل شركتك لبدء تهيئة المورد والتأهيل.",

      username:
        "اسم المستخدم",

      usernamePlaceholder:
        "اختر اسم مستخدم",

      usernameInvalid:
        "استخدم من 3 إلى 32 حرفًا إنجليزيًا صغيرًا أو رقمًا أو نقطة أو شرطة سفلية أو شرطة.",

      email:
        "البريد الإلكتروني التجاري",

      emailPlaceholder:
        "أدخل بريد الشركة",

      emailRequired:
        "البريد الإلكتروني مطلوب.",

      password:
        "كلمة المرور",

      passwordPlaceholder:
        "أنشئ كلمة مرور",

      passwordPolicy:
        "يجب أن تتكون كلمة المرور من 8 إلى 128 خانة وتحتوي على حرف ورقم واحد على الأقل.",

      confirmPassword:
        "تأكيد كلمة المرور",

      confirmPasswordPlaceholder:
        "أدخل كلمة المرور مرة أخرى",

      passwordMismatch:
        "كلمتا المرور غير متطابقتين.",

      submit:
        "إنشاء حساب مورد",

      submitting:
        "جارٍ إنشاء الحساب...",

      failed:
        "تعذر إنشاء حساب المورد.",

      pendingTitle:
        "تحقق من بريد الشركة",

      pendingDescription:
        "تم إرسال رابط تحقق إلى البريد أدناه. افتح الرابط قبل تسجيل الدخول.",

      returnToLogin:
        "العودة إلى تسجيل الدخول",

      haveAccount:
        "لديك حساب بالفعل؟",

      signIn:
        "تسجيل الدخول"
    },

    verifyEmail: {
      loadingTitle:
        "جارٍ التحقق من البريد",

      loadingDescription:
        "يرجى الانتظار بينما نتحقق من حساب المورد.",

      successTitle:
        "تم التحقق من البريد",

      successDescription:
        "تم التحقق من حساب المورد. يمكنك الآن تسجيل الدخول.",

      signIn:
        "تسجيل الدخول",

      errorTitle:
        "فشل التحقق",

      missingToken:
        "لا يحتوي رابط التحقق على رمز صالح.",

      failed:
        "تعذر التحقق من البريد الإلكتروني.",

      returnToLogin:
        "العودة إلى تسجيل الدخول"
    },
    login: {
      title:
        "تسجيل دخول المورد",

      subtitle:
        "ادخل إلى مساحة تهيئة المورد والتأهيل.",

      identifier:
        "اسم المستخدم أو البريد الإلكتروني",

      identifierPlaceholder:
        "أدخل اسم المستخدم أو البريد الإلكتروني",

      identifierRequired:
        "اسم المستخدم أو البريد الإلكتروني مطلوب.",

      password:
        "كلمة المرور",

      passwordPlaceholder:
        "أدخل كلمة المرور",

      passwordRequired:
        "كلمة المرور مطلوبة.",

      submit:
        "تسجيل الدخول",

      submitting:
        "جارٍ تسجيل الدخول...",

      failed:
        "تعذر تسجيل الدخول.",

      verificationEmail:
        "البريد الإلكتروني للتحقق",

      verificationEmailPlaceholder:
        "أدخل البريد المسجل",

      verificationEmailRequired:
        "أدخل البريد المستخدم لإنشاء حساب المورد.",

      resend:
        "إعادة إرسال رسالة التحقق",

      resending:
        "جارٍ إرسال رسالة التحقق...",

      verificationSent:
        "إذا كان الحساب مؤهلًا، فقد تم إرسال رسالة تحقق.",

      resendFailed:
        "تعذر إعادة إرسال رسالة التحقق.",

      emailNotVerifiedHelp:
        "لم يتم التحقق من البريد الإلكتروني. أدخل البريد المسجل لإعادة إرسال رابط التحقق.",

      newToAiHub:
        "جديد في AI Hub؟",

      createSupplierAccount:
        "إنشاء حساب مورد",

      forgotPassword:
        "هل نسيت كلمة المرور؟",
    },

    passwordReset: {
      forgotTitle:
        "هل نسيت كلمة المرور؟",

      forgotSubtitle:
        "أدخل بريدك الإلكتروني الموثق وسنرسل إليك رابطًا آمنًا لإعادة تعيين كلمة المرور.",

      email:
        "البريد الإلكتروني",

      emailPlaceholder:
        "supplier@example.com",

      emailRequired:
        "أدخل بريدك الإلكتروني.",

      sendLink:
        "إرسال رابط الاستعادة",

      sending:
        "جارٍ إرسال الرابط...",

      requestAccepted:
        "تم قبول طلبك.",

      checkInbox:
        "إذا كان هناك حساب مؤهل مرتبط بهذا البريد، فقد تم إرسال رابط إعادة تعيين كلمة المرور.",

      requestFailed:
        "تعذر إكمال الطلب. حاول مرة أخرى.",

      resetTitle:
        "إنشاء كلمة مرور جديدة",

      resetSubtitle:
        "اختر كلمة مرور قوية لحساب المورد في AI Hub.",

      newPassword:
        "كلمة المرور الجديدة",

      newPasswordPlaceholder:
        "أدخل كلمة المرور الجديدة",

      confirmPassword:
        "تأكيد كلمة المرور الجديدة",

      confirmPasswordPlaceholder:
        "أدخل كلمة المرور مرة أخرى",

      passwordHelp:
        "استخدم 8 أحرف على الأقل، وتأكد من وجود حرف ورقم واحد على الأقل.",

      passwordPolicy:
        "يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل وحرف واحد ورقم واحد.",

      passwordMismatch:
        "كلمتا المرور غير متطابقتين.",

      tokenInvalid:
        "رابط إعادة تعيين كلمة المرور غير صالح.",

      tokenExpired:
        "انتهت صلاحية رابط إعادة تعيين كلمة المرور. اطلب رابطًا جديدًا.",

      tokenConsumed:
        "تم استخدام رابط إعادة تعيين كلمة المرور مسبقًا.",

      confirmFailed:
        "تعذر إعادة تعيين كلمة المرور. اطلب رابطًا جديدًا.",

      resetButton:
        "إعادة تعيين كلمة المرور",

      resetting:
        "جارٍ إعادة تعيين كلمة المرور...",

      resetSuccess:
        "تم تغيير كلمة المرور بنجاح، وتم تسجيل الخروج من جميع الجلسات السابقة.",

      loginNow:
        "تسجيل الدخول بكلمة المرور الجديدة",

      returnToLogin:
        "العودة إلى تسجيل الدخول"
    },

    errors: {
      emailAlreadyVerified:
        "تم التحقق من هذا البريد مسبقًا.",

      verificationTokenInvalid:
        "رابط التحقق غير صالح.",

      verificationTokenExpired:
        "انتهت صلاحية رابط التحقق.",

      verificationTokenConsumed:
        "تم استخدام رابط التحقق مسبقًا.",

      usernameAlreadyExists:
        "اسم المستخدم مستخدم بالفعل.",

      emailAlreadyExists:
        "البريد الإلكتروني مسجل بالفعل.",

      invalidRegistrationPayload:
        "راجع معلومات التسجيل ثم حاول مرة أخرى.",

      passwordPolicyFailed:
        "كلمة المرور لا تستوفي متطلبات الأمان.",

      invalidCredentials:
        "اسم المستخدم أو البريد الإلكتروني أو كلمة المرور غير صحيحة.",

      emailNotVerified:
        "تحقق من بريدك الإلكتروني قبل تسجيل الدخول.",

      roleMismatch:
        "هذا الحساب ليس حساب مورد.",

      resendRateLimited:
        "تم إرسال عدد كبير من طلبات التحقق. حاول لاحقًا.",

      userNotAvailable:
        "حساب المورد غير متاح.",

      unauthorized:
        "ليست لديك صلاحية لدخول بوابة المورد.",

      requestFailed:
        "تعذر إكمال الطلب."
    }
  },

  dashboard: {
    title: "أكمل تهيئة المورد",
    subtitle:
      "أنشئ ملف مورد مؤهلًا عبر استكمال بيانات الشركة، ورفع الوثائق المطلوبة، واجتياز التأهيل قبل الصفقة.",
    completeProfile: "أكمل الملف",
    uploadDocuments: "ارفع الوثائق",
    loadErrorTitle: "تعذر تحميل لوحة التحكم",
    currentStatus: "الحالة الحالية",
    supplierType: "نوع المورد",
    missingProfileFields: "الحقول الناقصة",
    missingRequiredDocuments: "الوثائق المطلوبة الناقصة",
    onboardingChecklistTitle: "قائمة التهيئة",
    onboardingChecklistSubtitle:
      "اتبع هذه الخطوات لتأهيل ملف المورد للدخول إلى الاكتشاف."
  },

  profile: {
    title: "ملف الشركة",
    subtitle:
      "عرّفنا على نفسك كمورد. هذه البيانات مطلوبة قبل مراجعة الوثائق للتأهيل.",
    openDocuments: "افتح الوثائق",
    updateFailed: "فشل تحديث الملف",
    saved: "تم حفظ الملف",
    updatedSuccessfully: "تم تحديث ملف المورد بنجاح.",
    incompleteTitle: "الملف غير مكتمل",
    incompleteText:
      "أكمل الحقول المطلوبة قبل مراجعة التأهيل. الحقول الناقصة: {{fields}}",
    saveButton: "حفظ ملف المورد",

    businessIdentityTitle: "الهوية التجارية",
    businessIdentitySubtitle: "هذه البيانات تحدد الكيان القانوني للشركة.",
    supplierType: "نوع المورد",
    legalName: "الاسم القانوني",
    registrationNumber: "رقم التسجيل",
    registrationCountry: "بلد التسجيل",

    businessOperationsTitle: "النشاط التجاري",
    businessOperationsSubtitle:
      "صف النشاط الأساسي ونطاق المنتجات التي تعمل بها.",
    businessCategory: "فئة النشاط",
    productCategories: "فئات المنتجات",

    operationalContactTitle: "جهة الاتصال التشغيلية",
    operationalContactSubtitle:
      "من الشخص المسؤول عن التواصل في مسائل التأهيل التشغيلية؟",
    contactName: "اسم جهة الاتصال",
    contactEmail: "البريد الإلكتروني",
    contactPhone: "رقم الهاتف",
    declaredLicenseExpiryDate: "تاريخ انتهاء الترخيص المعلن",

    currentStateTitle: "الحالة الحالية للمورد",
    currentStateSubtitle: "ملخص سريع لسجل تهيئة المورد.",
    qualificationStatus: "حالة التأهيل",
    lastReasonCode: "آخر رمز سبب",
    lastReasonText: "آخر نص سبب",

    placeholderLegalName: "الاسم القانوني للمنشأة",
    placeholderRegistrationNumber: "رقم السجل أو الرقم التجاري",
    placeholderRegistrationCountry: "بلد التسجيل",
    placeholderBusinessCategory: "مثال: مواد صناعية",
    placeholderProductCategories: "قيم مفصولة بفواصل",
    placeholderContactName: "اسم جهة الاتصال التشغيلية",
    placeholderContactEmail: "supplier@example.com",
    placeholderContactPhone: "+967...",
    placeholderDate: "YYYY-MM-DD"
  },

  documents: {
    title: "الوثائق التجارية",
    subtitle:
      "ارفع الوثائق التجارية المطلوبة أولًا. ويمكنك أيضًا إضافة وثائق داعمة اختيارية لتعزيز ملف المورد.",
    uploadSelected: "رفع الوثيقة المحددة",
    uploading: "جارٍ الرفع...",
    actionFailed: "فشل إجراء الوثيقة",
    successTitle: "تم بنجاح",
    uploadedSuccessfully: "تم رفع الوثيقة بنجاح.",
    submittedForReview: "تم رفع الوثيقة وإرسالها للمراجعة.",
    processingFailed: "تعذر إكمال المعالجة الآن. تم تسجيل المشكلة داخليًا.",
    missingRequiredTitle: "وثائق مطلوبة ناقصة",
    missingRequiredText:
      "ارفع جميع الوثائق المطلوبة لنوع المورد قبل مراجعة التأهيل.",

    requiredTitle: "الوثائق المطلوبة",
    requiredSubtitle: "هذه هي الوثائق اللازمة للاستعداد للتأهيل.",
    uploaded: "مرفوعة",
    required: "مطلوبة",
    replace: "استبدال",
    upload: "رفع",
    notUploadedYet: "لم تُرفع بعد",
    uploadedMeta: "المرفوع: {{file}}",
    declaredNumber: "الرقم المعلن",
    expiry: "الانتهاء",

    uploadPanelRequiredTitle: "رفع وثيقة مطلوبة",
    uploadPanelOptionalTitle: "رفع وثيقة داعمة اختيارية",
    selectedDocumentType: "نوع الوثيقة المحدد: {{type}}",
    optionalSubtitle:
      "الوثائق الاختيارية قد تدعم ملف المورد، لكنها لا تعوّض الوثائق المطلوبة.",
    addOptionalDocument: "إضافة وثيقة اختيارية",
    documentType: "نوع الوثيقة",
    file: "الملف",
    selectFile: "اختر ملفًا",
    chooseFileHelp: "اختر ملف PDF أو ملف وثيقة تجارية مدعوم.",
    selectedFile: "الملف المحدد: {{file}}",
    declaredDocumentNumber: "رقم الوثيقة المعلن",
    declaredExpiryDate: "تاريخ الانتهاء المعلن",
    notes: "ملاحظات",
    optionalNotesPlaceholder: "ملاحظات اختيارية حول هذه الوثيقة",
    issuingCountry: "دولة الإصدار",
    issuingCountryPlaceholder: "تُستخدم دولة تسجيل الشركة افتراضيًا",
    uploadNewVersion: "رفع نسخة أحدث",
    previousVersions: "النسخ السابقة",
    evidenceNoticeTitle: "يتم الاحتفاظ بالملفات المرسلة",
    evidenceNoticeText:
      "لا يمكن حذف ملفات الإثبات بعد رفعها. ارفع نسخة أحدث عندما تحتاج إلى استبدال الوثيقة.",
    uploadedReviewRequired:
      "تم رفع الوثيقة واستخراج بياناتها، وهي جاهزة لمراجعتك.",
    uploadedExtractionFailed:
      "تم الاحتفاظ بالوثيقة، لكن فشل الاستخراج التلقائي. ارفع نسخة أوضح أو تواصل مع الدعم.",
    processingFailedTitle: "لم يكتمل الاستخراج التلقائي",
    processingFailedHelp:
      "ما زال ملف الإثبات محفوظًا. ارفع نسخة أوضح لإنشاء استخراج جديد.",
    reviewExtractedData: "مراجعة البيانات المستخرجة",
    provider: "مزود الاستخراج",
    model: "النموذج",
    field: "الحقل",
    extractedValue: "القيمة المستخرجة",
    supplierValue: "القيمة التي يصرح بها المورد",
    confidence: "الثقة",
    confirmExtracted: "تأكيد البيانات المستخرجة",
    reportCorrection: "الإبلاغ عن قيمة غير صحيحة",
    correctionReason: "سبب التصحيح",
    correctionReasonPlaceholder: "اشرح لماذا القيمة المستخرجة غير صحيحة.",
    correctionReasonRequired: "اكتب سبب التصحيح.",
    correctionDifferenceRequired:
      "غيّر قيمة واحدة على الأقل قبل إرسال التصحيح.",
    submitCorrection: "إرسال التصحيح",
    cancelCorrection: "إلغاء",
    savingDeclaration: "جارٍ الحفظ...",
    latestDeclarationConfirmed:
      "آخر تصريح لك يؤكد القيم المستخرجة.",
    latestDeclarationCorrected:
      "آخر تصريح لك يتضمن تصحيحًا واحدًا أو أكثر.",
    noStructuredFields:
      "لم يتم استخراج حقول منظمة من هذه النسخة. ارفع وثيقة أوضح.",

    reviewStatus: {
      PROCESSING_FAILED: "فشل الاستخراج",
      REVIEW_REQUIRED: "تحتاج إلى مراجعتك",
      CONFIRMED: "تم التأكيد",
      CORRECTION_SUBMITTED: "تم إرسال تصحيح"
    },

    validation: {
      documentTypeRequired: "نوع الوثيقة مطلوب.",
      fileRequired: "اختر ملفًا لرفعه.",
      fileTooLarge: "يجب ألا يزيد حجم الملف على 15 ميجابايت."
    },

    errorReason: {
      REQUEST_FAILED: "فشل الطلب. حاول مرة أخرى.",
      FILE_REQUIRED: "اختر ملفًا لرفعه.",
      FILE_TOO_LARGE: "يجب ألا يزيد حجم الملف على 15 ميجابايت.",
      INVALID_DOCUMENT_TYPE: "نوع الوثيقة المحدد غير صالح.",
      UNSUPPORTED_DOCUMENT_CONTENT_TYPE:
        "ارفع ملف PDF أو صورة مدعومة.",
      INVALID_SUPERSEDED_FILE:
        "نسخة الوثيقة المطلوب استبدالها لم تعد النسخة الحالية.",
      REPLACEMENT_DOCUMENT_TYPE_MISMATCH:
        "يجب أن تكون النسخة البديلة من نوع الوثيقة نفسه.",
      DUPLICATE_SUPPLIER_DOCUMENT:
        "تم رفع هذا الملف نفسه من قبل.",
      DUPLICATE_FILE_DIFFERENT_REQUIREMENT:
        "هذا الملف نفسه مرتبط بالفعل بمتطلب مختلف.",
      DOCUMENT_EXTRACTION_NOT_AVAILABLE:
        "لا توجد نتيجة استخراج متاحة لهذه الوثيقة.",
      STALE_DOCUMENT_EXTRACTION:
        "توجد نتيجة استخراج أحدث. أعد تحميل الصفحة وراجعها.",
      INVALID_DOCUMENT_DECLARATION:
        "تصريح الوثيقة غير صالح.",
      DOCUMENT_DECLARATION_FAILED:
        "تعذر حفظ التصريح.",
      SUPPLIER_FILE_UPLOAD_FAILED:
        "تعذر رفع الوثيقة."
    },

    uploadedRequiredTitle: "الوثائق المطلوبة المرفوعة",
    uploadedRequiredSubtitle:
      "هذه الوثائق المطلوبة مرتبطة حاليًا بملف المورد.",
    noRequiredDocsTitle: "لا توجد وثائق مطلوبة مرفوعة بعد",
    noRequiredDocsText:
      "ارفع الوثائق المطلوبة أولًا لنقل ملف المورد نحو التأهيل.",

    optionalTitle: "الوثائق الداعمة الاختيارية",
    optionalListSubtitle:
      "هذه الوثائق اختيارية. يمكنها تعزيز ملف المورد، لكنها لا تعوّض الوثائق المطلوبة.",
    noOptionalDocsTitle: "لا توجد وثائق اختيارية مرفوعة بعد",
    noOptionalDocsText: "يمكن إضافة الوثائق الداعمة لاحقًا عند الحاجة.",

    delete: "حذف",
    deleting: "جارٍ الحذف...",
    confirmDeleteFile: "هل أنت متأكد أنك تريد حذف هذه الوثيقة؟",
    deletedSuccessfully: "تم حذف الوثيقة بنجاح.",

    fields: {
      legalName: "الاسم القانوني",
      licenseNumber: "رقم الرخصة",
      registrationNumber: "رقم السجل",
      issueDate: "تاريخ الإصدار",
      expiryDate: "تاريخ الانتهاء",
      issuingAuthority: "الجهة المصدرة",
      country: "الدولة",
      taxNumber: "الرقم الضريبي",
      authorizationNumber: "رقم التفويض",
      certificateReference: "مرجع الشهادة",
      factoryName: "اسم المصنع",
      documentReference: "مرجع الوثيقة"
    },

    extractionSummary: {
      documentType: "نوع الوثيقة",
      legalName: "الاسم القانوني",
      registrationNumber: "رقم التسجيل",
      expiryDate: "تاريخ الانتهاء",
      issueDate: "تاريخ الإصدار",
      issuingAuthority: "الجهة المصدرة",
      countryHint: "إشارة البلد",
      certificateReference: "مرجع الشهادة"
    }
  },

  qualification: {
    title: "حالة التأهيل",
    subtitle:
      "راجع نتيجة تأهيل المورد، والمتطلبات الناقصة، والخطوة التالية المطلوبة ليصبح المورد مؤهلًا للاكتشاف.",
    runReview: "تشغيل مراجعة التأهيل",
    evaluating: "جارٍ التقييم...",
    openDocuments: "افتح الوثائق",
    requestFailed: "فشل طلب التأهيل",

    currentStatusTitle: "حالة التأهيل الحالية",
    latestReviewTitle: "آخر مراجعة",
    latestReviewSubtitle: "آخر قرار تأهيل للمورد قبل الصفقة.",

    internalStatus: "الحالة الداخلية",
    lastReasonCode: "آخر رمز سبب",
    lastReasonText: "آخر نص سبب",
    latestDecision: "آخر قرار",
    decision: "القرار",
    reasonCode: "رمز السبب",
    reasonText: "نص السبب",
    decidedAt: "تاريخ القرار",

    noReviewTitle: "لا توجد نتيجة مراجعة بعد",
    noReviewText:
      "شغّل مراجعة التأهيل بعد استكمال ملف المورد ورفع الوثائق المطلوبة.",

    missingProfileTitle: "متطلبات الملف الناقصة",
    missingProfileSubtitle: "يجب استكمال هذه الحقول قبل الموافقة.",
    profileLooksCompleteTitle: "الملف يبدو مكتملًا",
    profileLooksCompleteText: "تم تعبئة جميع الحقول المطلوبة.",

    missingDocumentsTitle: "الوثائق المطلوبة الناقصة",
    missingDocumentsSubtitle:
      "هذه الوثائق المطلوبة تُحدد وفقًا لنوع المورد.",
    requiredDocsUploadedTitle: "تم رفع الوثائق المطلوبة",
    requiredDocsUploadedText:
      "جميع أنواع الوثائق المطلوبة الحالية موجودة.",

    nextActionTitle: "الخطوة التالية",
    nextActionSubtitle:
      "استخدم الخطوة المقترحة التالية لدفع ملف المورد إلى المرحلة التالية.",
    completeCompanyProfile: "أكمل ملف الشركة",
    completeCompanyProfileText:
      "أضف نوع المورد، والهوية القانونية، وبيانات التسجيل، وبيانات التواصل التشغيلية.",
    uploadRequiredDocuments: "ارفع الوثائق المطلوبة",
    uploadRequiredDocumentsText:
      "أضف الوثائق التجارية الناقصة المطلوبة لنوع المورد الخاص بك.",
    runReviewNow: "شغّل مراجعة التأهيل الآن"
  },

  status: {
    DRAFT: "تم إنشاء الحساب",
    PROFILE_INCOMPLETE: "الملف غير مكتمل",
    READY_FOR_REVIEW: "تم رفع الوثائق",
    PENDING_REVIEW: "قيد المراجعة",
    MISSING_REQUIREMENTS: "مطلوب معلومات إضافية",
    REJECTED_PREDEAL: "لم تتم الموافقة على التأهيل",
    APPROVED_FOR_DISCOVERY: "مؤهل للدخول إلى الاكتشاف",
    UNKNOWN: "حالة غير معروفة"
  },

  statusDescription: {
    DRAFT: "ابدأ تهيئة المورد عبر استكمال ملف الشركة.",
    PROFILE_INCOMPLETE: "أكمل معلومات الشركة المطلوبة قبل مراجعة التأهيل.",
    READY_FOR_REVIEW: "ملف المورد جاهز لمراجعة التأهيل.",
    PENDING_REVIEW: "يجري تقييم ملف المورد.",
    MISSING_REQUIREMENTS:
      "ارفع الوثائق المطلوبة الناقصة أو أكمل الحقول الناقصة.",
    REJECTED_PREDEAL: "ملف المورد لم يجتز التأهيل قبل الصفقة.",
    APPROVED_FOR_DISCOVERY: "ملف المورد مؤهل للدخول إلى الاكتشاف.",
    UNKNOWN: "حالة التأهيل غير متاحة."
  },

  supplierType: {
    manufacturer: "مصنّع",
    trading_company: "شركة تجارية",
    exporter: "مصدّر",
    distributor: "موزّع",
    other: "أخرى"
  },

  common: {
    listSeparator: "، "
  },

  qualificationProfileField: {
    supplier_type:
      "نوع المورد",

    legal_name:
      "الاسم القانوني",

    registration_number:
      "رقم التسجيل",

    registration_country:
      "دولة التسجيل",

    operational_contact_email:
      "البريد الإلكتروني للتواصل التشغيلي"
  },

  qualificationReasonCode: {
    SUPPLIER_PROFILE_NOT_FOUND:
      "ملف المورد غير موجود",

    PROFILE_FIELDS_MISSING:
      "بيانات ملف المورد ناقصة",

    REQUIRED_DOCUMENTS_MISSING:
      "وثائق مطلوبة ناقصة",

    QUALIFICATION_DOCUMENTS_NOT_EXTRACTED:
      "لم يتم استخراج بيانات الوثيقة",

    QUALIFICATION_DOCUMENT_UNREADABLE:
      "تعذر قراءة الوثيقة",

    DOCUMENT_EXTRACTION_INCOMPLETE:
      "بيانات الوثيقة المستخرجة غير مكتملة",

    DOCUMENT_REVIEW_REQUIRED:
      "الوثيقة بحاجة إلى مراجعة",

    DOCUMENT_CORRECTIONS_PENDING_VALIDATION:
      "تصحيحات الوثيقة بحاجة إلى تحقق",

    STALE_DOCUMENT_DECLARATION:
      "التأكيد مرتبط باستخراج قديم",

    DECLARED_DOCUMENT_EXPIRED:
      "الوثيقة المعلنة منتهية الصلاحية",

    LICENSE_EXPIRED:
      "الرخصة منتهية الصلاحية",

    DOCUMENT_EXPIRED:
      "الوثيقة منتهية الصلاحية",

    INVALID_ISSUE_DATE:
      "تاريخ الإصدار غير صالح",

    INVALID_EXPIRY_DATE:
      "تاريخ الانتهاء غير صالح",

    ISSUE_DATE_IN_FUTURE:
      "تاريخ الإصدار يقع في المستقبل",

    ISSUE_DATE_AFTER_EXPIRY:
      "تاريخ الإصدار يأتي بعد تاريخ الانتهاء",

    LEGAL_NAME_MISMATCH:
      "عدم تطابق الاسم القانوني",

    REGISTRATION_NUMBER_MISMATCH:
      "عدم تطابق رقم التسجيل",

    ISSUING_COUNTRY_MISMATCH:
      "عدم تطابق دولة الإصدار",

    DOCUMENT_TYPE_MISMATCH:
      "عدم تطابق نوع الوثيقة",

    DUPLICATE_EVIDENCE_ACROSS_REQUIREMENTS:
      "استخدام الدليل نفسه لأكثر من متطلب",

    FILE_HASH_MISSING:
      "بصمة الملف غير موجودة",

    LOW_CONFIDENCE_FIELD:
      "بيانات منخفضة الثقة",

    DOCUMENT_VALIDATION_FAILED:
      "فشل التحقق من الوثائق",

    QUALIFIED_FOR_DISCOVERY:
      "مؤهل للمشاركة في الاكتشاف",

    UNKNOWN:
      "سبب التأهيل غير متاح"
  },

  qualificationReason: {
    genericDocument:
      "إحدى الوثائق المطلوبة",

    genericDocuments:
      "الوثائق المطلوبة",

    unspecifiedFields:
      "الحقول المطلوبة",

    SUPPLIER_PROFILE_NOT_FOUND:
      "لم يتم إنشاء ملف المورد بعد.",

    PROFILE_FIELDS_MISSING:
      "ملف المورد غير مكتمل. الحقول المطلوبة: {{fields}}.",

    REQUIRED_DOCUMENTS_MISSING:
      "الوثائق المطلوبة الناقصة: {{documents}}.",

    QUALIFICATION_DOCUMENTS_NOT_EXTRACTED:
      "لم يكتمل استخراج بيانات {{document}}.",

    QUALIFICATION_DOCUMENT_UNREADABLE:
      "تعذر قراءة بيانات {{document}}. يرجى رفع نسخة أوضح.",

    DOCUMENT_EXTRACTION_INCOMPLETE:
      "البيانات المستخرجة من {{document}} غير مكتملة.",

    DOCUMENT_REVIEW_REQUIRED:
      "تحتاج بيانات {{document}} إلى تأكيد أو تصحيح من المورد.",

    DOCUMENT_CORRECTIONS_PENDING_VALIDATION:
      "تم تقديم تصحيحات على {{document}} وما زالت بحاجة إلى التحقق.",

    STALE_DOCUMENT_DECLARATION:
      "تأكيد {{document}} مرتبط بإصدار قديم من الاستخراج. يرجى مراجعة أحدث إصدار.",

    DECLARED_DOCUMENT_EXPIRED:
      "بيانات المورد تشير إلى أن {{document}} منتهية الصلاحية.",

    DOCUMENT_EXPIRED:
      "{{document}} منتهية الصلاحية.",

    DOCUMENT_EXPIRED_WITH_DATE:
      "{{document}} منتهية الصلاحية منذ {{date}}.",

    INVALID_ISSUE_DATE:
      "تعذر تفسير تاريخ إصدار {{document}}.",

    INVALID_EXPIRY_DATE:
      "تعذر تفسير تاريخ انتهاء {{document}}.",

    ISSUE_DATE_IN_FUTURE:
      "تاريخ إصدار {{document}} يقع في المستقبل.",

    ISSUE_DATE_AFTER_EXPIRY:
      "تاريخ إصدار {{document}} يأتي بعد تاريخ انتهائها.",

    LEGAL_NAME_MISMATCH:
      "الاسم القانوني المستخرج من {{document}} لا يطابق الاسم القانوني المسجل في ملف المورد.",

    REGISTRATION_NUMBER_MISMATCH:
      "رقم التسجيل المستخرج من {{document}} لا يطابق رقم التسجيل المسجل في ملف المورد.",

    ISSUING_COUNTRY_MISMATCH:
      "دولة إصدار {{document}} لا تطابق دولة تسجيل المورد.",

    DOCUMENT_TYPE_MISMATCH:
      "محتوى الملف المرفوع لا يطابق نوع الوثيقة المحدد: {{document}}.",

    DUPLICATE_EVIDENCE_ACROSS_REQUIREMENTS:
      "تم استخدام الملف نفسه لإثبات أكثر من متطلب مختلف. يجب رفع وثيقة صحيحة ومستقلة لكل متطلب.",

    FILE_HASH_MISSING:
      "بصمة SHA-256 غير موجودة لـ {{document}}.",

    LOW_CONFIDENCE_FIELD:
      "توجد بيانات منخفضة الثقة في {{document}} وتحتاج إلى مراجعة.",

    DOCUMENT_VALIDATION_FAILED:
      "لم تجتز واحدة أو أكثر من الوثائق قواعد التحقق المطلوبة.",

    QUALIFIED_FOR_DISCOVERY:
      "اجتاز المورد التأهيل قبل الصفقة وأصبح مؤهلًا للمشاركة في الاكتشاف.",

    UNKNOWN:
      "لم يجتز ملف المورد متطلبات التأهيل الحالية. يرجى مراجعة البيانات والوثائق المطلوبة."
  },

  documentType: {
    LEGAL_REGISTRATION: "شهادة التسجيل القانوني",
    TRADE_LICENSE: "الرخصة التجارية",
    TAX_REGISTRATION: "التسجيل الضريبي",
    MANUFACTURING_LICENSE: "الرخصة الصناعية",
    EXPORT_LICENSE: "رخصة التصدير",
    DISTRIBUTION_AUTHORIZATION: "تصريح التوزيع",
    QUALITY_CERTIFICATE: "شهادة الجودة",
    FACTORY_PROFILE: "ملف المصنع",
    OTHER: "أخرى",
    reviewRequired: "بانتظار مراجعتك",
    confirmExtracted: "تأكيد صحة البيانات",
    correctExtracted: "تصحيح البيانات المستخرجة",
    previousVersions: "الإصدارات السابقة"
  },

  documentRequirementDescription: {
    LEGAL_REGISTRATION: "إثبات أن الشركة كيان مسجل قانونيًا.",
    TRADE_LICENSE: "رخصة تجارية أو رخصة مزاولة نشاط سارية للكيان المورد.",
    MANUFACTURING_LICENSE:
      "إثبات أن المورد مخول قانونيًا بمزاولة نشاط التصنيع."
  },

  nextAction: {
    readyForReviewTitle: "ملف المورد جاهز للمراجعة",
  readyForReviewText:
    "تم استكمال ملف الشركة ورفع جميع الوثائق المطلوبة. لا يلزم أي إجراء منك الآن.",
  readyForReviewCta: "عرض حالة التأهيل",

  pendingReviewTitle: "ملف المورد قيد المراجعة",
  pendingReviewText:
    "يجري الآن فحص الملف والوثائق من قبل فريق المراجعة الداخلي.",
  pendingReviewCta: "عرض حالة التأهيل",

  missingRequirementsTitle: "مطلوب استكمال بعض المتطلبات",
  missingRequirementsText:
    "راجع حالة التأهيل لمعرفة الوثائق أو المعلومات المطلوبة لاستكمال المراجعة.",
  missingRequirementsCta: "عرض حالة التأهيل",

  rejectedTitle: "لم تتم الموافقة على الملف",
  rejectedText:
    "راجع نتيجة التأهيل لمعرفة سبب عدم الموافقة والخطوات التالية إن وجدت.",
  rejectedCta: "عرض حالة التأهيل",
    defaultTitle: "أكمل تهيئة المورد",
    defaultText: "أكمل الخطوة المطلوبة التالية لدفع ملف المورد إلى الأمام.",
    defaultCta: "أكمل الملف",

    completeProfileTitle: "أكمل ملف الشركة",
    completeProfileText:
      "أضف معلومات الشركة المطلوبة قبل مراجعة التأهيل.",
    completeProfileCta: "اذهب إلى الملف",

    uploadDocumentsTitle: "ارفع الوثائق المطلوبة",
    uploadDocumentsText:
      "نوع المورد الخاص بك يتطلب وثائق تجارية داعمة.",
    uploadDocumentsCta: "ارفع الوثائق",

    reviewQualificationTitle: "راجع نتيجة التأهيل",
    reviewQualificationText:
      "تحقق من حالة التأهيل، والعناصر الناقصة، أو أسباب الرفض.",
    reviewQualificationCta: "افتح التأهيل",

    qualifiedTitle: "تم تأهيل المورد",
    qualifiedText: "أصبح ملف المورد الآن مؤهلًا للدخول إلى الاكتشاف.",
    qualifiedCta: "عرض الحالة"
  },

  onboardingChecklist: {
    reviewReadyDetail: "تم رفع الوثائق المطلوبة، والملف جاهز للمراجعة الداخلية.",
    reviewPendingDetail: "ملف المورد قيد المراجعة من قبل الفريق الداخلي.",
    reviewMissingRequirementsDetail:
      "راجعت المنصة الملف ووجدت متطلبات أو وثائق إضافية مطلوبة.",
    reviewRejectedDetail:
      "انتهت المراجعة الداخلية ولم تتم الموافقة على الملف قبل الصفقة.",
    reviewApprovedDetail:
      "اكتملت المراجعة الداخلية وتمت الموافقة على الملف للدخول إلى الاكتشاف.",
    accountCreatedTitle: "تم إنشاء الحساب",
    accountCreatedDetail: "حساب دخول المورد مفعل.",

    completeProfileTitle: "أكمل ملف الشركة",
    completeProfileDoneDetail: "تم استكمال معلومات الشركة المطلوبة.",
    completeProfileMissingDetail: "الحقول الناقصة: {{fields}}",

    uploadDocumentsTitle: "ارفع الوثائق المطلوبة",
    uploadDocumentsDoneDetail: "تم رفع جميع الوثائق المطلوبة.",
    uploadDocumentsMissingDetail: "الوثائق الناقصة: {{documents}}",

    reviewTitle: "مراجعة التأهيل"
  },

  qualificationSummary: {
    title: "ملخص التأهيل",
    currentStatus: "الحالة الحالية",
    lastReasonCode: "آخر رمز سبب",
    lastReasonText: "آخر نص سبب",
    latestReviewDecision: "آخر قرار مراجعة"
  },

  requiredDocuments: {
    title: "الوثائق المطلوبة",
    subtitle: "تعتمد الوثائق المطلوبة على نوع المورد الذي أعلنته.",
    documentTypeLabel: "نوع الوثيقة",
    uploaded: "مرفوعة",
    notUploaded: "غير مرفوعة",
    fileLabel: "الملف",
    versionLabel: "النسخة",
    currentVersion: "الحالية",
    declaredNumberLabel: "الرقم المعلن",
    declaredExpiryLabel: "تاريخ الانتهاء المعلن"
  }
} as const;

export default ar;
