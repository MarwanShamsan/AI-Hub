import { useI18n } from "../../i18n";
import {
  getRequiredDocumentsBySupplierType,
  getUploadedDocumentMap
} from "../../lib/supplier-rules";
import { SupplierFileRecord, SupplierType } from "../../types/supplier";
import { SectionCard } from "../common/SectionCard";
import { StatusBadge } from "../common/StatusBadge";

type Props = {
  supplierType: SupplierType | null | undefined;
  files: SupplierFileRecord[];
};

export function RequiredDocumentsCard({ supplierType, files }: Props) {
  const { t } = useI18n();

  const rules = getRequiredDocumentsBySupplierType(supplierType);
  const uploadedMap = getUploadedDocumentMap(files);

  return (
    <SectionCard
      title={t("requiredDocuments.title")}
      subtitle={t("requiredDocuments.subtitle")}
    >
      <div className="deal-list">
        {rules.map((rule) => {
          const uploaded = uploadedMap[rule.type];

          return (
            <div key={rule.type} className="deal-row">
              <div className="deal-row-header">
                <div>
                  <div className="deal-row-title">
                    {t(`documentType.${rule.type}`)}
                  </div>
                  <div className="deal-row-meta">
                    <span>{t(rule.descriptionKey)}</span>
                  </div>
                </div>

                <StatusBadge
                  label={
                    uploaded
                      ? t("requiredDocuments.uploaded")
                      : t("requiredDocuments.notUploaded")
                  }
                  tone={uploaded ? "success" : "warning"}
                />
              </div>

              {uploaded ? (
                <div className="deal-row-meta">
                  <span>
                    {t("requiredDocuments.fileLabel")}: {uploaded.file_name}
                  </span>
                  <span>
                    {t("requiredDocuments.versionLabel")}: {t("requiredDocuments.currentVersion")}
                  </span>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
