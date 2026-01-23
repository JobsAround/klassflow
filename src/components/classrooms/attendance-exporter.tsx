"use client"

import { useState } from "react"
import { useTranslations } from 'next-intl'
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { fr, enUS, uk, ru } from 'date-fns/locale'
import { useLocale } from 'next-intl'
import { generateAttendancePDFv2 } from "@/lib/pdf-attendance"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
        'uk': uk,
        'ru': ru
    }

    const dateLocale = dateLocaleMap[locale] || enUS

    const [range, setRange] = useState<"week" | "month">("week")
    const [date, setDate] = useState<Date>(new Date())
    const [isCalendarOpen, setIsCalendarOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleExport = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/classrooms/${classroomId}/attendance?range=${range}&date=${date.toISOString()}`)
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
        <div className="flex items-center gap-2">
            <Select value={range} onValueChange={(v) => setRange(v as "week" | "month")}>
                <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Range" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="week">{t('week')}</SelectItem>
                    <SelectItem value="month">{t('month')}</SelectItem>
                </SelectContent>
            </Select>

            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn(
                            "w-[240px] justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP", { locale: dateLocale }) : <span>Pick a date</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(d) => {
                            if (d) {
                                setDate(d)
                                setIsCalendarOpen(false)
                            }
                        }}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>

            <Button onClick={handleExport} disabled={loading}>
                {loading ? "Exporting..." : "Exporter"}
            </Button>
        </div>
    )
}
