"use client"

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from "../ui/button"
import { CreateSessionDialog } from "../sessions/create-session-dialog"
import { ScheduleCalendar } from "./schedule-calendar"

interface Classroom {
    id: string
    name: string
}

interface Teacher {
    id: string
    name: string | null
    email: string
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

interface CalendarViewProps {
    classrooms: Classroom[]
    sessions: Session[]
    teachers?: Teacher[]
    isTeacher?: boolean
}

export function CalendarView({ classrooms, sessions, teachers = [], isTeacher = false }: CalendarViewProps) {
    const t = useTranslations('calendar')
    const tSession = useTranslations('session')
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [createDialogOpen, setCreateDialogOpen] = useState(false)

    const handleDayClick = (date: Date) => {
        setSelectedDate(date)
        setCreateDialogOpen(true)
    }

    const handleButtonClick = () => {
        setSelectedDate(null)
        setCreateDialogOpen(true)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
                    <p className="text-slate-500">{t('description')}</p>
                </div>
            </div>

            {/* Single button that opens the dialog */}
            <Button onClick={handleButtonClick}>{tSession('addSession')}</Button>

            {/* Single controlled dialog - opens from button or calendar click */}
            <CreateSessionDialog
                classrooms={classrooms}
                teachers={teachers}
                initialDate={selectedDate || undefined}
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                trigger={null}
            />

            <ScheduleCalendar
                sessions={sessions}
                onDayClick={handleDayClick}
                isTeacher={isTeacher}
                teachers={teachers}
            />
        </div>
    )
}
