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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react"
import { useTranslations } from 'next-intl'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export function CreateClassroomDialog() {
    const t = useTranslations('classroom')
    const tCommon = useTranslations('common')
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        locationOnSite: "",
        locationOnline: ""
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const res = await fetch("/api/classrooms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            })

            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(data.error || "Failed to create classroom")
            }

            setOpen(false)
            setFormData({ name: "", description: "", locationOnSite: "", locationOnline: "" })
            router.refresh()
        } catch (error) {
            console.error("Error creating classroom:", error)
            alert(error instanceof Error ? error.message : "Failed to create classroom")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    {t('new')}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{t('new')}</DialogTitle>
                        <DialogDescription>
                            Create a new classroom for your students
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">{tCommon('name')} *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">{tCommon('description')}</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="locationOnSite">On-site Location (Optional)</Label>
                                <Input
                                    id="locationOnSite"
                                    value={formData.locationOnSite}
                                    onChange={(e) => setFormData({ ...formData, locationOnSite: e.target.value })}
                                    placeholder="e.g. Europipe company"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="locationOnline">Online Location (Optional)</Label>
                                <Input
                                    id="locationOnline"
                                    value={formData.locationOnline}
                                    onChange={(e) => setFormData({ ...formData, locationOnline: e.target.value })}
                                    placeholder="e.g. Google Meet link"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            {tCommon('cancel')}
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? tCommon('creating') : tCommon('create')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
