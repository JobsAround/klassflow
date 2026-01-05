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

interface AssignTeacherDialogProps {
    classroomId: string
    assignedTeacherIds: string[]
}

interface Teacher {
    id: string
    name: string | null
    email: string
    role: string
}

export function AssignTeacherDialog({ classroomId, assignedTeacherIds }: AssignTeacherDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [teachers, setTeachers] = useState<Teacher[]>([])
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const router = useRouter()

    useEffect(() => {
        if (open) {
            fetchTeachers()
        }
    }, [open])

    async function fetchTeachers() {
        try {
            const response = await fetch("/api/users")
            if (response.ok) {
                const data = await response.json()
                // Filter to only teachers/admins not already assigned
                const availableTeachers = data.filter(
                    (u: any) =>
                        (u.role === "TEACHER" || u.role === "ADMIN") &&
                        !assignedTeacherIds.includes(u.id)
                )
                setTeachers(availableTeachers)
            }
        } catch (error) {
            console.error("Failed to fetch teachers:", error)
        }
    }

    function toggleTeacher(teacherId: string) {
        setSelectedIds(prev =>
            prev.includes(teacherId)
                ? prev.filter(id => id !== teacherId)
                : [...prev, teacherId]
        )
    }

    async function handleAssign() {
        if (selectedIds.length === 0) return

        setLoading(true)
        try {
            const response = await fetch(`/api/classrooms/${classroomId}/teachers`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ teacherIds: selectedIds }),
            })

            if (!response.ok) {
                throw new Error("Failed to assign teachers")
            }

            setOpen(false)
            setSelectedIds([])
            router.refresh()
        } catch (error) {
            console.error(error)
            alert("Failed to assign teachers")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Assign Teachers
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[600px] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Assign Teachers</DialogTitle>
                    <DialogDescription>
                        Select teachers to assign to this classroom
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {teachers.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-4">
                            No available teachers to assign
                        </p>
                    ) : (
                        <div className="space-y-2">
                            <Label>Available Teachers</Label>
                            {teachers.map((teacher) => (
                                <div
                                    key={teacher.id}
                                    className="flex items-center space-x-2 p-2 hover:bg-slate-50 rounded"
                                >
                                    <Checkbox
                                        id={teacher.id}
                                        checked={selectedIds.includes(teacher.id)}
                                        onCheckedChange={() => toggleTeacher(teacher.id)}
                                    />
                                    <label
                                        htmlFor={teacher.id}
                                        className="flex-1 cursor-pointer"
                                    >
                                        <p className="text-sm font-medium">
                                            {teacher.name || "Unnamed"}
                                            <span className="ml-2 text-xs text-slate-500">
                                                ({teacher.role})
                                            </span>
                                        </p>
                                        <p className="text-xs text-slate-500">{teacher.email}</p>
                                    </label>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleAssign}
                        disabled={loading || selectedIds.length === 0}
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Assign {selectedIds.length > 0 && `(${selectedIds.length})`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
