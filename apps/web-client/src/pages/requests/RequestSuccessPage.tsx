import { Link, useLocation, Navigate } from "react-router-dom";
import PageSection from "../../components/common/PageSection";
import { RequestFormValues } from "../../features/requests/types";

type RequestSuccessState = {
  requestDraft?: RequestFormValues;
};

export default function RequestSuccessPage() {
  const location = useLocation();
  const state = location.state as RequestSuccessState | null;
  const requestDraft = state?.requestDraft;

  if (!requestDraft) {
    return <Navigate to="/app/requests/new" replace />;
  }

  return (
    <PageSection
      title="Request Submitted"
      description="Your sourcing request draft has been captured successfully."
    >
      <div className="page-body">
        <div className="card">
          <h3>Request Summary</h3>

          <div className="stack-sm">
            <p>
              <strong>Product:</strong> {requestDraft.productName}
            </p>
            <p>
              <strong>Target country:</strong> {requestDraft.targetCountry}
            </p>
            <p>
              <strong>Quantity:</strong> {requestDraft.quantity}
            </p>
            <p>
              <strong>Requirements:</strong> {requestDraft.requirements}
            </p>
          </div>
        </div>

        <div className="stack-sm">
          <Link className="button" to="/app/requests/new">
            Create Another Request
          </Link>
          <Link className="button" to="/app">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </PageSection>
  );
}