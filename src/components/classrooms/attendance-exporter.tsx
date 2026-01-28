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
import type { DateRange } from "react-day-picker"

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
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date())
    })
    const [isCalendarOpen, setIsCalendarOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleExport = async () => {
        if (!dateRange?.from || !dateRange?.to) return

        setLoading(true)
        try {
            const res = await fetch(
                `/api/classrooms/${classroomId}/attendance?startDate=${dateRange.from.toISOString()}&endDate=${dateRange.to.toISOString()}`
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

    const formatDateRange = () => {
        if (!dateRange?.from) return t('selectDates')
        if (!dateRange.to) return format(dateRange.from, "PP", { locale: dateLocale })
        return `${format(dateRange.from, "PP", { locale: dateLocale })} - ${format(dateRange.to, "PP", { locale: dateLocale })}`
    }

    return (
        <div className="flex items-center gap-2">
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn(
                            "w-[300px] justify-start text-left font-normal",
                            !dateRange && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formatDateRange()}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                    />
                </PopoverContent>
            </Popover>

            <Button onClick={handleExport} disabled={loading || !dateRange?.from || !dateRange?.to}>
                {loading ? t('exporting') : t('exportAttendance')}
            </Button>
        </div>
    )
}
