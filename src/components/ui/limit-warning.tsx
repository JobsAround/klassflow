"use client"

import { AlertTriangle, ArrowUpRight } from "lucide-react"


interface LimitWarningProps {
    message: string
    current: number
    limit: number
    showUpgrade?: boolean
}

export function LimitWarning({ message, current, limit, showUpgrade = true }: LimitWarningProps) {
    const percentage = Math.round((current / limit) * 100)
    const isAtLimit = current >= limit
    const isNearLimit = percentage >= 80

    return (
        <div
            className={`rounded-lg border p-4 ${isAtLimit
                ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900"
                : isNearLimit
                    ? "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900"
                    : "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900"
                }`}
        >
            <div className="flex items-start gap-3">
                <AlertTriangle
                    className={`h-5 w-5 mt-0.5 flex-shrink-0 ${isAtLimit
                        ? "text-red-600 dark:text-red-400"
                        : isNearLimit
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-blue-600 dark:text-blue-400"
                        }`}
                />
                <div className="flex-1 min-w-0">
                    <p
                        className={`font-medium ${isAtLimit
                            ? "text-red-800 dark:text-red-200"
                            : isNearLimit
                                ? "text-amber-800 dark:text-amber-200"
                                : "text-blue-800 dark:text-blue-200"
                            }`}
                    >
                        {message}
                    </p>

                    {/* Progress bar */}
                    <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all ${isAtLimit
                                ? "bg-red-500"
                                : isNearLimit
                                    ? "bg-amber-500"
                                    : "bg-blue-500"
                                }`}
                            style={{ width: `${Math.min(100, percentage)}%` }}
                        />
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {current} / {limit} utilisés ({percentage}%)
                    </p>

                    {/* Upgrade link */}

                </div>
            </div>
        </div>
    )
}

/**
 * Inline limit indicator for use in headers/cards
 */
export function LimitBadge({ current, limit }: { current: number; limit: number }) {
    if (limit === 0) return null // Unlimited

    const percentage = Math.round((current / limit) * 100)
    const isAtLimit = current >= limit
    const isNearLimit = percentage >= 80

    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${isAtLimit
                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                : isNearLimit
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                }`}
        >
            {current}/{limit}
        </span>
    )
}
