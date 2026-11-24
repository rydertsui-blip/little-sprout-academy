import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { CompanionPreviewScreen } from "./companions/CompanionPreviewScreen";
import "./styles.css";

const companionPreview = import.meta.env.DEV && new URLSearchParams(window.location.search).get("companion-preview") === "1";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {companionPreview ? <CompanionPreviewScreen /> : <App />}
  </React.StrictMode>
);
