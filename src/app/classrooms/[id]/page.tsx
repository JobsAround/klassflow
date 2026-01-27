import { AttendanceExporter } from "@/components/classrooms/attendance-exporter"
import { ClassroomSettings } from "@/components/classrooms/classroom-settings"
import { SendAttendanceButton } from "@/components/sessions/send-attendance-button"
import { SessionManager } from "@/components/classrooms/session-manager"
import { StudentsCard } from "@/components/classrooms/students-card"
import { TeachersCard } from "@/components/classrooms/teachers-card"
import { ClassroomStats } from "@/components/classrooms/classroom-stats"
import { ExportSection } from "@/components/classrooms/export-section"
import { ResourcesList } from "@/components/resources/resources-list"
import { QrCode } from "lucide-react"
import { EditClassroomDialog } from "@/components/classrooms/edit-classroom-dialog"
import { EnrollStudentDialog } from "@/components/classrooms/enroll-student-dialog"
import { RemoveStudentDialog } from "@/components/classrooms/remove-student-dialog"
import { AssignTeacherDialog } from "@/components/classrooms/assign-teacher-dialog"
import { RemoveTeacherDialog } from "@/components/classrooms/remove-teacher-dialog"
import { ShareClassroomDialog } from "@/components/classrooms/share-classroom-dialog"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users as UsersIcon, Calendar as CalendarIcon, File as FileIcon, MapPin, Video } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { getTranslations } from 'next-intl/server'
import { generateJaaSJwt } from "@/lib/jaas"
import { AddResourceButton } from "@/components/resources/add-resource-button"
import { getAuthUser } from "@/lib/auth-utils"

const JAAS_APP_ID = process.env.JAAS_APP_ID || "vpaas-magic-cookie-59695fbdd7744384bf399a05acaf12d9"

export default async function ClassroomPage({ params }: { params: Promise<{ id: string }> }) {
    const t = await getTranslations('classroom')
    const user = await getAuthUser()
    const { id } = await params

    if (!user) {
        return <div>Please sign in to view this classroom.</div>
    }

    const classroom = await prisma.classroom.findFirst({
        where: {
            id,
            organizationId: user.organizationId!
        },
        include: {
            teachers: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            },
            sessions: {
                orderBy: { startTime: 'desc' },
                include: {
                    attendances: {
                        include: {
                            student: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true
                                }
                            }
                        }
                    }
                }
            },
            resources: {
                orderBy: [
                    { pinned: 'desc' },
                    { createdAt: 'desc' }
                ]
            },
            enrollments: {
                include: {
                    student: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true
                        }
                    }
                }
            }
        }
    })

    if (!classroom) {
        return <div>Classroom not found</div>
    }

    // Generate JWT for moderator access (Room 1)
    const roomName = `classroom-${classroom.id}`
    const jwt = generateJaaSJwt({
        id: user.id!,
        name: user.name || "Teacher",
        email: user.email || "",
        avatar: user.image || "",
        isModerator: true
    }, roomName)
    const jitsiUrl = `https://8x8.vc/${JAAS_APP_ID}/${roomName}?jwt=${jwt}`

    // Generate JWT for moderator access (Room 2) if enabled
    let jitsiUrl2 = null
    if (classroom.locationOnline2 === "ENABLED") {
        const roomName2 = `classroom-${classroom.id}-2`
        const jwt2 = generateJaaSJwt({
            id: user.id!,
            name: user.name || "Teacher",
            email: user.email || "",
            avatar: user.image || "",
            isModerator: true
        }, roomName2)
        jitsiUrl2 = `https://8x8.vc/${JAAS_APP_ID}/${roomName2}?jwt=${jwt2}`
    }

    return (
        <div className="max-w-6xl space-y-6">
            <div className="space-y-4">
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
                        {classroom.videoEnabled && (
                            <div className="flex items-center gap-2">
                                <a
                                    href={jitsiUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                                        <Video className="w-4 h-4 mr-2" />
                                        {t('joinAsTeacher')} {jitsiUrl2 ? "(1)" : ""}
                                    </Button>
                                </a>
                                {jitsiUrl2 && (
                                    <a
                                        href={jitsiUrl2}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                                            <Video className="w-4 h-4 mr-2" />
                                            {t('joinAsTeacher')} (2)
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
                            <EditClassroomDialog classroom={classroom} />
                        </div>
                    </div>
                </div>

                <ExportSection classroomId={classroom.id} />
            </div>


            {/* Settings */}
            <ClassroomSettings
                classroomId={classroom.id}
                initialSignatureEnabled={classroom.signatureEnabled}
                initialAutoSignatureEmailEnabled={classroom.autoSignatureEmailEnabled}
            />

            {/* Session Manager */}
            <SessionManager
                sessions={classroom.sessions}
                isTeacher={user.role === "TEACHER" || user.role === "ADMIN"}
                currentUserId={user.id}
                classroom={{ id: classroom.id, name: classroom.name }}
                enrollments={classroom.enrollments}
                teachers={classroom.teachers}
                currentUserName={user.name}
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
            {/* Resources */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div className="space-y-1">
                        <CardTitle>{t('resources')}</CardTitle>
                        <CardDescription>Documents and links shared with the classroom</CardDescription>
                    </div>
                    {(user.role === "TEACHER" || user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
                        <AddResourceButton classroomId={classroom.id} />
                    )}
                </CardHeader>
                <CardContent>
                    <ResourcesList
                        classroomId={classroom.id}
                        resources={classroom.resources}
                        canPin={user.role === "TEACHER" || user.role === "ADMIN" || user.role === "SUPER_ADMIN"}
                    />
                </CardContent>
            </Card>

        </div>
    )
}
