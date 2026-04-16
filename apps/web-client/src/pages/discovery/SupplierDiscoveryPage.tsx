import PageSection from "../../components/common/PageSection";
import { useI18n } from "../../i18n/useI18n";

export default function SupplierDiscoveryPage() {
  const { t } = useI18n();

  return (
    <PageSection
      title={t("discovery.title")}
      description={t("discovery.description")}
    >
      <div className="card">{t("discovery.empty")}</div>
    </PageSection>
  );
}