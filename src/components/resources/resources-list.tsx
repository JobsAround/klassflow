"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ExternalLink, FileText, Link as LinkIcon, Pin, Download, MoreVertical, Pencil, Trash, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EditResourceDialog } from "./edit-resource-dialog"

interface Resource {
    id: string
    title: string
    url: string
    type: string
    description: string | null
    pinned: boolean
    createdAt: string | Date
}

interface ResourcesListProps {
    classroomId: string
    resources: Resource[]
    canPin?: boolean
}

export function ResourcesList({ classroomId, resources, canPin = false }: ResourcesListProps) {
    const router = useRouter()
    const [pinningId, setPinningId] = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [editingResource, setEditingResource] = useState<Resource | null>(null)
    const [isEditOpen, setIsEditOpen] = useState(false)

    // Sort resources: pinned first, then by creation date
    const sortedResources = [...resources].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1
        if (!a.pinned && b.pinned) return 1
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    const handleTogglePin = async (resourceId: string, currentPinned: boolean) => {
        setPinningId(resourceId)
        try {
            const response = await fetch(
                `/api/classrooms/${classroomId}/resources/${resourceId}/pin`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ pinned: !currentPinned })
                }
            )

            if (!response.ok) throw new Error("Failed to update pin status")

            router.refresh()
        } catch (error) {
            console.error("Error toggling pin:", error)
            alert("Failed to update pin status")
        } finally {
            setPinningId(null)
        }
    }

    const handleDelete = async (resourceId: string) => {
        if (!confirm("Are you sure you want to delete this resource?")) return

        setDeletingId(resourceId)
        try {
            const response = await fetch(
                `/api/classrooms/${classroomId}/resources/${resourceId}`,
                {
                    method: "DELETE"
                }
            )

            if (!response.ok) throw new Error("Failed to delete resource")

            router.refresh()
        } catch (error) {
            console.error("Error deleting resource:", error)
            alert("Failed to delete resource")
        } finally {
            setDeletingId(null)
        }
    }

    const handleEdit = (resource: Resource) => {
        setEditingResource(resource)
        setIsEditOpen(true)
    }

    const getResourceIcon = (type: string) => {
        switch (type) {
            case "LINK":
                return <LinkIcon className="w-4 h-4" />
            case "FILE":
            case "DOCUMENT":
                return <FileText className="w-4 h-4" />
            default:
                return <FileText className="w-4 h-4" />
        }
    }

    const getTypeLabel = (type: string) => {
        switch (type) {
            case "LINK":
                return "Link"
            case "FILE":
                return "File"
            case "DOCUMENT":
                return "Document"
            default:
                return type
        }
    }

    if (resources.length === 0) {
        return (
            <div className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500">No resources yet</p>
            </div>
        )
    }

    return (
        <div className="border rounded-lg divide-y bg-white">
            {sortedResources.map((resource) => (
                <div
                    key={resource.id}
                    className={cn(
                        "group relative flex items-center gap-3 p-2 hover:bg-slate-50 transition-colors",
                        resource.pinned && "bg-blue-50/30 hover:bg-blue-50/60"
                    )}
                >
                    {/* Full Link Overlay */}
                    <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 z-0"
                    >
                        <span className="sr-only">Open {resource.title}</span>
                    </a>

                    {/* Icon */}
                    <div
                        className={cn(
                            "p-1.5 rounded-md flex-shrink-0 z-10",
                            resource.pinned
                                ? "bg-blue-100 text-blue-600"
                                : "bg-slate-100 text-slate-600"
                        )}
                    >
                        {getResourceIcon(resource.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 z-10 pointer-events-none">
                        <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm text-slate-900 leading-none truncate">
                                {resource.title}
                            </h4>
                            {resource.pinned && (
                                <Pin className="w-3 h-3 text-blue-600 fill-blue-600 flex-shrink-0" />
                            )}
                        </div>
                        {resource.description && (
                            <p className="text-[11px] text-slate-500 leading-tight line-clamp-1 mt-0.5">
                                {resource.description}
                            </p>
                        )}
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 leading-none mt-1">
                            <span className="font-medium uppercase tracking-wider">
                                {getTypeLabel(resource.type)}
                            </span>
                            <span>•</span>
                            <span>
                                {format(new Date(resource.createdAt), "MK", { locale: undefined })}
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 z-20">
                        {canPin && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        handleTogglePin(resource.id, resource.pinned)
                                    }}
                                    disabled={pinningId === resource.id}
                                    className={cn(
                                        "h-7 w-7 p-0 text-slate-400 hover:text-slate-600",
                                        resource.pinned && "text-blue-600 hover:text-blue-700"
                                    )}
                                    title={resource.pinned ? "Unpin" : "Pin to top"}
                                >
                                    <Pin
                                        className={cn(
                                            "w-3.5 h-3.5",
                                            resource.pinned && "fill-current"
                                        )}
                                    />
                                </Button>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0 text-slate-400 hover:text-slate-600"
                                        >
                                            {deletingId === resource.id ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <MoreVertical className="w-3.5 h-3.5" />
                                            )}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleEdit(resource)}>
                                            <Pencil className="w-4 h-4 mr-2" />
                                            Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => handleDelete(resource.id)}
                                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                        >
                                            <Trash className="w-4 h-4 mr-2" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </>
                        )}

                        <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()} // Prevent double click if parent is clicked
                        >
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-700">
                                <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                        </a>
                    </div>
                </div>
            ))}

            <EditResourceDialog
                resource={editingResource}
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
                classroomId={classroomId}
            />
        </div>
    )
}
