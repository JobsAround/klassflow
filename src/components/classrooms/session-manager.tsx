"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from 'next-intl'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SessionListItem } from "@/components/sessions/session-list-item"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CreateSessionDialog } from "@/components/sessions/create-session-dialog"

interface SessionManagerProps {
    sessions: any[]
    isTeacher: boolean
    currentUserId: string
    currentUserName?: string | null
    classroom: { id: string; name: string }
    enrollments?: any[]
    teachers?: any[]
    organizationId?: string
}

export function SessionManager({ sessions, isTeacher, currentUserId, currentUserName, classroom, enrollments = [], teachers = [], organizationId }: SessionManagerProps) {
    const tSession = useTranslations('session')
    const tClassroom = useTranslations('classroom')
    const now = new Date()
    const upcomingSessions = sessions
        .filter(s => new Date(s.endTime) >= now)
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())

    const pastSessions = sessions
        .filter(s => new Date(s.endTime) < now)
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())

    // Poll for updates every 5 seconds, but ONLY if no interactive elements (popovers/dialogs) are open
    const router = useRouter()
    useEffect(() => {
        const interval = setInterval(() => {
            // Check if any Radix UI popovers or dialogs are open
            const isInteracting = document.querySelector('[data-state="open"]')

            if (!isInteracting) {
                router.refresh()
            }
        }, 5000)

        return () => clearInterval(interval)
    }, [router])


    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>{tClassroom('sessions')}</CardTitle>
                    <CardDescription>{tSession('manageSessions')}</CardDescription>
                </div>
                {isTeacher && (
                    <CreateSessionDialog classrooms={[classroom]} teachers={teachers} organizationId={organizationId} />
                )}
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="past" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="past">{tClassroom('past')} ({pastSessions.length})</TabsTrigger>
                        <TabsTrigger value="upcoming">{tClassroom('upcoming')} ({upcomingSessions.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="past" className="space-y-4">
                        {pastSessions.length === 0 ? (
                            <p className="text-center text-slate-500 py-8">{tSession('noPast')}</p>
                        ) : (
                            pastSessions.map(session => (
                                <SessionListItem
                                    key={session.id}
                                    session={session}
                                    isTeacher={isTeacher}
                                    currentUserId={currentUserId}
                                    currentUserName={currentUserName}
                                    enrollments={enrollments}
                                    teachers={teachers}
                                    classroomName={classroom.name}
                                />
                            ))
                        )}
                    </TabsContent>

                    <TabsContent value="upcoming" className="space-y-4">
                        {upcomingSessions.length === 0 ? (
                            <p className="text-center text-slate-500 py-8">{tSession('noUpcoming')}</p>
                        ) : (
                            upcomingSessions.map(session => (
                                <SessionListItem
                                    key={session.id}
                                    session={session}
                                    isTeacher={isTeacher}
                                    currentUserId={currentUserId}
                                    currentUserName={currentUserName}
                                    enrollments={enrollments}
                                    teachers={teachers}
                                    classroomName={classroom.name}
                                />
                            ))
                        )}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}
