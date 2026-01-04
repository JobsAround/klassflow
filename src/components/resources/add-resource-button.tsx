"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { CreateResourceDialog } from "./create-resource-dialog"

interface AddResourceButtonProps {
    classroomId: string
}

export function AddResourceButton({ classroomId }: AddResourceButtonProps) {
    const [open, setOpen] = useState(false)

    return (
        <>
            <Button size="sm" onClick={() => setOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Resource
            </Button>
            <CreateResourceDialog
                open={open}
                onOpenChange={setOpen}
                classroomId={classroomId}
            />
        </>
    )
}
