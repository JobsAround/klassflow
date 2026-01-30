"use client"

import { MapPin, Video } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SessionManager } from "@/components/classrooms/session-manager"
import { TeachersCard } from "@/components/classrooms/teachers-card"
import { StudentsCard } from "@/components/classrooms/students-card"
import { ShareClassroomDialog } from "@/components/classrooms/share-classroom-dialog"
import { EditClassroomDialog } from "@/components/classrooms/edit-classroom-dialog"
import { ExportSection } from "@/components/classrooms/export-section"
import { ResourcesList } from "@/components/resources/resources-list"
import { AddResourceButton } from "@/components/resources/add-resource-button"

export interface ClassroomDetailData {
    id: string
    name: string
    description: string | null
    locationOnSite: string | null
    locationOnline: string | null
    locationOnline2?: string | null
    shareEnabled: boolean
    teachers: Array<{ id: string; name: string | null; email: string }>
    sessions: Array<{
        id: string
        title: string | null
        startTime: Date | string
        endTime: Date | string
        type: string
        teacherId?: string | null
        teacher?: { id: string; name: string | null; email: string } | null
        attendances: Array<{
            id: string
            status: string
            studentId: string
            student: { id: string; name: string | null; email: string }
            signatureUrl?: string | null
        }>
    }>
    resources: Array<{
        id: string
        title: string
        url: string
        type: string
        description?: string | null
        pinned: boolean
        createdAt: Date | string
    }>
    enrollments: Array<{
        id: string
        student: { id: string; name: string | null; email: string; role?: string }
    }>
}

export interface ClassroomDetailViewProps {
    classroom: ClassroomDetailData
    currentUser: {
        id: string
        name?: string | null
        role?: string
    }
    isAdmin?: boolean
    videoUrl?: string | null
    videoUrl2?: string | null
    translations?: {
        joinAsTeacher?: string
        resources?: string
        sharedFiles?: string
    }
}

export function ClassroomDetailView({
    classroom,
    currentUser,
    isAdmin = false,
    videoUrl,
    videoUrl2,
    translations = {}
}: ClassroomDetailViewProps) {
    const t = {
        joinAsTeacher: translations.joinAsTeacher || "Join as Teacher",
        resources: translations.resources || "Resources",
        sharedFiles: translations.sharedFiles || "Documents and links shared with the classroom"
    }

    const canManage = isAdmin || currentUser.role === "TEACHER" || currentUser.role === "ADMIN"

    return (
        <div className="max-w-6xl space-y-6">
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold tracking-tight">{classroom.name}</h1>
                        {classroom.description && (
                            <p className="text-slate-500 mt-2">{classroom.description}</p>
                        )}
                        {classroom.locationOnSite && (
                            <div className="flex items-center gap-2 mt-2 text-slate-500">
                                <MapPin className="w-4 h-4" />
                                <span>{classroom.locationOnSite}</span>
                            </div>
                        )}
                        {classroom.locationOnline && (
                            <div className="flex items-center gap-2 mt-2 text-slate-500">
                                <Video className="w-4 h-4" />
                                <a href={classroom.locationOnline} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                    {classroom.locationOnline}
                                </a>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col items-end gap-2 ml-4">
                        {videoUrl && (
                            <div className="flex items-center gap-2">
                                <a href={videoUrl} target="_blank" rel="noopener noreferrer">
                                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                                        <Video className="w-4 h-4 mr-2" />
                                        {t.joinAsTeacher} {videoUrl2 ? "(1)" : ""}
                                    </Button>
                                </a>
                                {videoUrl2 && (
                                    <a href={videoUrl2} target="_blank" rel="noopener noreferrer">
                                        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                                            <Video className="w-4 h-4 mr-2" />
                                            {t.joinAsTeacher} (2)
                                        </Button>
                                    </a>
                                )}
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <ShareClassroomDialog
                                classroomId={classroom.id}
                                isPublic={classroom.shareEnabled}
                            />
                            {canManage && <EditClassroomDialog classroom={classroom as any} />}
                        </div>
                    </div>
                </div>

                {/* Export Section */}
                <ExportSection classroomId={classroom.id} />
            </div>

            {/* Session Manager */}
            <SessionManager
                sessions={classroom.sessions as any}
                isTeacher={canManage}
                currentUserId={currentUser.id}
                classroom={{ id: classroom.id, name: classroom.name, teachers: classroom.teachers }}
                enrollments={classroom.enrollments}
                currentUserName={currentUser.name}
            />

            {/* Teachers */}
            <TeachersCard
                teachers={classroom.teachers}
                classroomId={classroom.id}
            />

            {/* Enrolled Students */}
            <StudentsCard
                classroomId={classroom.id}
                enrollments={classroom.enrollments}
            />

            {/* Resources */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div className="space-y-1">
                        <CardTitle>{t.resources}</CardTitle>
                        <CardDescription>{t.sharedFiles}</CardDescription>
                    </div>
                    {canManage && (
                        <AddResourceButton classroomId={classroom.id} />
                    )}
                </CardHeader>
                <CardContent>
                    <ResourcesList
                        classroomId={classroom.id}
                        resources={classroom.resources as any}
                        canPin={canManage}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
