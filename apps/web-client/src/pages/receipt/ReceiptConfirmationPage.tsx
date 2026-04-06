import PageSection from "../../components/common/PageSection";

export default function ReceiptConfirmationPage() {
  return (
    <PageSection
      title="Receipt Confirmation"
      description="Confirm goods receipt to trigger the sovereign timer."
    >
      <button className="button" type="button">
        Confirm Receipt
      </button>
    </PageSection>
  );
}
