import React from "react";
import { ErrorBoundary } from "react-error-boundary";

function DashboardErrorFallback({ error, resetErrorBoundary }) {
  const handleReloadDashboard = () => {
    window.location.href = "/dashboard";
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-6">
      <div className="w-full max-w-xl bg-white shadow-xl rounded-2xl p-8 text-center">

        {/* Animated Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative flex items-center justify-center w-20 h-20 bg-indigo-50 rounded-full animate-pulse">
            <svg
              className="w-10 h-10 text-indigo-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01M4.93 19h14.14c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.2 16c-.77 1.33.19 3 1.73 3z"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-semibold text-gray-800">
          Something didn’t load correctly
        </h2>

        {/* Friendly message */}
        <p className="mt-3 text-gray-500 text-sm leading-relaxed">
          It looks like a small issue occurred while loading this section of the
          dashboard. Don't worry — your data is safe.
          <br />
          You can try refreshing the section or return to the dashboard.
        </p>

        {/* Buttons */}
        <div className="flex justify-center gap-3 mt-7">

          <button
            onClick={resetErrorBoundary}
            className="px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow hover:bg-indigo-700 transition"
          >
            Try Again
          </button>

          <button
            onClick={handleReloadDashboard}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            Go to Dashboard
          </button>

        </div>

        {/* Technical details */}
        {error && (
          <details className="mt-6 text-left bg-gray-50 border rounded-lg">
            <summary className="px-4 py-2 text-xs text-gray-600 cursor-pointer">
              Technical details
            </summary>
            <pre className="px-4 pb-3 text-xs text-gray-500 whitespace-pre-wrap break-words">
              {error.message}
            </pre>
          </details>
        )}

      </div>
    </div>
  );
}

export default function DashboardErrorBoundary({ children }) {
  return (
    <ErrorBoundary
      FallbackComponent={DashboardErrorFallback}
      onError={(error, info) => {
        console.error("Dashboard Error:", error, info);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}