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
import { useTranslations } from "next-intl"

interface CreateResourceDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    classroomId: string
}

export function CreateResourceDialog({ open, onOpenChange, classroomId }: CreateResourceDialogProps) {
    const router = useRouter()
    const t = useTranslations('classroom')
    const tCommon = useTranslations('common')

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
                    // Try to parse JSON, but handle cases where response is empty or not JSON
                    let errorMessage = "Failed to upload file"
                    try {
                        const contentType = res.headers.get("content-type")
                        if (contentType && contentType.includes("application/json")) {
                            const data = await res.json()
                            errorMessage = data.error || errorMessage
                        } else {
                            // Response is not JSON, get text instead
                            const text = await res.text()
                            errorMessage = text || errorMessage
                        }
                    } catch (parseError) {
                        // If parsing fails, use default error message
                        console.error("Error parsing response:", parseError)
                    }
                    throw new Error(errorMessage)
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
                    <DialogTitle>{t('addResource')}</DialogTitle>
                    <DialogDescription>
                        {t('addResourceDialogDescription')}
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="link">
                            <Link className="w-4 h-4 mr-2" />
                            {t('link')}
                        </TabsTrigger>
                        <TabsTrigger value="file">
                            <FileUp className="w-4 h-4 mr-2" />
                            {t('fileUpload')}
                        </TabsTrigger>
                    </TabsList>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="title">{tCommon('name')}</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder={t('resourceTitlePlaceholder')}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">{tCommon('description')}</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder={t('descriptionOptional')}
                                className="resize-none h-20"
                            />
                        </div>

                        <TabsContent value="link" className="mt-0 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="url">{t('urlLabel')}</Label>
                                <Input
                                    id="url"
                                    type="url"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder={t('urlPlaceholder')}
                                    required={activeTab === "link"}
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="file" className="mt-0 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="file">{tCommon('name')}</Label>
                                <Input
                                    id="file"
                                    type="file"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    required={activeTab === "file"}
                                    className="cursor-pointer"
                                />
                                <p className="text-xs text-slate-500">
                                    {t('fileSizeLimit')}
                                </p>
                            </div>
                        </TabsContent>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                                {tCommon('cancel')}
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {activeTab === "link" ? t('addLink') : t('uploadFile')}
                            </Button>
                        </div>
                    </form>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
