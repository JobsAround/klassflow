"use client"

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EnrollStudentDialog } from "@/components/classrooms/enroll-student-dialog"
import { RemoveStudentDialog } from "@/components/classrooms/remove-student-dialog"
import { Badge } from "@/components/ui/badge"

interface Student {
    id: string
    name: string | null
    email: string
}

interface Enrollment {
    id: string
    student: Student
}

interface StudentsCardProps {
    classroomId: string
    enrollments: Enrollment[]
}

export function StudentsCard({ classroomId, enrollments }: StudentsCardProps) {
    const t = useTranslations('classroom')

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>
                        {t('students')} ({enrollments.length})
                    </CardTitle>
                    <CardDescription>
                        {t('students')} in this classroom
                    </CardDescription>
                </div>
                <EnrollStudentDialog
                    classroomId={classroomId}
                    enrolledStudentIds={enrollments.map(e => e.student.id)}
                />
            </CardHeader>
            <CardContent>
                {enrollments.length === 0 ? (
                    <p className="text-slate-500 text-sm">
                        No {t('students').toLowerCase()} enrolled. Click "Enroll {t('students')}" to add {t('students').toLowerCase()}.
                    </p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {enrollments.map((enrollment) => (
                            <div key={enrollment.id} className="flex items-center justify-between p-2 border rounded">
                                <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                        <span className="text-sm font-medium text-blue-600">
                                            {enrollment.student.name?.charAt(0) || "?"}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate" title={enrollment.student.name || ""}>{enrollment.student.name}</p>
                                        <p className="text-xs text-slate-500 truncate" title={enrollment.student.email}>{enrollment.student.email}</p>
                                    </div>
                                </div>
                                <RemoveStudentDialog
                                    classroomId={classroomId}
                                    student={enrollment.student}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
