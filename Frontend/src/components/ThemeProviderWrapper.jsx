import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { ConfigProvider, theme } from "antd";

const ThemeProviderWrapper = ({ children }) => {
  const mode = useSelector((state) => state.theme.mode);

  useEffect(() => {
    if (mode === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [mode]);

  return (
    <ConfigProvider
      theme={{
        algorithm: mode === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          fontFamily: "'Inter', sans-serif",
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
};

export default ThemeProviderWrapper;
