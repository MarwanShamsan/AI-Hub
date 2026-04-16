import PageSection from "../../components/common/PageSection";
import { useI18n } from "../../i18n/useI18n";

export default function DisputesPage() {
  const { t } = useI18n();

  return (
    <PageSection
      title={t("disputes.title")}
      description={t("disputes.description")}
    >
      <div className="card">{t("disputes.empty")}</div>
    </PageSection>
  );
}