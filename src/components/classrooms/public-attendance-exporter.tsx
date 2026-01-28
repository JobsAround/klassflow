"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon, Download, Loader2 } from "lucide-react"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { enUS, fr, de, es, ru, uk, pt } from 'date-fns/locale'
import { generateAttendancePDFv2 } from "@/lib/pdf-attendance"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface PublicAttendanceExporterProps {
    classroomId: string
    lang: string
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

export function PublicAttendanceExporter({ classroomId, lang, translations: t }: PublicAttendanceExporterProps) {
    const dateLocale = dateLocaleMap[lang] || enUS

    // Initialize with current month
    const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()))
    const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()))
    const [isStartOpen, setIsStartOpen] = useState(false)
    const [isEndOpen, setIsEndOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleExport = async () => {
        if (!startDate || !endDate) return

        setLoading(true)
        setError(null)
        try {
            const res = await fetch(
                `/api/public/classroom/${classroomId}/attendance?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
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

            // Convert date strings back to Date objects
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
            setLoading(false)
        }
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

                {error && (
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                )}
            </CardContent>
        </Card>
    )
}
