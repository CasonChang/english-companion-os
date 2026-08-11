import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";

import { App } from "./App";
import { AuthProvider } from "./features/auth/AuthProvider";
import { I18nProvider } from "./features/i18n/I18nProvider";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <I18nProvider><HashRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </HashRouter></I18nProvider>
  </React.StrictMode>
);
