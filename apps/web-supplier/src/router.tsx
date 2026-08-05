import {
  createBrowserRouter
} from "react-router-dom";
import {
  AuthGuard
} from "./guards/AuthGuard";
import {
  GuestGuard
} from "./guards/GuestGuard";
import {
  AppLayout
} from "./layouts/AppLayout";
import {
  LoginPage
} from "./pages/auth/LoginPage";
import {
  RegisterSupplierPage
} from "./pages/auth/RegisterSupplierPage";
import {
  VerifyEmailPage
} from "./pages/auth/VerifyEmailPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import ProfilePage from "./pages/profile/ProfilePage";
import DocumentsPage from "./pages/documents/DocumentsPage";
import QualificationPage from "./pages/qualification/QualificationPage";
import ContractsPage from "./pages/contracts/ContractsPage";
import InspectionPage from "./pages/inspection/InspectionPage";
import ShipmentPage from "./pages/shipment/ShipmentPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";

export const router =
  createBrowserRouter([
    {
      path: "/verify-email",
      element: <VerifyEmailPage />
    },

    {
      element: <GuestGuard />,
      children: [
        {
          path: "/",
          element: <LoginPage />
        },
        {
          path: "/login",
          element: <LoginPage />
        },
        {
          path: "/register",
          element:
            <RegisterSupplierPage />
        },
        {
          path: "/forgot-password",
          element: <ForgotPasswordPage />
        },
        {
          path: "/reset-password",
          element: <ResetPasswordPage />
        }
      ]
    },

    {
      element: <AuthGuard />,
      children: [
        {
          path: "/app",
          element: <AppLayout />,
          children: [
            {
              index: true,
              element:
                <DashboardPage />
            },
            {
              path: "profile",
              element:
                <ProfilePage />
            },
            {
              path: "documents",
              element:
                <DocumentsPage />
            },
            {
              path: "qualification",
              element:
                <QualificationPage />
            },
            {
              path: "contracts",
              element:
                <ContractsPage />
            },
            {
              path: "inspection",
              element:
                <InspectionPage />
            },
            {
              path: "shipment",
              element:
                <ShipmentPage />
            }
          ]
        }
      ]
    }
  ]);