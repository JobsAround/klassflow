"use client"

import { useState } from "react"
import { useTranslations } from 'next-intl'
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon } from "lucide-react"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { fr, enUS, uk, ru, de, es, pt } from 'date-fns/locale'
import { useLocale } from 'next-intl'
import { generateAttendancePDFv2 } from "@/lib/pdf-attendance"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

interface AttendanceExporterProps {
    classroomId: string
}

export function AttendanceExporter({ classroomId }: AttendanceExporterProps) {
    const t = useTranslations('calendar')
    const locale = useLocale()

    const dateLocaleMap: Record<string, any> = {
        'en': enUS,
        'fr': fr,
        'de': de,
        'es': es,
        'pt': pt,
        'uk': uk,
        'ru': ru
    }

    const dateLocale = dateLocaleMap[locale] || enUS

    // Initialize with current month
    const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()))
    const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()))
    const [isStartOpen, setIsStartOpen] = useState(false)
    const [isEndOpen, setIsEndOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleExport = async () => {
        if (!startDate || !endDate) return

        setLoading(true)
        try {
            const res = await fetch(
                `/api/classrooms/${classroomId}/attendance?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
            )
            if (!res.ok) throw new Error("Failed to fetch data")
            const data = await res.json()

            // Convert date strings back to Date objects
            data.startDate = new Date(data.startDate)
            data.endDate = new Date(data.endDate)

            if (data.sessions) {
                data.sessions.forEach((session: any) => {
                    session.startTime = new Date(session.startTime)
                    session.endTime = new Date(session.endTime)
                })
            }

            await generateAttendancePDFv2(data, locale)
        } catch (error) {
            console.error("Export failed:", error)
            alert("Failed to export PDF")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{t('from')}</span>
                <Popover open={isStartOpen} onOpenChange={setIsStartOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className={cn(
                                "w-[140px] justify-start text-left font-normal",
                                !startDate && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? format(startDate, "PP", { locale: dateLocale }) : t('pickDate')}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={(date) => {
                                if (date) {
                                    setStartDate(date)
                                    // If end date is before start date, adjust it
                                    if (endDate && date > endDate) {
                                        setEndDate(date)
                                    }
                                    setIsStartOpen(false)
                                }
                            }}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            </div>

            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{t('to')}</span>
                <Popover open={isEndOpen} onOpenChange={setIsEndOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className={cn(
                                "w-[140px] justify-start text-left font-normal",
                                !endDate && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? format(endDate, "PP", { locale: dateLocale }) : t('pickDate')}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={(date) => {
                                if (date) {
                                    setEndDate(date)
                                    setIsEndOpen(false)
                                }
                            }}
                            disabled={(date) => startDate ? date < startDate : false}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            </div>

            <Button onClick={handleExport} disabled={loading || !startDate || !endDate}>
                {loading ? t('exporting') : t('exportAttendance')}
            </Button>
        </div>
    )
}
