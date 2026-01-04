"use client"

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileIcon } from "lucide-react"
import { AddDocumentDialog } from "@/components/classrooms/add-document-dialog"
import { AddLinkDialog } from "@/components/classrooms/add-link-dialog"

interface Resource {
    id: string
    name: string
    url: string
}

interface ResourcesCardProps {
    classroomId: string
    resources: Resource[]
}

export function ResourcesCard({ classroomId, resources }: ResourcesCardProps) {
    const t = useTranslations('classroom')

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>{t('resources')}</CardTitle>
                    <CardDescription>{t('resourcesDescription')}</CardDescription>
                </div>
                <div className="flex gap-2">
                    <AddDocumentDialog classroomId={classroomId} />
                    <AddLinkDialog classroomId={classroomId} />
                </div>
            </CardHeader>
            <CardContent>
                {resources.length === 0 ? (
                    <p className="text-slate-500 text-sm">{t('noResources')}</p>
                ) : (
                    <div className="space-y-2">
                        {resources.map((resource) => (
                            <div key={resource.id} className="flex items-center gap-2 p-2 border rounded">
                                <FileIcon className="w-4 h-4 text-blue-600" />
                                <a
                                    href={resource.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline"
                                >
                                    {resource.name}
                                </a>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
