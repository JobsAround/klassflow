"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon, Download, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { enUS, fr, de, es, ru, uk, pt } from 'date-fns/locale'
import { generateAttendancePDFv2 } from "@/lib/pdf-attendance"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
        week: string
        month: string
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

    const [range, setRange] = useState<"week" | "month">("week")
    const [date, setDate] = useState<Date>(new Date())
    const [isCalendarOpen, setIsCalendarOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleExport = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch(`/api/public/classroom/${classroomId}/attendance?range=${range}&date=${date.toISOString()}`, {
                cache: 'no-store'
            })
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
                <div className="flex flex-col sm:flex-row gap-3">
                    <Select value={range} onValueChange={(v) => setRange(v as "week" | "month")}>
                        <SelectTrigger className="w-full sm:w-[140px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="week">{t.week}</SelectItem>
                            <SelectItem value="month">{t.month}</SelectItem>
                        </SelectContent>
                    </Select>

                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    "w-full sm:w-[240px] justify-start text-left font-normal",
                                    !date && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date ? format(date, "PPP", { locale: dateLocale }) : <span>{t.pickDate}</span>}
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

                    <Button
                        onClick={handleExport}
                        disabled={loading}
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
