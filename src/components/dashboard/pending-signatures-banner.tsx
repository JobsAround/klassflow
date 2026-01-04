"use client"

import { useTranslations } from 'next-intl'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface PendingSignaturesBannerProps {
    pendingCount: number
    firstPendingSessionId?: string
}

export function PendingSignaturesBanner({ pendingCount, firstPendingSessionId }: PendingSignaturesBannerProps) {
    const t = useTranslations('session')

    if (pendingCount === 0) return null

    return (
        <Alert variant="destructive" className="mb-6 border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-200">
            <AlertCircle className="h-4 w-4" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full ml-2">
                <div>
                    <AlertTitle className="mb-1 font-semibold">
                        {t('pendingSignaturesTitle', { count: pendingCount })}
                    </AlertTitle>
                    <AlertDescription className="text-orange-700 dark:text-orange-300">
                        {t('pendingSignaturesDescription', { count: pendingCount })}
                    </AlertDescription>
                </div>
                {firstPendingSessionId && (
                    <Link href={`/dashboard/sessions/${firstPendingSessionId}/sign`}>
                        <Button size="sm" variant="outline" className="bg-white hover:bg-orange-100 text-orange-700 border-orange-200 w-full sm:w-auto">
                            {t('signNow')}
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                )}
            </div>
        </Alert>
    )
}
