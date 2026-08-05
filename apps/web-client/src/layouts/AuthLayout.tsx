import {
  Outlet
} from "react-router-dom";

import AuthPortalShell from "../components/auth/AuthPortalShell";
import {
  useI18n
} from "../i18n/useI18n";

function normalizeBaseUrl(
  value: string | undefined,
  fallback: string
): string {
  return (
    value?.trim().replace(/\/+$/, "") ||
    fallback
  );
}

export default function AuthLayout() {
  const {
    locale
  } = useI18n();

  const landingUrl =
    normalizeBaseUrl(
      import.meta.env.VITE_LANDING_URL,
      "http://localhost:5172"
    );

  const supplierPortalUrl =
    normalizeBaseUrl(
      import.meta.env
        .VITE_SUPPLIER_PORTAL_URL,
      "http://localhost:5174"
    );

  const copy =
    locale === "ar"
      ? {
          portalLabel:
            "بوابة العميل",

          title:
            "وصول منظم إلى طلباتك وتنفيذ صفقاتك.",

          description:
            "ادخل إلى مساحة العميل لمتابعة طلبات التوريد والأدلة ودورة حياة الصفقة من مرجع واحد.",

          points: [
            "إدارة طلبات التوريد",
            "متابعة الأدلة والوثائق",
            "عرض حالة التنفيذ المشتقة"
          ],

          backLabel:
            "العودة إلى AI Hub",

          switchPortalLabel:
            "الانتقال إلى بوابة المورد"
        }
      : {
          portalLabel:
            "CLIENT PORTAL",

          title:
            "Structured access to requests and execution.",

          description:
            "Enter the client workspace to follow sourcing requests, evidence, and the lawful deal lifecycle from one reference.",

          points: [
            "Manage sourcing requests",
            "Follow evidence and documents",
            "View derived execution state"
          ],

          backLabel:
            "Back to AI Hub",

          switchPortalLabel:
            "Continue to Supplier Portal"
        };

  return (
    <AuthPortalShell
      portalLabel={copy.portalLabel}
      title={copy.title}
      description={copy.description}
      points={copy.points}
      landingUrl={landingUrl}
      backLabel={copy.backLabel}
      switchPortalUrl={
        `${supplierPortalUrl}/login`
      }
      switchPortalLabel={
        copy.switchPortalLabel
      }
    >
      <Outlet />
    </AuthPortalShell>
  );
}