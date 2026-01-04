"use client"

import { useState, useEffect } from "react"
import { useTranslations } from 'next-intl'
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Send, Check, X, Clock } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"

interface SendAttendanceButtonProps {
    sessionId: string
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
    size?: "default" | "sm" | "lg" | "icon"
    className?: string
    enrollments?: any[]
    attendances?: any[]
}

export function SendAttendanceButton({
    sessionId,
    variant = "outline",
    size = "sm",
    className,
    enrollments = [],
    attendances = []
}: SendAttendanceButtonProps) {
    const t = useTranslations('session')
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [selectedStudents, setSelectedStudents] = useState<string[]>([])

    // Initialize selection when opening
    useEffect(() => {
        if (open) {
            router.refresh()
            // Default select students who haven't signed/responded and have role STUDENT
            const pendingStudents = enrollments.filter(enrollment => {
                if (!enrollment.student || enrollment.student.role !== "STUDENT") return false
                const attendance = attendances.find(a => a.studentId === enrollment.student.id)
                return !attendance || (attendance.status !== "PRESENT" && !attendance.signatureUrl && attendance.status !== "ABSENT")
            }).map(e => e.student.id)

            setSelectedStudents(pendingStudents)
        }
        // We only want to run this when the dialog opens, not when data refreshes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open])

    const handleSend = async () => {
        if (selectedStudents.length === 0) return

        setLoading(true)
        try {
            const res = await fetch(`/api/sessions/${sessionId}/send-attendance`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ studentIds: selectedStudents })
            })

            if (!res.ok) throw new Error("Failed to send emails")

            const data = await res.json()
            alert(data.message)
            setOpen(false)
        } catch (error) {
            console.error(error)
            alert("Failed to send attendance emails.")
        } finally {
            setLoading(false)
        }
    }

    const toggleStudent = (studentId: string) => {
        setSelectedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        )
    }

    const toggleAll = () => {
        const studentEnrollments = enrollments.filter(e => e.student?.role === "STUDENT")
        if (selectedStudents.length === studentEnrollments.length) {
            setSelectedStudents([])
        } else {
            setSelectedStudents(studentEnrollments.map(e => e.student.id))
        }
    }

    const getStudentStatus = (studentId: string) => {
        const attendance = attendances.find(a => a.studentId === studentId)
        if (!attendance) return "NONE"
        if (attendance.status === "PRESENT" || attendance.signatureUrl) return "SIGNED"
        if (attendance.status === "ABSENT") return "ABSENT"
        return "NONE"
    }

    // Filter to only show students (not teachers)
    const studentEnrollments = enrollments.filter(e => e.student?.role === "STUDENT")

    return (
        <>
            <Button
                variant={variant}
                size={size}
                onClick={() => setOpen(true)}
                className={className}
                title="Signature apprenants"
            >
                <Send className="w-4 h-4 mr-2" />
                Signature apprenants
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{t('sendSigningRequest')}</DialogTitle>
                        <DialogDescription>
                            Select students to send the signature request email to.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <div className="flex items-center space-x-2 mb-4 pb-2 border-b">
                            <Checkbox
                                id="select-all"
                                checked={selectedStudents.length === studentEnrollments.length && studentEnrollments.length > 0}
                                onCheckedChange={toggleAll}
                            />
                            <label
                                htmlFor="select-all"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                Select All
                            </label>
                        </div>

                        <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                            {studentEnrollments.map(enrollment => {
                                const student = enrollment.student
                                if (!student) return null

                                const status = getStudentStatus(student.id)
                                return (
                                    <div key={student.id} className="flex items-center justify-between p-2 rounded hover:bg-slate-50 border">
                                        <div className="flex items-center space-x-3">
                                            <Checkbox
                                                id={`student-${student.id}`}
                                                checked={selectedStudents.includes(student.id)}
                                                onCheckedChange={() => toggleStudent(student.id)}
                                            />
                                            <div className="flex flex-col">
                                                <label
                                                    htmlFor={`student-${student.id}`}
                                                    className="text-sm font-medium leading-none cursor-pointer"
                                                >
                                                    {student.name || "Unknown"}
                                                </label>
                                                <span className="text-xs text-slate-500">{student.email}</span>
                                            </div>
                                        </div>
                                        <div>
                                            {status === "SIGNED" && (
                                                <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                                                    <Check className="w-3 h-3 mr-1" /> Signed
                                                </Badge>
                                            )}
                                            {status === "ABSENT" && (
                                                <Badge variant="destructive">
                                                    <X className="w-3 h-3 mr-1" /> Absent
                                                </Badge>
                                            )}
                                            {status === "NONE" && (
                                                <Badge variant="secondary" className="text-slate-500">
                                                    <Clock className="w-3 h-3 mr-1" /> Unsigned
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button onClick={handleSend} disabled={loading || selectedStudents.length === 0}>
                            {loading ? "Sending..." : `Send to ${selectedStudents.length} Students`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
