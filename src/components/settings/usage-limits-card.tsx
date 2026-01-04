"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Users, GraduationCap, BookOpen, Calendar, Shield, ArrowUpRight } from "lucide-react"

interface LimitData {
    current: number
    limit: number
    allowed: boolean
}

interface UsageLimitsCardProps {
    usage: {
        admins: LimitData
        teachers: LimitData
        students: LimitData
        classrooms: LimitData
        sessionsPerMonth: LimitData
    }
    isSaaSMode: boolean

}

function UsageRow({
    icon: Icon,
    label,
    current,
    limit
}: {
    icon: any
    label: string
    current: number
    limit: number
}) {
    const isUnlimited = limit === 0
    const percentage = isUnlimited ? 0 : Math.min(100, Math.round((current / limit) * 100))
    const isNearLimit = percentage >= 80
    const isAtLimit = percentage >= 100

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-slate-500" />
                    <span className="text-sm font-medium">{label}</span>
                </div>
                <span className={`text-sm font-mono ${isAtLimit ? "text-red-600" : isNearLimit ? "text-amber-600" : "text-slate-600"
                    }`}>
                    {current} / {isUnlimited ? "∞" : limit}
                </span>
            </div>
            {!isUnlimited && (
                <Progress
                    value={percentage}
                    className={`h-2 ${isAtLimit ? "[&>div]:bg-red-500" : isNearLimit ? "[&>div]:bg-amber-500" : ""
                        }`}
                />
            )}
        </div>
    )
}

export function UsageLimitsCard({ usage, isSaaSMode }: UsageLimitsCardProps) {
    // Don't show if not in SaaS mode
    if (!isSaaSMode) {
        return null
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Utilisation & Limites
                </CardTitle>
                <CardDescription>
                    Suivi de l'utilisation de votre plan actuel
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <UsageRow
                    icon={Shield}
                    label="Administrateurs"
                    current={usage.admins.current}
                    limit={usage.admins.limit}
                />
                <UsageRow
                    icon={Users}
                    label="Formateurs"
                    current={usage.teachers.current}
                    limit={usage.teachers.limit}
                />
                <UsageRow
                    icon={GraduationCap}
                    label="Stagiaires"
                    current={usage.students.current}
                    limit={usage.students.limit}
                />
                <UsageRow
                    icon={BookOpen}
                    label="Classes"
                    current={usage.classrooms.current}
                    limit={usage.classrooms.limit}
                />
                <UsageRow
                    icon={Calendar}
                    label="Sessions (ce mois)"
                    current={usage.sessionsPerMonth.current}
                    limit={usage.sessionsPerMonth.limit}
                />

                {/* Subscription management link removed */}

            </CardContent>
        </Card>
    )
}
