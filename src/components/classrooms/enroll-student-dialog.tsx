"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { UserPlus, Loader2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { useTranslations } from 'next-intl'

interface EnrollStudentDialogProps {
    classroomId: string
    enrolledStudentIds: string[]
}

interface Student {
    id: string
    name: string | null
    email: string
}

export function EnrollStudentDialog({ classroomId, enrolledStudentIds }: EnrollStudentDialogProps) {
    const t = useTranslations('classroom')
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [students, setStudents] = useState<Student[]>([])
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [email, setEmail] = useState("")
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const router = useRouter()

    useEffect(() => {
        if (open) {
            fetchStudents()
        }
    }, [open])

    async function fetchStudents() {
        try {
            const response = await fetch("/api/users")
            if (response.ok) {
                const data = await response.json()
                // Filter to only students not already enrolled
                const availableStudents = data.filter(
                    (u: any) => u.role === "STUDENT" && !enrolledStudentIds.includes(u.id)
                )
                setStudents(availableStudents)
            }
        } catch (error) {
            console.error("Failed to fetch students:", error)
        }
    }

    function toggleStudent(studentId: string) {
        setSelectedIds(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        )
    }

    async function handleEnroll() {
        if (selectedIds.length === 0 && (!email || !firstName || !lastName)) return

        setLoading(true)
        try {
            const response = await fetch(`/api/classrooms/${classroomId}/enrollments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    studentIds: selectedIds,
                    emails: email ? [{ email, name: `${firstName} ${lastName}` }] : []
                }),
            })

            if (!response.ok) {
                throw new Error("Failed to enroll students")
            }

            setOpen(false)
            setSelectedIds([])
            setEmail("")
            setFirstName("")
            setLastName("")
            router.refresh()
        } catch (error) {
            console.error(error)
            alert("Failed to enroll students")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <UserPlus className="w-4 h-4 mr-2" />
                    {t('addStudent')}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[600px] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{t('enrollStudents')}</DialogTitle>
                    <DialogDescription>
                        {t('selectExisting')}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Add by Email */}
                    <div className="space-y-4">
                        <Label>{t('addByEmail')}</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-2">
                                <Label htmlFor="firstName" className="text-xs">{t('firstName')}</Label>
                                <input
                                    id="firstName"
                                    type="text"
                                    placeholder="John"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName" className="text-xs">{t('lastName')}</Label>
                                <input
                                    id="lastName"
                                    type="text"
                                    placeholder="Doe"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-xs">{t('email')}</Label>
                            <input
                                id="email"
                                type="email"
                                placeholder="student@example.com"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <p className="text-xs text-slate-500">
                            {t('newUserHint')}
                        </p>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">{t('orSelectExisting')}</span>
                        </div>
                    </div>

                    {/* Select Existing */}
                    <div className="space-y-2">
                        <Label>{t('availableStudents')}</Label>
                        {students.length === 0 ? (
                            <p className="text-sm text-slate-500 py-2">
                                {t('noStudentsFound')}
                            </p>
                        ) : (
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {students.map((student) => (
                                    <div
                                        key={student.id}
                                        className="flex items-center space-x-2 p-2 hover:bg-slate-50 rounded"
                                    >
                                        <Checkbox
                                            id={student.id}
                                            checked={selectedIds.includes(student.id)}
                                            onCheckedChange={() => toggleStudent(student.id)}
                                        />
                                        <label
                                            htmlFor={student.id}
                                            className="flex-1 cursor-pointer"
                                        >
                                            <p className="text-sm font-medium">
                                                {student.name || "Unnamed"}
                                            </p>
                                            <p className="text-xs text-slate-500">{student.email}</p>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        {t('cancel')}
                    </Button>
                    <Button
                        onClick={handleEnroll}
                        disabled={loading || (selectedIds.length === 0 && (!email || !firstName || !lastName))}
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('enroll')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
