import React from "react";
import { ErrorBoundary } from "react-error-boundary";

function GlobalErrorFallback({ error, resetErrorBoundary }) {
    const handleReload = () => {
        window.location.reload();
    };

    return (
        <div className="flex items-center justify-center min-h-screen px-6 bg-gray-50">
            <div className="w-full max-w-lg text-center">

                {/* Icon */}
                <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-full bg-red-50">
                    <span className="text-3xl">⚠️</span>
                </div>

                {/* Title */}
                <h1 className="text-2xl font-semibold text-gray-900">
                    Something went wrong
                </h1>

                {/* Description */}
                <p className="mt-2 text-sm text-gray-500">
                    An unexpected error occurred while loading the application.
                    Please try again. If the problem persists, contact support.
                </p>

                {/* Error Details */}
                {error && (
                    <details className="mt-6 text-left border border-red-200 rounded-lg bg-red-50">
                        <summary className="px-4 py-3 font-medium text-red-700 cursor-pointer">
                            Error details
                        </summary>

                        <pre className="px-4 pb-4 text-xs text-red-800 whitespace-pre-wrap break-words">
                            {error.message}
                        </pre>
                    </details>
                )}

                {/* Buttons */}
                <div className="flex justify-center gap-3 mt-6">

                    <button
                        onClick={resetErrorBoundary}
                        className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                    >
                        Retry
                    </button>

                    <button
                        onClick={handleReload}
                        className="px-5 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                    >
                        Reload Page
                    </button>

                </div>
            </div>
        </div>
    );
}

function GlobalErrorBoundary({ children }) {
    return (
        <ErrorBoundary
            FallbackComponent={GlobalErrorFallback}
            onError={(error, info) => {
                console.error("Global Error Boundary:", error, info);

                // Example: send error to monitoring
                // Sentry.captureException(error);
            }}
            onReset={() => {
                console.log("Retry triggered");
            }}
        >
            {children}
        </ErrorBoundary>
    );
}

export default GlobalErrorBoundary;