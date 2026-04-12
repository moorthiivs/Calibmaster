import React from "react";
import { ErrorBoundary } from "react-error-boundary";

function PageErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="flex items-center justify-center min-h-[70vh] px-6">
      <div className="max-w-md w-full bg-white border rounded-xl shadow-md p-7 text-center">

        {/* Animated Illustration */}
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center animate-bounce">
            <svg
              className="w-8 h-8 text-orange-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-800">
          We couldn’t load this page
        </h3>

        {/* Friendly message */}
        <p className="mt-2 text-sm text-gray-500">
          Something interrupted the page loading process.
          Try refreshing this page to continue.
        </p>

        {/* Retry button */}
        <button
          onClick={resetErrorBoundary}
          className="mt-5 px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
        >
          Refresh Page
        </button>

        {/* Details */}
        {error && (
          <details className="mt-5 text-left bg-gray-50 border rounded-md">
            <summary className="px-3 py-2 text-xs text-gray-600 cursor-pointer">
              Error details
            </summary>
            <pre className="px-3 pb-3 text-xs text-gray-500 whitespace-pre-wrap break-words">
              {error.message}
            </pre>
          </details>
        )}

      </div>
    </div>
  );
}

export default function PageErrorBoundary({ children }) {
  return (
    <ErrorBoundary
      FallbackComponent={PageErrorFallback}
      onError={(error, info) => {
        console.error("Page Error:", error, info);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
