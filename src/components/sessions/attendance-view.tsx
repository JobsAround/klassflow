"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { CheckCircle, XCircle, AlertCircle, FileText, Send, Download } from "lucide-react"

interface AttendanceViewProps {
    session: {
        id: string
        title: string | null
        startTime: string | Date
        endTime: string | Date
        type: string
        teacherSignature?: string | null
    }
    enrollments: Array<{
        student: { id: string; name: string | null; email: string; role?: string }
    }>
    attendances: Array<{
        id: string
        status: string
        studentId: string
        signatureUrl?: string | null
        signedAt?: string | Date
    }>
    onSendAttendance?: (sessionId: string) => Promise<void>
    onDownloadPdf?: (sessionId: string) => Promise<void>
    translations?: Partial<{
        title: string
        description: string
        present: string
        absent: string
        unsigned: string
        student: string
        status: string
        signature: string
        actions: string
        sendRequests: string
        downloadPdf: string
        notSigned: string
        signed: string
    }>
}

const defaultTranslations = {
    title: "Attendance Sheet",
    description: "Manage student attendance and signatures",
    present: "Present",
    absent: "Absent",
    unsigned: "Pending",
    student: "Student",
    status: "Status",
    signature: "Signature",
    actions: "Actions",
    sendRequests: "Send Requests",
    downloadPdf: "Download PDF",
    notSigned: "Not signed",
    signed: "Signed"
}

export function AttendanceView({
    session,
    enrollments,
    attendances,
    onSendAttendance,
    onDownloadPdf,
    translations = {}
}: AttendanceViewProps) {
    const t = { ...defaultTranslations, ...translations }

    // Filter students only
    const studentEnrollments = enrollments.filter(e => e.student?.role === "STUDENT")

    const getStatus = (studentId: string) => {
        const attendance = attendances.find(a => a.studentId === studentId)
        if (!attendance) return "UNSIGNED"
        if (attendance.status === "PRESENT" || attendance.signatureUrl) return "PRESENT"
        if (attendance.status === "ABSENT") return "ABSENT"
        return "UNSIGNED"
    }

    const stats = {
        present: studentEnrollments.filter(e => getStatus(e.student.id) === "PRESENT").length,
        absent: studentEnrollments.filter(e => getStatus(e.student.id) === "ABSENT").length,
        unsigned: studentEnrollments.filter(e => getStatus(e.student.id) === "UNSIGNED").length,
        total: studentEnrollments.length
    }

    const completionRate = stats.total > 0
        ? Math.round(((stats.present + stats.absent) / stats.total) * 100)
        : 0

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
                    <p className="text-slate-500">
                        {session.title || "Untitled Session"} • {new Date(session.startTime).toLocaleDateString()}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {onDownloadPdf && (
                        <Button variant="outline" onClick={() => onDownloadPdf(session.id)}>
                            <Download className="w-4 h-4 mr-2" />
                            {t.downloadPdf}
                        </Button>
                    )}
                    {onSendAttendance && (
                        <Button onClick={() => onSendAttendance(session.id)}>
                            <Send className="w-4 h-4 mr-2" />
                            {t.sendRequests}
                        </Button>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{completionRate}%</div>
                        <p className="text-xs text-muted-foreground uppercase font-bold mt-1">Completed</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 flex flex-col">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-2xl font-bold">{stats.present}</span>
                        </div>
                        <p className="text-xs text-muted-foreground uppercase font-bold mt-1">{t.present}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 flex flex-col">
                        <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-red-500" />
                            <span className="text-2xl font-bold">{stats.absent}</span>
                        </div>
                        <p className="text-xs text-muted-foreground uppercase font-bold mt-1">{t.absent}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 flex flex-col">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-orange-500" />
                            <span className="text-2xl font-bold">{stats.unsigned}</span>
                        </div>
                        <p className="text-xs text-muted-foreground uppercase font-bold mt-1">{t.unsigned}</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t.student}s</CardTitle>
                    <CardDescription>{t.description}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t.student}</TableHead>
                                <TableHead>{t.status}</TableHead>
                                <TableHead>{t.signature}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {studentEnrollments.map((enrollment) => {
                                const status = getStatus(enrollment.student.id)
                                const attendance = attendances.find(a => a.studentId === enrollment.student.id)

                                return (
                                    <TableRow key={enrollment.student.id}>
                                        <TableCell className="font-medium">
                                            {enrollment.student.name || enrollment.student.email}
                                        </TableCell>
                                        <TableCell>
                                            {status === "PRESENT" && (
                                                <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
                                                    {t.present}
                                                </Badge>
                                            )}
                                            {status === "ABSENT" && (
                                                <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100">
                                                    {t.absent}
                                                </Badge>
                                            )}
                                            {status === "UNSIGNED" && (
                                                <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
                                                    {t.unsigned}
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {attendance?.signatureUrl ? (
                                                <Badge variant="outline" className="gap-1 text-green-700 border-green-200">
                                                    <FileText className="w-3 h-3" />
                                                    {t.signed}
                                                </Badge>
                                            ) : (
                                                <span className="text-sm text-slate-400 italic">{t.notSigned}</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
