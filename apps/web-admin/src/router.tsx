import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "./App";
import AdminAuthGuard from "./guards/AdminAuthGuard";
import AdminLoginPage from "./pages/auth/AdminLoginPage";
import AdminSuppliersListPage from "./pages/suppliers/AdminSuppliersListPage";
import AdminSupplierDocumentsReviewPage from "./pages/suppliers/AdminSupplierDocumentsReviewPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <Navigate to="/app/suppliers" replace />
      },
      {
        path: "login",
        element: <AdminLoginPage />
      },
      {
        element: <AdminAuthGuard />,
        children: [
          {
            path: "app/suppliers",
            element: <AdminSuppliersListPage />
          },
          {
            path: "app/suppliers/:supplierId/documents",
            element: <AdminSupplierDocumentsReviewPage />
          }
        ]
      }
    ]
  }
]);