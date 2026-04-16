import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import AuthLayout from "../layouts/AuthLayout";
import DashboardLayout from "../layouts/DashboardLayout";
import AuthGuard from "../guards/AuthGuard";
import GuestGuard from "../guards/GuestGuard";
import LoginPage from "../pages/auth/LoginPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import RegisterClientPage from "../pages/auth/RegisterClientPage";
import DashboardPage from "../pages/dashboard/DashboardPage";
import NewRequestPage from "../pages/requests/NewRequestPage";
import RequestSuccessPage from "../pages/requests/RequestSuccessPage";
import SupplierDiscoveryPage from "../pages/discovery/SupplierDiscoveryPage";
import SupplierShortlistPage from "../pages/discovery/SupplierShortlistPage";
import DealsListPage from "../pages/deals/DealsListPage";
import DealDetailsPage from "../pages/deals/DealDetailsPage";
import ReceiptConfirmationPage from "../pages/receipt/ReceiptConfirmationPage";
import DisputesPage from "../pages/disputes/DisputesPage";
import OpenDisputePage from "../pages/disputes/OpenDisputePage";
import DisputeDetailsPage from "../pages/disputes/DisputeDetailsPage";
import CertificatesPage from "../pages/certificates/CertificatesPage";
import NotFoundPage from "../pages/errors/NotFoundPage";
import UnauthorizedPage from "../pages/errors/UnauthorizedPage";
import RequestsListPage from "../pages/requests/RequestsListPage";
import RequestDetailsPage from "../pages/requests/RequestDetailsPage";
import RequestExtractionReviewPage from "../pages/requests/RequestExtractionReviewPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        element: <GuestGuard />,
        children: [
          {
            element: <AuthLayout />,
            children: [
              { index: true, element: <LoginPage /> },
              { path: "forgot-password", element: <ForgotPasswordPage /> },
              { path: "register/client", element: <RegisterClientPage /> }
            ]
          }
        ]
      },
      {
        path: "app",
        element: <AuthGuard />,
        children: [
          {
            element: <DashboardLayout />,
            children: [
              { index: true, element: <DashboardPage /> },
              { path: "requests", element: <RequestsListPage /> },
              { path: "requests/new", element: <NewRequestPage /> },
              { path: "requests/:requestId", element: <RequestDetailsPage /> },
              { path: "requests/:requestId/review", element: <RequestExtractionReviewPage /> },
              { path: "requests/success", element: <RequestSuccessPage /> },
              { path: "discovery", element: <SupplierDiscoveryPage /> },
              { path: "discovery/shortlist", element: <SupplierShortlistPage /> },
              { path: "deals", element: <DealsListPage /> },
              { path: "deals/:dealId", element: <DealDetailsPage /> },
              { path: "receipt", element: <ReceiptConfirmationPage /> },
              { path: "disputes", element: <DisputesPage /> },
              { path: "disputes/open", element: <OpenDisputePage /> },
              { path: "disputes/:disputeId", element: <DisputeDetailsPage /> },
              { path: "certificates", element: <CertificatesPage /> },
              { path: "unauthorized", element: <UnauthorizedPage /> }
            ]
          }
        ]
      },
      { path: "*", element: <NotFoundPage /> }
    ]
  }
]);