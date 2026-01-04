"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileIcon, LinkIcon, TrashIcon, UploadIcon } from "lucide-react"

interface Resource {
    id: string
    title: string
    description: string | null
    url: string
    type: string
    createdAt: string
}

export default function ClassroomResourcesPage() {
    const params = useParams()
    const router = useRouter()
    const classroomId = params.id as string

    const [resources, setResources] = useState<Resource[]>([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState("")

    // File upload state
    const [file, setFile] = useState<File | null>(null)
    const [fileTitle, setFileTitle] = useState("")
    const [fileDescription, setFileDescription] = useState("")

    // Link state
    const [showLinkForm, setShowLinkForm] = useState(false)
    const [linkTitle, setLinkTitle] = useState("")
    const [linkUrl, setLinkUrl] = useState("")
    const [linkDescription, setLinkDescription] = useState("")

    useEffect(() => {
        fetchResources()
    }, [classroomId])

    const fetchResources = async () => {
        try {
            const res = await fetch(`/api/classrooms/${classroomId}/resources`)
            if (!res.ok) throw new Error("Failed to fetch resources")
            const data = await res.json()
            setResources(data)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleFileUpload = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!file || !fileTitle) return

        setUploading(true)
        setError("")

        try {
            const formData = new FormData()
            formData.append("file", file)
            formData.append("classroomId", classroomId)
            formData.append("title", fileTitle)
            if (fileDescription) formData.append("description", fileDescription)

            const res = await fetch("/api/resources/upload", {
                method: "POST",
                body: formData
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.error || "Failed to upload file")
            }

            // Reset form
            setFile(null)
            setFileTitle("")
            setFileDescription("")

            // Refresh resources
            await fetchResources()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setUploading(false)
        }
    }

    const handleLinkAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!linkTitle || !linkUrl) return

        setUploading(true)
        setError("")

        try {
            const res = await fetch(`/api/classrooms/${classroomId}/resources`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: linkTitle,
                    description: linkDescription || null,
                    url: linkUrl,
                    type: "LINK"
                })
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.error || "Failed to add link")
            }

            // Reset form
            setLinkTitle("")
            setLinkUrl("")
            setLinkDescription("")
            setShowLinkForm(false)

            // Refresh resources
            await fetchResources()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setUploading(false)
        }
    }

    const handleDelete = async (resourceId: string) => {
        if (!confirm("Are you sure you want to delete this resource?")) return

        try {
            const res = await fetch(`/api/classrooms/${classroomId}/resources?resourceId=${resourceId}`, {
                method: "DELETE"
            })

            if (!res.ok) throw new Error("Failed to delete resource")

            await fetchResources()
        } catch (err: any) {
            setError(err.message)
        }
    }

    if (loading) return <div>Loading...</div>

    return (
        <div className="max-w-4xl space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Resources</h1>
                    <p className="text-slate-500">Manage classroom files and links</p>
                </div>
                <Button variant="outline" onClick={() => router.back()}>
                    Back to Classroom
                </Button>
            </div>

            {/* File Upload */}
            <Card>
                <CardHeader>
                    <CardTitle>Upload File</CardTitle>
                    <CardDescription>Share documents, images, or other files (max 10MB)</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleFileUpload} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="file">File</Label>
                            <Input
                                id="file"
                                type="file"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                disabled={uploading}
                                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp,.zip"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="fileTitle">Title *</Label>
                            <Input
                                id="fileTitle"
                                value={fileTitle}
                                onChange={(e) => setFileTitle(e.target.value)}
                                placeholder="e.g., Lesson 1 - Grammar"
                                disabled={uploading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="fileDescription">Description</Label>
                            <Textarea
                                id="fileDescription"
                                value={fileDescription}
                                onChange={(e) => setFileDescription(e.target.value)}
                                placeholder="Optional description"
                                disabled={uploading}
                            />
                        </div>
                        <Button type="submit" disabled={!file || !fileTitle || uploading}>
                            <UploadIcon className="w-4 h-4 mr-2" />
                            {uploading ? "Uploading..." : "Upload File"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Add Link */}
            <Card>
                <CardHeader>
                    <CardTitle>Add External Link</CardTitle>
                    <CardDescription>Share links to external resources</CardDescription>
                </CardHeader>
                <CardContent>
                    {!showLinkForm ? (
                        <Button onClick={() => setShowLinkForm(true)}>
                            <LinkIcon className="w-4 h-4 mr-2" />
                            Add Link
                        </Button>
                    ) : (
                        <form onSubmit={handleLinkAdd} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="linkTitle">Title *</Label>
                                <Input
                                    id="linkTitle"
                                    value={linkTitle}
                                    onChange={(e) => setLinkTitle(e.target.value)}
                                    placeholder="e.g., Online Exercise"
                                    disabled={uploading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="linkUrl">URL *</Label>
                                <Input
                                    id="linkUrl"
                                    type="url"
                                    value={linkUrl}
                                    onChange={(e) => setLinkUrl(e.target.value)}
                                    placeholder="https://example.com"
                                    disabled={uploading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="linkDescription">Description</Label>
                                <Textarea
                                    id="linkDescription"
                                    value={linkDescription}
                                    onChange={(e) => setLinkDescription(e.target.value)}
                                    placeholder="Optional description"
                                    disabled={uploading}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" disabled={!linkTitle || !linkUrl || uploading}>
                                    {uploading ? "Adding..." : "Add Link"}
                                </Button>
                                <Button type="button" variant="outline" onClick={() => setShowLinkForm(false)}>
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>

            {/* Resources List */}
            <Card>
                <CardHeader>
                    <CardTitle>All Resources ({resources.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="p-3 mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                            {error}
                        </div>
                    )}

                    {resources.length === 0 ? (
                        <p className="text-slate-500 text-center py-8">No resources yet</p>
                    ) : (
                        <div className="space-y-2">
                            {resources.map((resource) => (
                                <div
                                    key={resource.id}
                                    className="flex items-center justify-between p-4 border rounded hover:bg-slate-50"
                                >
                                    <div className="flex items-center gap-3 flex-1">
                                        {resource.type === "FILE" ? (
                                            <FileIcon className="w-5 h-5 text-blue-600" />
                                        ) : (
                                            <LinkIcon className="w-5 h-5 text-green-600" />
                                        )}
                                        <div className="flex-1">
                                            <a
                                                href={resource.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-medium hover:underline"
                                            >
                                                {resource.title}
                                            </a>
                                            {resource.description && (
                                                <p className="text-sm text-slate-500">{resource.description}</p>
                                            )}
                                            <p className="text-xs text-slate-400">
                                                Added {new Date(resource.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(resource.id)}
                                    >
                                        <TrashIcon className="w-4 h-4 text-red-600" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
