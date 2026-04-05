import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { Provider } from "react-redux";
import store from "./store/store";
import GlobalErrorBoundary from "./components/errors/GlobalErrorBoundary.jsx";

// Suppress defaultProps warnings from external libraries like react-rainbow-components
const originalError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === "string" &&
    args[0].includes("Support for defaultProps will be removed from function components")
  ) {
    return;
  }
  originalError.call(console, ...args);
};

ReactDOM.createRoot(document.getElementById("root")).render(
  // <React.StrictMode>
  <GlobalErrorBoundary>
    <Provider store={store}>
      <App />
    </Provider>
  </GlobalErrorBoundary>
  // </React.StrictMode>
);
