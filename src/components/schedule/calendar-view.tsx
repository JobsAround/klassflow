"use client"

import { useTranslations } from 'next-intl'
import { CreateSessionDialog } from "../sessions/create-session-dialog"
import { ScheduleCalendar } from "./schedule-calendar"

interface Classroom {
    id: string
    name: string
}

interface Session {
    id: string
    title: string | null
    startTime: string
    endTime: string
    type: string
    meetingLink: string | null
    classroom: {
        name: string
    }
    createdAt: string
    updatedAt: string
    teacherId?: string | null
}

export function CalendarView({ classrooms, sessions, teachers = [] }: { classrooms: Classroom[], sessions: Session[], teachers?: any[] }) {
    const t = useTranslations('calendar')

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
                    <p className="text-slate-500">{t('description')}</p>
                </div>
            </div>
            <CreateSessionDialog classrooms={classrooms} teachers={teachers} />

            <ScheduleCalendar sessions={sessions} />
        </div>
    )
}
