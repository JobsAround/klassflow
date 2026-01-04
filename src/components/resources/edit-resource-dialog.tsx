"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface EditResourceDialogProps {
    resource: {
        id: string
        title: string
        description: string | null
        url: string
        type: string
        pinned: boolean
        createdAt: string | Date
    } | null
    open: boolean
    onOpenChange: (open: boolean) => void
    classroomId: string
}

export function EditResourceDialog({ resource, open, onOpenChange, classroomId }: EditResourceDialogProps) {
    const router = useRouter()
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [url, setUrl] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        if (resource) {
            setTitle(resource.title)
            setDescription(resource.description || "")
            setUrl(resource.url)
        }
    }, [resource])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!resource) return

        setLoading(true)
        setError("")

        try {
            const res = await fetch(`/api/classrooms/${classroomId}/resources/${resource.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    description: description || null,
                    url: resource.type === "LINK" ? url : undefined
                })
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "Failed to update resource")
            }

            onOpenChange(false)
            router.refresh()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (!resource) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Resource</DialogTitle>
                    <DialogDescription>
                        Make changes to the resource details here.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Resource title"
                            required
                        />
                    </div>

                    {resource.type === "LINK" && (
                        <div className="space-y-2">
                            <Label htmlFor="url">URL</Label>
                            <Input
                                id="url"
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://..."
                                required
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Optional description"
                            className="resize-none h-24"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
