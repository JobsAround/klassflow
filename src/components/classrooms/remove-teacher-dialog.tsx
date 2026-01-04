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

interface RemoveTeacherDialogProps {
    classroomId: string
    teacher: {
        id: string
        name: string | null
        email: string
    }
}

export function RemoveTeacherDialog({ classroomId, teacher }: RemoveTeacherDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleRemove() {
        setLoading(true)
        try {
            const response = await fetch(
                `/api/classrooms/${classroomId}/teachers?teacherId=${teacher.id}`,
                { method: "DELETE" }
            )

            if (!response.ok) {
                throw new Error("Failed to remove teacher")
            }

            setOpen(false)
            router.refresh()
        } catch (error) {
            console.error(error)
            alert("Failed to remove teacher")
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
                    <DialogTitle>Remove Teacher</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to remove this teacher from the classroom?
                    </DialogDescription>
                </DialogHeader>

                <div className="bg-amber-50 border border-amber-200 rounded-md p-4 my-4">
                    <p className="text-sm text-amber-800">
                        <strong>Teacher:</strong> {teacher.name || "Unnamed"}
                        <br />
                        <strong>Email:</strong> {teacher.email}
                    </p>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleRemove} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Remove Teacher
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
