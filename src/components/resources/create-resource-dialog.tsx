"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Link, FileUp, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface CreateResourceDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    classroomId: string
}

export function CreateResourceDialog({ open, onOpenChange, classroomId }: CreateResourceDialogProps) {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState("link")
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [url, setUrl] = useState("")
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const resetForm = () => {
        setTitle("")
        setDescription("")
        setUrl("")
        setFile(null)
        setError("")
        setLoading(false)
    }

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            resetForm()
        }
        onOpenChange(newOpen)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            if (activeTab === "link") {
                if (!url) throw new Error("URL is required")

                const res = await fetch(`/api/classrooms/${classroomId}/resources`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        title,
                        description: description || null,
                        url,
                        type: "LINK"
                    })
                })

                if (!res.ok) {
                    const data = await res.json()
                    throw new Error(data.error || "Failed to create resource")
                }
            } else {
                if (!file) throw new Error("File is required")

                const formData = new FormData()
                formData.append("classroomId", classroomId)
                formData.append("title", title)
                if (description) formData.append("description", description)
                formData.append("file", file)

                const res = await fetch("/api/resources/upload", {
                    method: "POST",
                    body: formData
                })

                if (!res.ok) {
                    const data = await res.json()
                    throw new Error(data.error || "Failed to upload file")
                }
            }

            handleOpenChange(false)
            router.refresh()
        } catch (err: any) {
            setError(err.message)
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add Resource</DialogTitle>
                    <DialogDescription>
                        Share a link or upload a file for your students.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="link">
                            <Link className="w-4 h-4 mr-2" />
                            Link
                        </TabsTrigger>
                        <TabsTrigger value="file">
                            <FileUp className="w-4 h-4 mr-2" />
                            File Upload
                        </TabsTrigger>
                    </TabsList>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
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

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Optional description..."
                                className="resize-none h-20"
                            />
                        </div>

                        <TabsContent value="link" className="mt-0 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="url">URL</Label>
                                <Input
                                    id="url"
                                    type="url"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="https://..."
                                    required={activeTab === "link"}
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="file" className="mt-0 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="file">File</Label>
                                <Input
                                    id="file"
                                    type="file"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    required={activeTab === "file"}
                                    className="cursor-pointer"
                                />
                                <p className="text-xs text-slate-500">
                                    Max size: 10MB. Supported: PDF, Word, Excel, PowerPoint, Images, Zip.
                                </p>
                            </div>
                        </TabsContent>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {activeTab === "link" ? "Add Link" : "Upload File"}
                            </Button>
                        </div>
                    </form>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
