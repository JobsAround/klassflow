"use client"

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

import { AssignTeacherDialog } from "@/components/classrooms/assign-teacher-dialog"
import { RemoveTeacherDialog } from "@/components/classrooms/remove-teacher-dialog"

interface Teacher {
    id: string
    name: string | null
    email: string
}

interface TeachersCardProps {
    teachers: Teacher[]
    classroomId: string
}

export function TeachersCard({ teachers, classroomId }: TeachersCardProps) {
    const t = useTranslations('classroom')

    if (teachers.length === 0) return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>{t('teachers')}</CardTitle>
                    <CardDescription>0 {t('teachers').toLowerCase()}</CardDescription>
                </div>
                <AssignTeacherDialog
                    classroomId={classroomId}
                    assignedTeacherIds={teachers.map(t => t.id)}
                />
            </CardHeader>
            <CardContent>
                <div className="text-sm text-slate-500 py-4">
                    No teachers assigned.
                </div>
            </CardContent>
        </Card>
    )

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>{t('teachers')}</CardTitle>
                    <CardDescription>{teachers.length} {t('teachers').toLowerCase()}</CardDescription>
                </div>
                <AssignTeacherDialog
                    classroomId={classroomId}
                    assignedTeacherIds={teachers.map(t => t.id)}
                />
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {teachers.map((teacher) => (
                        <div key={teacher.id} className="flex items-center justify-between p-2 rounded border">
                            <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                                <Badge variant="secondary" className="shrink-0 whitespace-nowrap">{teacher.name}</Badge>
                                <span className="text-sm text-slate-500 truncate" title={teacher.email}>{teacher.email}</span>
                            </div>
                            <RemoveTeacherDialog
                                classroomId={classroomId}
                                teacher={teacher}
                            />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
