"use client"

import { useState } from "react"
import { useTranslations } from 'next-intl'
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
import { Switch } from "@/components/ui/switch"
import { Share2, Copy, Check } from "lucide-react"

interface ShareClassroomDialogProps {
    classroomId: string
    isPublic?: boolean
}

export function ShareClassroomDialog({ classroomId }: ShareClassroomDialogProps) {
    const t = useTranslations('classroom')
    const tCommon = useTranslations('common')
    const [open, setOpen] = useState(false)
    const [copied, setCopied] = useState(false)

    const shareUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/public/classroom/${classroomId}`
        : ''

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Share2 className="w-4 h-4 mr-2" />
                    {t('publicShare')}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Share Classroom</DialogTitle>
                    <DialogDescription>
                        Share this classroom with students via a public link
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Share Link</Label>
                        <div className="flex gap-2">
                            <Input
                                value={shareUrl}
                                readOnly
                                className="flex-1 bg-slate-50"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={copyToClipboard}
                            >
                                {copied ? (
                                    <>
                                        <Check className="w-4 h-4 mr-2" />
                                        Copied
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4 mr-2" />
                                        Copy
                                    </>
                                )}
                            </Button>
                        </div>
                        <p className="text-sm text-slate-500">
                            Anyone with this link can view the classroom and join sessions.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        {tCommon('close')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
