import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "@/lib/prototype";
// Install Infoveave localhost CORS interceptors on auth + default axios
import "@/utils/authAxios";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
