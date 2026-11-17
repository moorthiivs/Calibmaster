import React from 'react'

function WarrringModel({ showIdleModal, countdown, logout, handleStayLoggedIn, isRecovering, recoveryError }) {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-6 animate-fadeIn">

                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">
                        Session Expiring
                    </h2>
                    <span className="text-sm text-red-500 font-medium">
                        {countdown}s
                    </span>
                </div>

                {/* Body */}
                <p className="text-gray-600 text-sm mb-4">
                    You have been inactive for a while. Your session will expire soon.
                    Click <span className="font-medium text-gray-800">Stay Logged In</span> to continue working.
                </p>

                {recoveryError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600 animate-shake">
                        {recoveryError}
                    </div>
                )}

                {/* Progress Bar */}
                {!recoveryError && (
                    <div className="w-full h-2 bg-gray-200 rounded-full mb-6 overflow-hidden">
                        <div
                            className="h-full bg-red-500 transition-all duration-1000"
                            style={{ width: `${(countdown / 60) * 100}%` }}
                        />
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 mt-2">
                    <button
                        onClick={() => logout("INACTIVE")}
                        disabled={isRecovering}
                        className="px-4 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50"
                    >
                        Logout
                    </button>

                    <button
                        onClick={handleStayLoggedIn}
                        disabled={isRecovering}
                        className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow disabled:opacity-50 flex items-center gap-2"
                    >
                        {isRecovering && (
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                        {isRecovering ? 'Processing...' : 'Stay Logged In'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default WarrringModel