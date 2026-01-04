import { AttendanceExporter } from "@/components/classrooms/attendance-exporter"
import { ClassroomSettings } from "@/components/classrooms/classroom-settings"
import { SendAttendanceButton } from "@/components/sessions/send-attendance-button"
import { SessionManager } from "@/components/classrooms/session-manager"
import { QrCode } from "lucide-react"
import { EditClassroomDialog } from "@/components/classrooms/edit-classroom-dialog"
import { EnrollStudentDialog } from "@/components/classrooms/enroll-student-dialog"
import { RemoveStudentDialog } from "@/components/classrooms/remove-student-dialog"
import { AssignTeacherDialog } from "@/components/classrooms/assign-teacher-dialog"
import { RemoveTeacherDialog } from "@/components/classrooms/remove-teacher-dialog"
import { ShareClassroomDialog } from "@/components/classrooms/share-classroom-dialog"
import { ResourcesList } from "@/components/resources/resources-list"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users as UsersIcon, Calendar as CalendarIcon, File as FileIcon, Video } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { cookies } from "next/headers"
import { getTranslations } from 'next-intl/server'
import { generateJaaSJwt } from "@/lib/jaas"

const JAAS_APP_ID = process.env.JAAS_APP_ID || "vpaas-magic-cookie-59695fbdd7744384bf399a05acaf12d9"

async function getUser() {
    let session = await auth()
    let user = session?.user

    if (!user && process.env.NODE_ENV === "development") {
        const cookieStore = await cookies()
        const devUserId = cookieStore.get("dev-user-id")?.value
        if (devUserId) {
            const devUser = await prisma.user.findUnique({
                where: { id: devUserId }
            })
            if (devUser) {
                user = {
                    id: devUser.id,
                    name: devUser.name,
                    email: devUser.email,
                    image: devUser.image,
                    role: devUser.role,
                    organizationId: devUser.organizationId
                } as any
            }
        }
    }

    return user
}

export default async function ClassroomDetailPage({ params }: { params: any }) {
    const t = await getTranslations('classroom')
    const user = await getUser()
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
                take: 5,
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
                            email: true
                        }
                    }
                }
            }
        }
    })

    if (!classroom) {
        return <div>Classroom not found</div>
    }

    // Generate JWT for moderator access
    const roomName = `classroom-${classroom.id}`
    const jwt = generateJaaSJwt({
        id: user.id!,
        name: user.name || "Teacher",
        email: user.email || "",
        avatar: user.image || "",
        isModerator: true
    }, roomName)
    const jitsiUrl = `https://8x8.vc/${JAAS_APP_ID}/${roomName}?jwt=${jwt}`

    return (
        <div className="max-w-6xl space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{classroom.name}</h1>
                    {classroom.description && (
                        <p className="text-slate-500 mt-1">{classroom.description}</p>
                    )}
                </div>
                <div className="flex gap-2">
                    <a
                        href={jitsiUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                            <Video className="w-4 h-4 mr-2" />
                            {t('joinAsTeacher')}
                        </Button>
                    </a>
                    <AttendanceExporter classroomId={classroom.id} />
                    <ShareClassroomDialog
                        classroomId={classroom.id}
                        isPublic={classroom.shareEnabled}
                    />
                    <EditClassroomDialog classroom={classroom} />
                    <Link href="/dashboard/classrooms">
                        <Button variant="outline">Back to Classrooms</Button>
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Students</CardTitle>
                        <UsersIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{classroom.enrollments.length}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Sessions</CardTitle>
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{classroom.sessions.length}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Resources</CardTitle>
                        <FileIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{classroom.resources.length}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Settings (Disabled) */}
            {/* <ClassroomSettings
                classroomId={classroom.id}
                initialSignatureEnabled={classroom.signatureEnabled}
            /> */}


            {/* Session Manager */}
            <SessionManager
                sessions={classroom.sessions}
                isTeacher={user.role === "TEACHER" || user.role === "ADMIN"}
                currentUserId={user.id}
                classroom={{ id: classroom.id, name: classroom.name }}
                enrollments={classroom.enrollments.map(e => e.student)}
            />

            {/* Teachers */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Teachers</CardTitle>
                        <CardDescription>Instructors for this classroom</CardDescription>
                    </div>
                    <AssignTeacherDialog
                        classroomId={classroom.id}
                        assignedTeacherIds={classroom.teachers.map(t => t.id)}
                    />
                </CardHeader>
                <CardContent>
                    {classroom.teachers.length === 0 ? (
                        <p className="text-slate-500 text-sm">No teachers assigned. Click "Assign Teachers" to add instructors.</p>
                    ) : (
                        <div className="space-y-2">
                            {classroom.teachers.map((teacher) => (
                                <div key={teacher.id} className="flex items-center justify-between p-2 border rounded">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary">{teacher.name}</Badge>
                                        <span className="text-sm text-slate-500">{teacher.email}</span>
                                    </div>
                                    <RemoveTeacherDialog
                                        classroomId={classroom.id}
                                        teacher={teacher}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Enrolled Students */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Enrolled Students ({classroom.enrollments.length})</CardTitle>
                        <CardDescription>Students in this classroom</CardDescription>
                    </div>
                    <EnrollStudentDialog
                        classroomId={classroom.id}
                        enrolledStudentIds={classroom.enrollments.map(e => e.student.id)}
                    />
                </CardHeader>
                <CardContent>
                    {classroom.enrollments.length === 0 ? (
                        <p className="text-slate-500 text-sm">No students enrolled. Click "Enroll Students" to add students.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {classroom.enrollments.map((enrollment) => (
                                <div key={enrollment.id} className="flex items-center justify-between p-2 border rounded">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                            <span className="text-sm font-medium text-blue-600">
                                                {enrollment.student.name?.charAt(0) || "?"}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{enrollment.student.name}</p>
                                            <p className="text-xs text-slate-500">{enrollment.student.email}</p>
                                        </div>
                                    </div>
                                    <RemoveStudentDialog
                                        classroomId={classroom.id}
                                        student={enrollment.student}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Resources */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Resources</CardTitle>
                        <CardDescription>Shared files and links</CardDescription>
                    </div>
                    <Link href={`/dashboard/classrooms/${classroom.id}/resources`}>
                        <Button variant="outline" size="sm">Manage Resources</Button>
                    </Link>
                </CardHeader>
                <CardContent>
                    <ResourcesList
                        classroomId={classroom.id}
                        resources={classroom.resources}
                        canPin={true}
                    />
                </CardContent>
            </Card>

        </div>
    )
}
