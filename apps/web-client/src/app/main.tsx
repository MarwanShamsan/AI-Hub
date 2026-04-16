import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import "../styles/theme.css";
import "../styles/base.css";
import "../styles/layout.css";
import "../styles/forms.css";
import "../styles/dashboard.css";
import "../styles/deals.css";
import { I18nProvider } from "../i18n/I18nProvider";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <I18nProvider>
      <RouterProvider router={router} />
    </I18nProvider>
  </React.StrictMode>
);