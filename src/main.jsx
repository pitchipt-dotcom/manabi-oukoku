import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./kingdom.css";
import "./places/naze/app.scoped.css";
import "./places/kanji/app.scoped.css";
import "./places/techou/app.scoped.css";
import "./places/sakubun/app.scoped.css";

createRoot(document.getElementById("root")).render(<App />);
