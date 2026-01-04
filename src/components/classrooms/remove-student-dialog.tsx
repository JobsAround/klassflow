"use client"

import { useState } from "react"
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
import { X, Loader2 } from "lucide-react"

interface RemoveStudentDialogProps {
    classroomId: string
    student: {
        id: string
        name: string | null
        email: string
    }
}

export function RemoveStudentDialog({ classroomId, student }: RemoveStudentDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleRemove() {
        setLoading(true)
        try {
            const response = await fetch(
                `/api/classrooms/${classroomId}/enrollments?studentId=${student.id}`,
                { method: "DELETE" }
            )

            if (!response.ok) {
                throw new Error("Failed to remove student")
            }

            setOpen(false)
            router.refresh()
        } catch (error) {
            console.error(error)
            alert("Failed to remove student")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <X className="h-4 w-4 text-red-600" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Remove Student</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to remove this student from the classroom?
                    </DialogDescription>
                </DialogHeader>

                <div className="bg-amber-50 border border-amber-200 rounded-md p-4 my-4">
                    <p className="text-sm text-amber-800">
                        <strong>Student:</strong> {student.name || "Unnamed"}
                        <br />
                        <strong>Email:</strong> {student.email}
                    </p>
                    <p className="text-xs text-amber-700 mt-2">
                        They will lose access to classroom resources and sessions.
                    </p>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleRemove} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Remove Student
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
