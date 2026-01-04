"use client"

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Users } from "lucide-react"
import Link from "next/link"
import { CreateClassroomDialog } from "@/components/classrooms/create-classroom-dialog"
import { PendingSignaturesBanner } from "@/components/dashboard/pending-signatures-banner"

interface Classroom {
    id: string
    name: string
    description: string | null
    _count: {
        sessions: number
        resources: number
    }
    teachers: Array<{
        id: string
        name: string | null
        email: string
    }>
}

interface ClassroomsListProps {
    classrooms: Classroom[]
    pendingCount?: number
    firstPendingSessionId?: string
    basePath?: string
}

export function ClassroomsList({ classrooms, pendingCount = 0, firstPendingSessionId, basePath = '/classrooms' }: ClassroomsListProps) {
    const t = useTranslations('classroom')

    return (
        <div className="space-y-6">
            <PendingSignaturesBanner
                pendingCount={pendingCount}
                firstPendingSessionId={firstPendingSessionId}
            />

            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
                <CreateClassroomDialog />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {classrooms.map((classroom) => (
                    <Link key={classroom.id} href={`${basePath}/${classroom.id}`}>
                        <Card className="hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BookOpen className="w-5 h-5" />
                                    {classroom.name}
                                </CardTitle>
                                {classroom.description && (
                                    <CardDescription>{classroom.description}</CardDescription>
                                )}
                                {!classroom.description && (
                                    <CardDescription className="text-slate-400 italic">{t('noDescription')}</CardDescription>
                                )}
                            </CardHeader>
                            <CardContent className="mt-auto">
                                <div className="flex items-center gap-4 text-sm text-slate-500">
                                    <div className="flex items-center gap-1">
                                        <Users className="w-4 h-4" />
                                        <span>{classroom.teachers.length} {t('teachers')}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <BookOpen className="w-4 h-4" />
                                        <span>{classroom._count.sessions} {t('sessions')}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {classrooms.length === 0 && (
                <Card>
                    <CardContent className="py-8 text-center text-slate-500">
                        <p>{t('noClassrooms')}</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
