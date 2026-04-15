import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { Toaster } from "./components/ui/sonner";
import reportWebVitals from "./reportWebVitals";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);

// Suppress noisy ResizeObserver loop completed messages that bubble as errors in some browsers.
// This prevents the app from repeatedly logging the known browser ResizeObserver loop message
// while allowing other errors to surface normally.
window.addEventListener("error", (event) => {
  try {
    const msg =
      (event && (event as any).message) ||
      (event && (event as any).error && (event as any).error.message);
    if (
      typeof msg === "string" &&
      msg.includes(
        "ResizeObserver loop completed with undelivered notifications",
      )
    ) {
      event.preventDefault();
      return false;
    }
  } catch (e) {
    // ignore
  }
  return true;
});
root.render(
  <React.StrictMode>
    <App />
    <Toaster richColors position="top-right" />
  </React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
