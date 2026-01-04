"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { UploadIcon, Loader2 } from "lucide-react"

import { useTranslations } from 'next-intl'

interface AddDocumentDialogProps {
    classroomId: string
}

export function AddDocumentDialog({ classroomId }: AddDocumentDialogProps) {
    const t = useTranslations('classroom')
    const [open, setOpen] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!file || !title) return

        setUploading(true)
        try {
            const formData = new FormData()
            formData.append("file", file)
            formData.append("classroomId", classroomId)
            formData.append("title", title)
            if (description) formData.append("description", description)

            const res = await fetch("/api/resources/upload", {
                method: "POST",
                body: formData
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.error || "Failed to upload file")
            }

            setOpen(false)
            setFile(null)
            setTitle("")
            setDescription("")
            router.refresh()
        } catch (error) {
            console.error(error)
            alert("Failed to upload file")
        } finally {
            setUploading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">{t('addDocument')}</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('addDocument')}</DialogTitle>
                    <DialogDescription>
                        {t('docDescription')}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="file">{t('file')} *</Label>
                        <Input
                            id="file"
                            type="file"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            disabled={uploading}
                            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp,.zip"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="title">{t('resourceTitle')} *</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={t('titlePlaceholder')}
                            disabled={uploading}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">{t('description')}</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={t('optional')}
                            disabled={uploading}
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={!file || !title || uploading}>
                        {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {uploading ? t('uploading') : t('upload')}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
