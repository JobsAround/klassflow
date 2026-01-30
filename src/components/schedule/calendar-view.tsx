"use client"

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from "../ui/button"
import { CreateSessionDialog } from "../sessions/create-session-dialog"
import { ScheduleCalendar } from "./schedule-calendar"

interface Teacher {
    id: string
    name: string | null
    email: string
}

interface Classroom {
    id: string
    name: string
    teachers?: Teacher[]
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
    isTeacher?: boolean
}

export function CalendarView({ classrooms, sessions, isTeacher = false }: CalendarViewProps) {
    const t = useTranslations('calendar')
    const tSession = useTranslations('session')
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [createDialogOpen, setCreateDialogOpen] = useState(false)

    // Extract all unique teachers from all classrooms for the calendar display
    const allTeachers = useMemo(() => {
        const teacherMap = new Map<string, Teacher>()
        classrooms.forEach(classroom => {
            classroom.teachers?.forEach(teacher => {
                teacherMap.set(teacher.id, teacher)
            })
        })
        return Array.from(teacherMap.values())
    }, [classrooms])

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
                initialDate={selectedDate || undefined}
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                trigger={null}
            />

            <ScheduleCalendar
                sessions={sessions}
                onDayClick={handleDayClick}
                isTeacher={isTeacher}
                teachers={allTeachers}
            />
        </div>
    )
}
