"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon, Download, Loader2 } from "lucide-react"
import { format, startOfMonth, endOfMonth, subMonths, isBefore } from "date-fns"
import { enUS, fr, de, es, ru, uk, pt } from 'date-fns/locale'
import { generateAttendancePDFv2 } from "@/lib/pdf-attendance"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface PublicAttendanceExporterProps {
    classroomId: string
    lang: string
    firstSessionDate?: Date | null
    translations: {
        attendance: string
        attendanceDescription: string
        from: string
        to: string
        pickDate: string
        download: string
        downloading: string
        exportError: string
        noSessions: string
        or: string
        selectMonth: string
    }
}

const dateLocaleMap: Record<string, any> = {
    'en': enUS,
    'fr': fr,
    'de': de,
    'es': es,
    'pt': pt,
    'ru': ru,
    'uk': uk
}

export function PublicAttendanceExporter({ classroomId, lang, firstSessionDate, translations: t }: PublicAttendanceExporterProps) {
    const dateLocale = dateLocaleMap[lang] || enUS

    // Initialize with current month
    const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()))
    const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()))
    const [isStartOpen, setIsStartOpen] = useState(false)
    const [isEndOpen, setIsEndOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [monthLoading, setMonthLoading] = useState(false)
    const [selectedMonth, setSelectedMonth] = useState<string>("")
    const [error, setError] = useState<string | null>(null)

    const monthOptions = useMemo(() => {
        if (!firstSessionDate) return []
        const lastCompleted = startOfMonth(subMonths(new Date(), 1))
        const firstMonth = startOfMonth(firstSessionDate)
        if (isBefore(lastCompleted, firstMonth)) return []
        const months: Date[] = []
        let cursor = lastCompleted
        while (!isBefore(cursor, firstMonth)) {
            months.push(cursor)
            cursor = subMonths(cursor, 1)
        }
        return months
    }, [firstSessionDate])

    const exportRange = async (start: Date, end: Date, setLoadingFn: (v: boolean) => void) => {
        setLoadingFn(true)
        setError(null)
        try {
            const res = await fetch(
                `/api/public/classroom/${classroomId}/attendance?startDate=${format(start, 'yyyy-MM-dd')}&endDate=${format(end, 'yyyy-MM-dd')}`,
                { cache: 'no-store' }
            )
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}))
                throw new Error(errorData.error || "Failed to fetch data")
            }
            const data = await res.json()

            if (!data.sessions || data.sessions.length === 0) {
                setError(t.noSessions)
                return
            }

            data.startDate = new Date(data.startDate)
            data.endDate = new Date(data.endDate)

            if (data.sessions) {
                data.sessions.forEach((session: any) => {
                    session.startTime = new Date(session.startTime)
                    session.endTime = new Date(session.endTime)
                })
            }

            await generateAttendancePDFv2(data, lang)
        } catch (err: any) {
            console.error("Export failed:", err)
            setError(t.exportError)
        } finally {
            setLoadingFn(false)
        }
    }

    const handleExport = () => {
        if (!startDate || !endDate) return
        exportRange(startDate, endDate, setLoading)
    }

    const handleExportMonth = () => {
        if (!selectedMonth) return
        const monthDate = new Date(selectedMonth)
        exportRange(startOfMonth(monthDate), endOfMonth(monthDate), setMonthLoading)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Download className="w-5 h-5" />
                    {t.attendance}
                </CardTitle>
                <CardDescription>
                    {t.attendanceDescription}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{t.from}</span>
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
                                    {startDate ? format(startDate, "PP", { locale: dateLocale }) : t.pickDate}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={startDate}
                                    onSelect={(date) => {
                                        if (date) {
                                            setStartDate(date)
                                            if (endDate && date > endDate) {
                                                setEndDate(date)
                                            }
                                            setIsStartOpen(false)
                                        }
                                    }}
                                    locale={dateLocale}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{t.to}</span>
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
                                    {endDate ? format(endDate, "PP", { locale: dateLocale }) : t.pickDate}
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
                                    locale={dateLocale}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <Button
                        onClick={handleExport}
                        disabled={loading || !startDate || !endDate}
                        className="w-full sm:w-auto"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t.downloading}
                            </>
                        ) : (
                            <>
                                <Download className="mr-2 h-4 w-4" />
                                {t.download}
                            </>
                        )}
                    </Button>
                </div>

                {monthOptions.length > 0 && (
                    <>
                        <div className="flex items-center gap-3 my-2">
                            <div className="flex-1 h-px bg-border" />
                            <span className="text-xs uppercase tracking-wide text-muted-foreground">{t.or}</span>
                            <div className="flex-1 h-px bg-border" />
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                <SelectTrigger className="w-full sm:w-[220px]">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    <SelectValue placeholder={t.selectMonth} />
                                </SelectTrigger>
                                <SelectContent>
                                    {monthOptions.map((m) => {
                                        const value = format(m, 'yyyy-MM-dd')
                                        const label = format(m, 'LLLL yyyy', { locale: dateLocale })
                                        return (
                                            <SelectItem key={value} value={value}>
                                                {label.charAt(0).toUpperCase() + label.slice(1)}
                                            </SelectItem>
                                        )
                                    })}
                                </SelectContent>
                            </Select>

                            <Button
                                onClick={handleExportMonth}
                                disabled={monthLoading || !selectedMonth}
                                className="w-full sm:w-auto"
                            >
                                {monthLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {t.downloading}
                                    </>
                                ) : (
                                    <>
                                        <Download className="mr-2 h-4 w-4" />
                                        {t.download}
                                    </>
                                )}
                            </Button>
                        </div>
                    </>
                )}

                {error && (
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                )}
            </CardContent>
        </Card>
    )
}
