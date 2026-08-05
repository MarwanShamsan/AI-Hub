import {
  useEffect,
  useState
} from "react";

type Locale = "en" | "ar";

type PortalCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  features: readonly string[];
  loginLabel: string;
  registerLabel: string;
  loginUrl: string;
  registerUrl: string;
  variant: "client" | "supplier";
};

const content = {
  en: {
    navigation: {
      model: "Execution model",
      architecture: "Trust architecture",
      portals: "Portals",
      faq: "FAQ"
    },

    language: "العربية",

    headerPortal: "Access portals",

    hero: {
      eyebrow:
        "AUTONOMOUS TRADE INFRASTRUCTURE",

      titlePrimary:
        "Trade execution governed by",

      titleAccent:
        "digital truth.",

      description:
        "AI Hub binds evidence, authority, execution permissions, and sovereign time into one deterministic trade infrastructure.",

      clientAction:
        "Enter client portal",

      supplierAction:
        "Enter supplier portal",

      note:
        "No manual execution override. No mutable sovereign truth."
    },

    metrics: [
      {
        value: "168h",
        label: "Fixed receipt review law"
      },
      {
        value: "9",
        label: "Authority boundaries"
      },
      {
        value: "A · B · C",
        label: "Execution permissions"
      }
    ],

    visual: {
      eyebrow:
        "ILLUSTRATIVE EXECUTION SEQUENCE",

      title:
        "Deterministic lifecycle",

      timer:
        "168:00:00",

      timerLabel:
        "Receipt review window",

      events: [
        {
          name: "SPECIFICATION_LOCKED",
          status: "Verified"
        },
        {
          name: "INSPECTION_PASSED",
          status: "Evidence"
        },
        {
          name: "TOKEN_A_ISSUED",
          status: "System"
        },
        {
          name: "SHIPMENT_VERIFIED",
          status: "Logistics"
        }
      ]
    },

    portals: {
      eyebrow: "ACCESS",

      title:
        "Choose your operating portal",

      description:
        "Each portal is isolated by role and backed by the same identity infrastructure.",

      client: {
        eyebrow: "BUYER ACCESS",
        title: "Client Portal",

        description:
          "Define sourcing requirements, review structured data, follow requests, and observe lawful deal execution.",

        features: [
          "Create and manage sourcing requests",
          "Upload and review request documents",
          "Track requests and sovereign deals"
        ],

        login: "Client sign in",
        register: "Create client account"
      },

      supplier: {
        eyebrow: "SUPPLIER ACCESS",
        title: "Supplier Portal",

        description:
          "Build your supplier profile, submit qualification documents, and follow verification readiness.",

        features: [
          "Create a supplier identity",
          "Submit qualification information",
          "Track onboarding and reviews"
        ],

        login: "Supplier sign in",
        register: "Create supplier account"
      }
    },

    model: {
      eyebrow: "EXECUTION MODEL",

      title:
        "From commercial intent to immutable closure",

      description:
        "AI Hub keeps preparation, qualification, and discovery outside sovereign execution. Sovereign truth begins only after lawful handoff.",

      steps: [
        {
          number: "01",
          title: "Define",
          text:
            "Commercial requirements become measurable specifications and structured constraints."
        },
        {
          number: "02",
          title: "Verify",
          text:
            "Documents, evidence, references, and authority are checked through governed channels."
        },
        {
          number: "03",
          title: "Execute",
          text:
            "Inspection, shipment, and receipt produce controlled execution outcomes."
        },
        {
          number: "04",
          title: "Close",
          text:
            "Time expiry and cross-validation allow deterministic final closure."
        }
      ]
    },

    trust: {
      eyebrow: "TRUST ARCHITECTURE",

      title:
        "Designed without discretionary execution",

      description:
        "Interfaces collect lawful intent and display derived state. They never decide sovereign outcomes.",

      items: [
        {
          icon: "01",
          title: "Evidence before claims",
          text:
            "Inspection and dispute paths require official evidence references and hashes."
        },
        {
          icon: "02",
          title: "Immutable execution history",
          text:
            "Sovereign events form an append-only, hash-linked execution record."
        },
        {
          icon: "03",
          title: "No manual override",
          text:
            "No operator or interface can force issuance, closure, or time mutation."
        },
        {
          icon: "04",
          title: "Fixed time law",
          text:
            "Confirmed receipt begins a 168-hour window that cannot be paused, extended, or reset."
        }
      ]
    },

    time: {
      eyebrow: "SOVEREIGN TIME",

      title:
        "168 hours. Fixed by law, not discretion.",

      description:
        "After confirmed receipt, the lawful review window begins. A supported dispute must enter before expiry. After expiry, late disputes are permanently invalid.",

      points: [
        "Server-controlled UTC timing",
        "No pause, extension, or reset",
        "Finality after lawful expiry"
      ]
    },

    faq: {
      eyebrow: "QUESTIONS",

      title:
        "Built for clarity before execution",

      items: [
        {
          question:
            "Does creating a request create a sovereign deal?",

          answer:
            "No. Requests, supplier qualification, and discovery are non-sovereign pre-deal activities. Sovereign execution starts only through lawful handoff."
        },
        {
          question:
            "Can an administrator force an execution outcome?",

          answer:
            "No. Administrative and operational interfaces have no authority to force token issuance, time changes, or deal closure."
        },
        {
          question:
            "Why does AI Hub use evidence hashes?",

          answer:
            "Evidence references and hashes preserve traceability and prevent unsupported claims from becoming executable truth."
        },
        {
          question:
            "Can the 168-hour period be extended?",

          answer:
            "No. The period cannot be paused, extended, or reset through a user, operator, or administrative action."
        }
      ]
    },

    final: {
      eyebrow: "ENTER AI HUB",

      title:
        "Choose your role. Enter the governed infrastructure.",

      client: "Continue as client",
      supplier: "Continue as supplier"
    },

    footer: {
      statement:
        "Money follows verified digital truth, not human instruction.",

      privacy: "Privacy",
      terms: "Terms",
      security: "Security",
      support: "Support",
      rights: "All rights reserved."
    }
  },

  ar: {
    navigation: {
      model: "نموذج التنفيذ",
      architecture: "بنية الثقة",
      portals: "البوابات",
      faq: "الأسئلة"
    },

    language: "English",

    headerPortal: "دخول البوابات",

    hero: {
      eyebrow:
        "بنية التجارة ذاتية التنفيذ",

      titlePrimary:
        "تنفيذ تجاري محكوم بـ",

      titleAccent:
        "الحقيقة الرقمية.",

      description:
        "تربط AI Hub الأدلة والصلاحيات وأذونات التنفيذ والزمن السيادي ضمن بنية تجارية حتمية واحدة.",

      clientAction:
        "دخول بوابة العميل",

      supplierAction:
        "دخول بوابة المورد",

      note:
        "لا تجاوز تنفيذي يدوي. ولا حقيقة سيادية قابلة للتعديل."
    },

    metrics: [
      {
        value: "168h",
        label: "نافذة مراجعة ثابتة"
      },
      {
        value: "9",
        label: "حدود صلاحيات ثابتة"
      },
      {
        value: "A · B · C",
        label: "أذونات التنفيذ"
      }
    ],

    visual: {
      eyebrow:
        "تسلسل تنفيذي توضيحي",

      title:
        "مسار تنفيذ حتمي",

      timer:
        "168:00:00",

      timerLabel:
        "نافذة مراجعة الاستلام",

      events: [
        {
          name: "SPECIFICATION_LOCKED",
          status: "موثق"
        },
        {
          name: "INSPECTION_PASSED",
          status: "أدلة"
        },
        {
          name: "TOKEN_A_ISSUED",
          status: "النظام"
        },
        {
          name: "SHIPMENT_VERIFIED",
          status: "لوجستي"
        }
      ]
    },

    portals: {
      eyebrow: "الدخول",

      title:
        "اختر بوابة التشغيل الخاصة بك",

      description:
        "كل بوابة معزولة حسب الدور ومدعومة ببنية الهوية نفسها.",

      client: {
        eyebrow: "دخول المشتري",
        title: "بوابة العميل",

        description:
          "حدد متطلبات التوريد، وراجع البيانات المنظمة، وتابع الطلبات والتنفيذ السيادي للصفقات.",

        features: [
          "إنشاء وإدارة طلبات التوريد",
          "رفع ومراجعة مستندات الطلب",
          "متابعة الطلبات والصفقات"
        ],

        login: "تسجيل دخول العميل",
        register: "إنشاء حساب عميل"
      },

      supplier: {
        eyebrow: "دخول المورد",
        title: "بوابة المورد",

        description:
          "أنشئ ملف المورد، وارفع مستندات التأهيل، وتابع جاهزية التحقق والمراجعة.",

        features: [
          "إنشاء هوية مورد",
          "تقديم بيانات التأهيل",
          "متابعة الانضمام والمراجعات"
        ],

        login: "تسجيل دخول المورد",
        register: "إنشاء حساب مورد"
      }
    },

    model: {
      eyebrow: "نموذج التنفيذ",

      title:
        "من النية التجارية إلى الإغلاق غير القابل للتغيير",

      description:
        "تفصل AI Hub الإعداد والتأهيل والاكتشاف عن التنفيذ السيادي. تبدأ الحقيقة السيادية فقط بعد التسليم القانوني.",

      steps: [
        {
          number: "01",
          title: "التحديد",
          text:
            "تتحول المتطلبات التجارية إلى مواصفات قابلة للقياس وقيود منظمة."
        },
        {
          number: "02",
          title: "التحقق",
          text:
            "تمر الوثائق والأدلة والمراجع والصلاحيات عبر قنوات محكومة."
        },
        {
          number: "03",
          title: "التنفيذ",
          text:
            "ينتج الفحص والشحن والاستلام مخرجات تنفيذية منضبطة."
        },
        {
          number: "04",
          title: "الإغلاق",
          text:
            "يسمح انتهاء الزمن والتحقق المتقاطع بالإغلاق النهائي الحتمي."
        }
      ]
    },

    trust: {
      eyebrow: "بنية الثقة",

      title:
        "مصممة دون قرارات تنفيذية تقديرية",

      description:
        "تجمع الواجهات النية القانونية وتعرض الحالة المشتقة، لكنها لا تقرر النتائج السيادية.",

      items: [
        {
          icon: "01",
          title: "الأدلة قبل الادعاءات",
          text:
            "يتطلب الفحص والنزاع مراجع أدلة وهاشات قادمة من القنوات الرسمية."
        },
        {
          icon: "02",
          title: "سجل تنفيذ غير قابل للتلاعب",
          text:
            "تكوّن الأحداث السيادية سجلًا تسلسليًا مرتبطًا بالهاش."
        },
        {
          icon: "03",
          title: "لا تجاوز يدوي",
          text:
            "لا يمكن لأي مشغل أو واجهة فرض إصدار أو إغلاق أو تغيير زمني."
        },
        {
          icon: "04",
          title: "قانون زمني ثابت",
          text:
            "يبدأ الاستلام المؤكد نافذة 168 ساعة لا يمكن إيقافها أو تمديدها أو إعادة ضبطها."
        }
      ]
    },

    time: {
      eyebrow: "الزمن السيادي",

      title:
        "168 ساعة. يحكمها القانون لا التقدير.",

      description:
        "بعد تأكيد الاستلام تبدأ نافذة المراجعة القانونية. يجب إدخال النزاع المدعوم قبل الانتهاء، وبعده تصبح النزاعات المتأخرة غير صالحة نهائيًا.",

      points: [
        "توقيت UTC يتحكم به الخادم",
        "لا إيقاف أو تمديد أو إعادة ضبط",
        "نهائية كاملة بعد انتهاء المدة"
      ]
    },

    faq: {
      eyebrow: "الأسئلة",

      title:
        "وضوح كامل قبل بدء التنفيذ",

      items: [
        {
          question:
            "هل إنشاء الطلب ينشئ صفقة سيادية؟",

          answer:
            "لا. الطلبات وتأهيل المورد والاكتشاف أنشطة غير سيادية تسبق الصفقة. يبدأ التنفيذ السيادي فقط من خلال التسليم القانوني."
        },
        {
          question:
            "هل يستطيع مسؤول فرض نتيجة تنفيذية؟",

          answer:
            "لا. لا تملك واجهات الإدارة أو العمليات صلاحية فرض إصدار التوكنات أو تغيير الزمن أو إغلاق الصفقة."
        },
        {
          question:
            "لماذا تستخدم AI Hub هاشات الأدلة؟",

          answer:
            "تحافظ مراجع الأدلة والهاشات على قابلية التتبع، وتمنع الادعاءات غير المدعومة من التحول إلى حقيقة تنفيذية."
        },
        {
          question:
            "هل يمكن تمديد فترة 168 ساعة؟",

          answer:
            "لا. لا يمكن إيقاف المدة أو تمديدها أو إعادة ضبطها بواسطة المستخدم أو المشغل أو الإدارة."
        }
      ]
    },

    final: {
      eyebrow: "دخول AI HUB",

      title:
        "اختر دورك وادخل البنية التحتية المحكومة.",

      client: "المتابعة كعميل",
      supplier: "المتابعة كمورد"
    },

    footer: {
      statement:
        "المال يتبع الحقيقة الرقمية الموثقة، لا التعليمات البشرية.",

      privacy: "الخصوصية",
      terms: "الشروط",
      security: "الأمان",
      support: "الدعم",
      rights: "جميع الحقوق محفوظة."
    }
  }
} as const;

function normalizeBaseUrl(
  value: string | undefined,
  fallback: string
): string {
  return (
    value?.trim().replace(/\/+$/, "") ||
    fallback
  );
}

function BrandMark() {
  return (
    <svg
      className="brand-mark"
      viewBox="0 0 48 48"
      aria-hidden="true"
    >
      <path
        d="M24 3 42 13.5v21L24 45 6 34.5v-21L24 3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />

      <path
        d="m24 10 11.5 6.8v14.4L24 38 12.5 31.2V16.8L24 10Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity=".65"
      />

      <path
        d="m17.5 29 6.5-13 6.5 13M20 24.5h8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
    >
      <path
        d="M4 10h12M11 5l5 5-5 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PortalCard({
  eyebrow,
  title,
  description,
  features,
  loginLabel,
  registerLabel,
  loginUrl,
  registerUrl,
  variant
}: PortalCardProps) {
  return (
    <article
      className={`portal-card portal-card--${variant}`}
    >
      <div className="portal-card__glow" />

      <div className="portal-card__header">
        <span className="eyebrow">
          {eyebrow}
        </span>

        <span
          className="portal-card__number"
          aria-hidden="true"
        >
          {variant === "client"
            ? "01"
            : "02"}
        </span>
      </div>

      <h3>{title}</h3>

      <p className="portal-card__description">
        {description}
      </p>

      <ul className="feature-list">
        {features.map((feature) => (
          <li key={feature}>
            <span
              className="feature-list__mark"
              aria-hidden="true"
            />

            {feature}
          </li>
        ))}
      </ul>

      <div className="portal-card__actions">
        <a
          className="button button--light"
          href={loginUrl}
        >
          <span>{loginLabel}</span>
          <ArrowIcon />
        </a>

        <a
          className="text-link"
          href={registerUrl}
        >
          {registerLabel}
        </a>
      </div>
    </article>
  );
}

export default function App() {
  const [locale, setLocale] =
    useState<Locale>("en");

  const [menuOpen, setMenuOpen] =
    useState(false);

  const copy = content[locale];

  const clientBaseUrl =
    normalizeBaseUrl(
      import.meta.env
        .VITE_CLIENT_PORTAL_URL,
      "http://localhost:5173"
    );

  const supplierBaseUrl =
    normalizeBaseUrl(
      import.meta.env
        .VITE_SUPPLIER_PORTAL_URL,
      "http://localhost:5174"
    );
    
    const clientLoginUrl = clientBaseUrl;
    const supplierLoginUrl = `${supplierBaseUrl}/login`;

  const supportEmail =
    import.meta.env
      .VITE_SUPPORT_EMAIL
      ?.trim() ||
    "support@example.com";

  useEffect(() => {
    document.documentElement.lang =
      locale;

    document.documentElement.dir =
      locale === "ar"
        ? "rtl"
        : "ltr";

    document.title =
      locale === "ar"
        ? "AI Hub — البنية التحتية الذاتية"
        : "AI Hub — Autonomous Infrastructure";
  }, [locale]);

  function toggleLocale(): void {
    setLocale((current) =>
      current === "en"
        ? "ar"
        : "en"
    );

    setMenuOpen(false);
  }

  return (
    <div className="site-shell">
      <div
        className="ambient ambient--one"
        aria-hidden="true"
      />

      <div
        className="ambient ambient--two"
        aria-hidden="true"
      />

      <div
        className="global-grid"
        aria-hidden="true"
      />

      <header className="site-header">
        <a
          className="brand"
          href="#top"
          aria-label="AI Hub home"
        >
          <BrandMark />

          <span className="brand__text">
            <strong>AI Hub</strong>
            <small>
              Autonomous Infrastructure
            </small>
          </span>
        </a>

        <button
          className="mobile-menu-button"
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          onClick={() =>
            setMenuOpen(
              (current) => !current
            )
          }
        >
          <span />
          <span />
        </button>

        <nav
          className={
            menuOpen
              ? "site-nav site-nav--open"
              : "site-nav"
          }
          aria-label="Primary navigation"
        >
          <a href="#model">
            {copy.navigation.model}
          </a>

          <a href="#architecture">
            {copy.navigation.architecture}
          </a>

          <a href="#portals">
            {copy.navigation.portals}
          </a>

          <a href="#faq">
            {copy.navigation.faq}
          </a>
        </nav>

        <div className="header-actions">
          <button
            className="language-button"
            type="button"
            onClick={toggleLocale}
          >
            {copy.language}
          </button>

          <a
            className="button button--header"
            href="#portals"
          >
            {copy.headerPortal}
          </a>
        </div>
      </header>

      <main id="top">
        <section className="hero section">
          <div className="hero__content">
            <div className="hero__eyebrow">
              <span
                className="hero__eyebrow-line"
                aria-hidden="true"
              />

              {copy.hero.eyebrow}
            </div>

            <h1>
              {copy.hero.titlePrimary}
              <span>
                {copy.hero.titleAccent}
              </span>
            </h1>

            <p className="hero__description">
              {copy.hero.description}
            </p>

            <div className="hero__actions">
              <a
                className="button button--primary"
                href={clientLoginUrl}
              >
                <span>
                  {copy.hero.clientAction}
                </span>

                <ArrowIcon />
              </a>

              <a
                className="button button--ghost"
                href={`${supplierBaseUrl}/login`}
              >
                <span>
                  {copy.hero.supplierAction}
                </span>

                <ArrowIcon />
              </a>
            </div>

            <p className="hero__note">
              <span aria-hidden="true" />
              {copy.hero.note}
            </p>

            <div className="metrics">
              {copy.metrics.map(
                (metric) => (
                  <div
                    className="metric"
                    key={metric.label}
                  >
                    <strong>
                      {metric.value}
                    </strong>

                    <span>
                      {metric.label}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>

          <div
            className="execution-visual"
            aria-label={copy.visual.title}
          >
            <div className="execution-visual__halo" />

            <div className="execution-panel">
              <div className="execution-panel__topbar">
                <div>
                  <span className="eyebrow">
                    {copy.visual.eyebrow}
                  </span>

                  <h2>
                    {copy.visual.title}
                  </h2>
                </div>

                <div
                  className="live-orbit"
                  aria-hidden="true"
                >
                  <span />
                </div>
              </div>

              <div className="timer-card">
                <div>
                  <span>
                    {copy.visual.timerLabel}
                  </span>

                  <strong>
                    {copy.visual.timer}
                  </strong>
                </div>

                <div
                  className="timer-ring"
                  aria-hidden="true"
                >
                  <span>168</span>
                </div>
              </div>

              <div className="event-list">
                {copy.visual.events.map(
                  (event, index) => (
                    <div
                      className="event-row"
                      key={event.name}
                    >
                      <span className="event-row__index">
                        {String(
                          index + 1
                        ).padStart(2, "0")}
                      </span>

                      <span className="event-row__name">
                        {event.name}
                      </span>

                      <span className="event-row__status">
                        {event.status}
                      </span>
                    </div>
                  )
                )}
              </div>

              <div className="hash-line">
                <span>SHA-256</span>

                <code>
                  6f2a...a9c1
                </code>

                <span>
                  CHAINED
                </span>
              </div>
            </div>
          </div>
        </section>

        <section
          className="section portals-section"
          id="portals"
        >
          <div className="section-heading">
            <span className="eyebrow">
              {copy.portals.eyebrow}
            </span>

            <h2>
              {copy.portals.title}
            </h2>

            <p>
              {copy.portals.description}
            </p>
          </div>

          <div className="portal-grid">
            <PortalCard
                {...copy.portals.client}
                loginLabel={copy.portals.client.login}
                registerLabel={copy.portals.client.register}
                loginUrl={clientLoginUrl}
                registerUrl={`${clientBaseUrl}/register/client`}
                variant="client"
                />

            <PortalCard
              {...copy.portals.supplier}
              loginLabel={
                copy.portals.supplier.login
              }
              registerLabel={
                copy.portals.supplier
                  .register
              }
              loginUrl={
                `${supplierBaseUrl}/login`
              }
              registerUrl={
                `${supplierBaseUrl}/register`
              }
              variant="supplier"
            />
          </div>
        </section>

        <section
          className="section model-section"
          id="model"
        >
          <div className="section-heading section-heading--wide">
            <span className="eyebrow">
              {copy.model.eyebrow}
            </span>

            <h2>{copy.model.title}</h2>

            <p>{copy.model.description}</p>
          </div>

          <div className="steps-grid">
            {copy.model.steps.map(
              (step) => (
                <article
                  className="step-card"
                  key={step.number}
                >
                  <span className="step-card__number">
                    {step.number}
                  </span>

                  <h3>{step.title}</h3>
                  <p>{step.text}</p>

                  <span
                    className="step-card__line"
                    aria-hidden="true"
                  />
                </article>
              )
            )}
          </div>
        </section>

        <section
          className="section trust-section"
          id="architecture"
        >
          <div className="trust-section__copy">
            <span className="eyebrow">
              {copy.trust.eyebrow}
            </span>

            <h2>{copy.trust.title}</h2>

            <p>{copy.trust.description}</p>
          </div>

          <div className="trust-grid">
            {copy.trust.items.map(
              (item) => (
                <article
                  className="trust-card"
                  key={item.icon}
                >
                  <span className="trust-card__icon">
                    {item.icon}
                  </span>

                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              )
            )}
          </div>
        </section>

        <section className="section time-section">
          <div className="time-section__visual">
            <div
              className="time-orbit"
              aria-hidden="true"
            >
              <div className="time-orbit__inner">
                <strong>168</strong>
                <span>HOURS</span>
              </div>
            </div>
          </div>

          <div className="time-section__content">
            <span className="eyebrow">
              {copy.time.eyebrow}
            </span>

            <h2>{copy.time.title}</h2>

            <p>{copy.time.description}</p>

            <ul>
              {copy.time.points.map(
                (point) => (
                  <li key={point}>
                    <span aria-hidden="true" />
                    {point}
                  </li>
                )
              )}
            </ul>
          </div>
        </section>

        <section
          className="section faq-section"
          id="faq"
        >
          <div className="section-heading">
            <span className="eyebrow">
              {copy.faq.eyebrow}
            </span>

            <h2>{copy.faq.title}</h2>
          </div>

          <div className="faq-list">
            {copy.faq.items.map(
              (item, index) => (
                <details
                  className="faq-item"
                  key={item.question}
                >
                  <summary>
                    <span>
                      {String(
                        index + 1
                      ).padStart(2, "0")}
                    </span>

                    {item.question}

                    <i aria-hidden="true" />
                  </summary>

                  <p>{item.answer}</p>
                </details>
              )
            )}
          </div>
        </section>

        <section className="section final-cta">
          <div className="final-cta__glow" />

          <span className="eyebrow">
            {copy.final.eyebrow}
          </span>

          <h2>{copy.final.title}</h2>

          <div className="final-cta__actions">
            <a
              className="button button--primary"
              href={clientLoginUrl}
            >
              {copy.final.client}
              <ArrowIcon />
            </a>

            <a
              className="button button--ghost"
              href={`${supplierBaseUrl}/login`}
            >
              {copy.final.supplier}
              <ArrowIcon />
            </a>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="site-footer__brand">
          <BrandMark />

          <div>
            <strong>AI Hub</strong>
            <p>
              {copy.footer.statement}
            </p>
          </div>
        </div>

        <div className="site-footer__links">
          <a href="/privacy">
            {copy.footer.privacy}
          </a>

          <a href="/terms">
            {copy.footer.terms}
          </a>

          <a href="#architecture">
            {copy.footer.security}
          </a>

          <a href={`mailto:${supportEmail}`}>
            {copy.footer.support}
          </a>
        </div>

        <p className="site-footer__copyright">
          © {new Date().getFullYear()} AI Hub.{" "}
          {copy.footer.rights}
        </p>
      </footer>
    </div>
  );
}
