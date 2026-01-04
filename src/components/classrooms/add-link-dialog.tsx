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
import { LinkIcon, Loader2 } from "lucide-react"

import { useTranslations } from 'next-intl'

interface AddLinkDialogProps {
    classroomId: string
}

export function AddLinkDialog({ classroomId }: AddLinkDialogProps) {
    const t = useTranslations('classroom')
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [title, setTitle] = useState("")
    const [url, setUrl] = useState("")
    const [description, setDescription] = useState("")
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title || !url) return

        setLoading(true)
        try {
            const res = await fetch(`/api/classrooms/${classroomId}/resources`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    url,
                    description: description || null,
                    type: "LINK"
                })
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.error || "Failed to add link")
            }

            setOpen(false)
            setTitle("")
            setUrl("")
            setDescription("")
            router.refresh()
        } catch (error) {
            console.error(error)
            alert("Failed to add link")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">{t('addLink')}</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('addLink')}</DialogTitle>
                    <DialogDescription>
                        {t('linkDescription')}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="linkTitle">{t('resourceTitle')} *</Label>
                        <Input
                            id="linkTitle"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="ex: Exercice en ligne"
                            disabled={loading}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="linkUrl">{t('linkUrl')} *</Label>
                        <Input
                            id="linkUrl"
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://example.com"
                            disabled={loading}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="linkDescription">{t('description')}</Label>
                        <Textarea
                            id="linkDescription"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={t('optional')}
                            disabled={loading}
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={!title || !url || loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {loading ? t('adding') : t('add')}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
