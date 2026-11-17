import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { MotionConfig } from "motion/react";
import App from "./App.jsx";
import { I18nProvider } from "./i18n/index.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider><I18nProvider><MotionConfig reducedMotion="user"><ToastProvider><AuthProvider><App /></AuthProvider></ToastProvider></MotionConfig></I18nProvider></ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
