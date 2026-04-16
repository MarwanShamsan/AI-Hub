import PageSection from "../../components/common/PageSection";
import { useI18n } from "../../i18n/useI18n";

export default function CertificatesPage() {
  const { t } = useI18n();

  return (
    <PageSection
      title={t("certificates.title")}
      description={t("certificates.description")}
    >
      <div className="card">{t("certificates.empty")}</div>
    </PageSection>
  );
}