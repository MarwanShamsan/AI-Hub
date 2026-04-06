import PageSection from "../../components/common/PageSection";

export default function OpenDisputePage() {
  return (
    <PageSection
      title="Open Dispute"
      description="Create a dispute submission with evidence references."
    >
      <form className="stack-md">
        <input className="input" placeholder="Reason code" />
        <textarea className="textarea" placeholder="Dispute description" />
        <button className="button" type="button">
          Submit Dispute
        </button>
      </form>
    </PageSection>
  );
}
