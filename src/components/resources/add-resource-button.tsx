"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { CreateResourceDialog } from "./create-resource-dialog"
import { useTranslations } from "next-intl"

interface AddResourceButtonProps {
    classroomId: string
}

export function AddResourceButton({ classroomId }: AddResourceButtonProps) {
    const [open, setOpen] = useState(false)
    const t = useTranslations('classroom')

    return (
        <>
            <Button size="sm" onClick={() => setOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                {t('addResource')}
            </Button>
            <CreateResourceDialog
                open={open}
                onOpenChange={setOpen}
                classroomId={classroomId}
            />
        </>
    )
}
