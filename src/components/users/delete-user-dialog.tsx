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
import { Trash2, Loader2 } from "lucide-react"

interface DeleteUserDialogProps {
    user: {
        id: string
        name: string | null
        email: string
    }
}

export function DeleteUserDialog({ user }: DeleteUserDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleDelete() {
        setLoading(true)
        try {
            const response = await fetch(`/api/users/${user.id}`, {
                method: "DELETE",
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Failed to delete user")
            }

            setOpen(false)
            router.refresh()
        } catch (error) {
            console.error(error)
            alert(error instanceof Error ? error.message : "Failed to delete user")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                    <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete User</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete this user? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                <div className="bg-red-50 border border-red-200 rounded-md p-4 my-4">
                    <p className="text-sm text-red-800">
                        <strong>User:</strong> {user.name || "Unnamed"}
                        <br />
                        <strong>Email:</strong> {user.email}
                    </p>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete User
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
