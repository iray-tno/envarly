import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { UndoProvider } from "./contexts/UndoContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <UndoProvider>
      <App />
    </UndoProvider>
  </React.StrictMode>,
);
