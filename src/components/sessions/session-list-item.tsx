"use client"

import { useState } from "react"
import { useTranslations } from 'next-intl'
import { useDateLocale } from '@/hooks/use-date-locale'
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { QrCode, Users, CheckCircle, XCircle, AlertCircle, Video, Trash2, Loader2 } from "lucide-react"
import { SendAttendanceButton } from "@/components/sessions/send-attendance-button"
import { TeacherSignButton } from "@/components/sessions/teacher-sign-button"
import { EditSessionDialog } from "@/components/sessions/edit-session-dialog"
import { DeleteSessionDialog } from "@/components/sessions/delete-session-dialog"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface SessionListItemProps {
    session: {
        id: string
        title: string | null
        startTime: Date
        endTime: Date
        type: "ONSITE" | "ONLINE" | "HOMEWORK"
        attendances?: any[]
        teacherSignature?: string | null
        teacherId?: string | null
    }
    isTeacher: boolean
    currentUserId: string
    currentUserName?: string | null
    enrollments?: any[]
    teachers?: { id: string; name: string | null; email: string }[]
    classroomName?: string
}

export function SessionListItem({ session, isTeacher, currentUserId, currentUserName, enrollments = [], teachers = [], classroomName = "Classroom" }: SessionListItemProps) {
    const t = useTranslations('session')
    const tClassroom = useTranslations('classroom')
    const dateLocale = useDateLocale()
    const router = useRouter()
    const [isRemoving, setIsRemoving] = useState<string | null>(null)
    const attendances = session.attendances || []

    const handleRemoveAttendance = async (sessionId: string, studentId: string) => {
        setIsRemoving(studentId)
        try {
            const res = await fetch(`/api/sessions/${sessionId}/attendance/${studentId}`, {
                method: "DELETE"
            })

            if (!res.ok) {
                throw new Error("Failed to remove signature")
            }

            router.refresh()
        } catch (error) {
            console.error(error)
        } finally {
            setIsRemoving(null)
        }
    }

    // Filter out teacher's attendance from statistics (only count students)
    const studentAttendances = attendances.filter(a => {
        const enrollment = enrollments.find(e => e.student?.id === a.studentId)
        return enrollment?.student?.role === "STUDENT"
    })

    // Calculate stats (only for students)
    // Calculate stats (only for students)
    const requestsCount = enrollments.filter(e => e.student?.role === "STUDENT").length
    const signaturesCount = studentAttendances.filter(a => a.status === "PRESENT" || a.signatureUrl).length
    const absencesCount = studentAttendances.filter(a => a.status === "ABSENT").length
    const pendingCount = requestsCount - signaturesCount - absencesCount

    // Identify pending students (request sent but no action)
    const pendingStudents = enrollments.filter(enrollment => {
        if (!enrollment.student || enrollment.student.role !== "STUDENT") return false
        const attendance = attendances.find(a => a.studentId === enrollment.student.id)
        if (!attendance) return true
        return attendance.status !== "PRESENT" && attendance.status !== "ABSENT" && !attendance.signatureUrl
    })

    // Check if teacher has signed
    const teacherHasSigned = !!session.teacherSignature

    return (
        <div className="flex flex-col gap-4 p-4 border rounded-lg bg-white dark:bg-slate-950">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-lg">{session.title || tClassroom('untitledSession')}</h3>
                        <Badge variant={session.type === "ONLINE" ? "default" : session.type === "HOMEWORK" ? "outline" : "secondary"}>
                            {session.type === "ONLINE" ? `🌐 ${t('online')}` : session.type === "HOMEWORK" ? `📚 ${t('homework')}` : `🏫 ${t('onsite')}`}
                        </Badge>
                    </div>
                    <p className="text-sm text-slate-500">
                        {new Date(session.startTime).toLocaleDateString(dateLocale, {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        })}
                    </p>
                    <p className="text-sm text-slate-500">
                        {new Date(session.startTime).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                        {" - "}
                        {new Date(session.endTime).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </p>
                    {session.teacherId && (
                        <div className="mt-2">
                            <Badge variant="outline" className="text-xs bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 gap-1">
                                <span>👨‍🏫</span>
                                <span>{teachers.find(t => t.id === session.teacherId)?.name || "Teacher assigned"}</span>
                            </Badge>
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {isTeacher && (
                        <>
                            {/* Per-session live button removed in favor of classroom-level button */}

                            <SendAttendanceButton
                                sessionId={session.id}
                                enrollments={enrollments}
                                attendances={attendances}
                            />
                            <TeacherSignButton
                                sessionId={session.id}
                                teacherId={currentUserId}
                                teacherName={currentUserName || teachers.find(t => t.id === currentUserId)?.name || "Teacher"}
                                teachers={teachers}
                                hasSigned={teacherHasSigned}
                            />
                            <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />
                            <EditSessionDialog session={session} teachers={teachers} classroomName={classroomName} />
                            <DeleteSessionDialog sessionId={session.id} sessionTitle={session.title} />
                        </>
                    )}
                </div >
            </div>

            {/* Stats Section */}
            {
                isTeacher && (
                    <div className="flex items-center gap-4 pt-4 border-t">
                        <div className="flex flex-col items-center justify-center px-4 border-r">
                            <span className="text-2xl font-bold text-slate-700 dark:text-slate-200">
                                {requestsCount > 0
                                    ? Math.round(((signaturesCount + absencesCount) / requestsCount) * 100)
                                    : 0}%
                            </span>
                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{t('completed')}</span>
                            {/* DEBUG: Req:{requestsCount} Sig:{signaturesCount} Abs:{absencesCount} Pen:{pendingCount} */}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
                            <div className="flex flex-col">
                                <span className="text-xs text-slate-500 uppercase font-semibold">{tClassroom('students')}</span>
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-blue-500" />
                                    <span className="font-bold">{requestsCount}</span>
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs text-slate-500 uppercase font-semibold">{t('signatures')}</span>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    <span className="font-bold">{signaturesCount}</span>
                                    {signaturesCount > 0 && (
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">View</Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-64 p-2">
                                                <h4 className="font-medium text-sm mb-2">{t('signatures')}</h4>
                                                <div className="space-y-1 max-h-48 overflow-y-auto">
                                                    {studentAttendances
                                                        .filter(a => a.status === "PRESENT" || a.signatureUrl)
                                                        .map(attendance => {
                                                            const student = enrollments.find(e => e.student.id === attendance.studentId)?.student
                                                            return (
                                                                <div key={attendance.studentId} className="flex items-center justify-between text-sm px-2 py-1 rounded hover:bg-slate-100 group">
                                                                    <span>{student?.name || student?.email || "Unknown"}</span>
                                                                    <Popover>
                                                                        <PopoverTrigger asChild>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-6 w-6 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                            >
                                                                                <Trash2 className="w-3 h-3" />
                                                                            </Button>
                                                                        </PopoverTrigger>
                                                                        <PopoverContent className="w-48 p-2">
                                                                            <div className="space-y-2">
                                                                                <p className="text-xs font-medium text-center">Remove signature?</p>
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="destructive"
                                                                                    className="w-full text-xs h-7"
                                                                                    onClick={() => handleRemoveAttendance(session.id, attendance.studentId)}
                                                                                    disabled={isRemoving === attendance.studentId}
                                                                                >
                                                                                    {isRemoving === attendance.studentId ? (
                                                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                                                    ) : "Confirm"}
                                                                                </Button>
                                                                            </div>
                                                                        </PopoverContent>
                                                                    </Popover>
                                                                </div>
                                                            )
                                                        })}
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs text-slate-500 uppercase font-semibold">{t('absences')}</span>
                                <div className="flex items-center gap-2">
                                    <XCircle className="w-4 h-4 text-red-500" />
                                    <span className="font-bold">{absencesCount}</span>
                                    {absencesCount > 0 && (
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">View</Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-64 p-2">
                                                <h4 className="font-medium text-sm mb-2">{t('absences')}</h4>
                                                <div className="space-y-1 max-h-48 overflow-y-auto">
                                                    {studentAttendances
                                                        .filter(a => a.status === "ABSENT")
                                                        .map(attendance => {
                                                            const student = enrollments.find(e => e.student.id === attendance.studentId)?.student
                                                            return (
                                                                <div key={attendance.studentId} className="flex items-center justify-between text-sm px-2 py-1 rounded hover:bg-slate-100 group">
                                                                    <span>{student?.name || student?.email || "Unknown"}</span>
                                                                    <Popover>
                                                                        <PopoverTrigger asChild>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-6 w-6 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-700 hover:bg-red-50"
                                                                            >
                                                                                <Trash2 className="w-3 h-3" />
                                                                            </Button>
                                                                        </PopoverTrigger>
                                                                        <PopoverContent className="w-48 p-2">
                                                                            <div className="space-y-2">
                                                                                <p className="text-xs font-medium text-center">Remove absence?</p>
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="destructive"
                                                                                    className="w-full text-xs h-7"
                                                                                    onClick={() => handleRemoveAttendance(session.id, attendance.studentId)}
                                                                                    disabled={isRemoving === attendance.studentId}
                                                                                >
                                                                                    {isRemoving === attendance.studentId ? (
                                                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                                                    ) : "Confirm"}
                                                                                </Button>
                                                                            </div>
                                                                        </PopoverContent>
                                                                    </Popover>
                                                                </div>
                                                            )
                                                        })}
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs text-slate-500 uppercase font-semibold">{t('unsigned')}</span>
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-orange-500" />
                                    <span className="font-bold">{pendingCount}</span>
                                    {pendingCount > 0 && (
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">View</Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-64 p-2">
                                                <h4 className="font-medium text-sm mb-2">{t('unsigned')}</h4>
                                                <div className="space-y-1 max-h-48 overflow-y-auto">
                                                    {pendingStudents.map(enrollment => (
                                                        <div key={enrollment.student.id} className="text-sm px-2 py-1 rounded hover:bg-slate-100">
                                                            {enrollment.student.name || enrollment.student.email}
                                                        </div>
                                                    ))}
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    )
}
