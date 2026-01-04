"use client"

import { useTranslations } from 'next-intl'
import { AttendanceExporter } from "@/components/classrooms/attendance-exporter"

interface ExportSectionProps {
    classroomId: string
}

export function ExportSection({ classroomId }: ExportSectionProps) {
    const t = useTranslations('calendar')

    return (
        <div className="flex items-center gap-2 p-3 border rounded-lg bg-white dark:bg-slate-950">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 mr-2">
                {t('exportAttendance')}:
            </span>
            <AttendanceExporter classroomId={classroomId} />
        </div>
    )
}
