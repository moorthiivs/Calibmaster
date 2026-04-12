import React from 'react'

function WarrringModel({ showIdleModal, countdown, logout, handleStayLoggedIn }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
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
                <p className="text-gray-600 text-sm mb-6">
                    You have been inactive for a while. Your session will expire soon.
                    Click <span className="font-medium text-gray-800">Stay Logged In</span> to continue working.
                </p>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-gray-200 rounded-full mb-6 overflow-hidden">
                    <div
                        className="h-full bg-red-500 transition-all duration-1000"
                        style={{ width: `${(countdown / 10) * 100}%` }}
                    />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                    <button
                        onClick={() => logout("INACTIVE")}
                        className="px-4 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
                    >
                        Logout
                    </button>

                    <button
                        onClick={handleStayLoggedIn}
                        className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow"
                    >
                        Stay Logged In
                    </button>
                </div>
            </div>
        </div>
    )
}

export default WarrringModel
