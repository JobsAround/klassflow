"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
    format,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    addWeeks,
    subWeeks,
    isToday,
    addDays
} from "date-fns"
import { Locale } from "date-fns"
import { enUS } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

interface Session {
    id: string
    title: string | null
    startTime: string | Date
    endTime: string | Date
    type: string
    classroom: {
        name: string
    }
}

interface ScheduleCalendarProps {
    sessions: Session[]
    locale?: Locale
    translate?: (key: string) => string
}

export function ScheduleCalendar({ sessions, locale = enUS, translate = (key) => key }: ScheduleCalendarProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Get view and date from URL or defaults
    const view = (searchParams.get("view") as "month" | "week") || "month"
    const dateParam = searchParams.get("date")
    const currentDate = dateParam ? new Date(dateParam) : new Date()

    const [currentView, setCurrentView] = useState<"month" | "week">(view)

    const navigate = (direction: "prev" | "next" | "today") => {
        let newDate = new Date(currentDate)

        if (direction === "today") {
            newDate = new Date()
        } else {
            const amount = direction === "next" ? 1 : -1
            if (currentView === "month") {
                newDate = addMonths(currentDate, amount)
            } else {
                newDate = addWeeks(currentDate, amount)
            }
        }

        const params = new URLSearchParams(searchParams)
        params.set("date", newDate.toISOString())
        params.set("view", currentView)
        router.push(`?${params.toString()}`)
    }

    const handleViewChange = (val: "month" | "week") => {
        setCurrentView(val)
        const params = new URLSearchParams(searchParams)
        params.set("view", val)
        router.push(`?${params.toString()}`)
    }

    // Generate days for the grid
    let days = []
    let start, end

    if (currentView === "month") {
        const monthStart = startOfMonth(currentDate)
        const monthEnd = endOfMonth(monthStart)
        start = startOfWeek(monthStart, { weekStartsOn: 1 })
        end = endOfWeek(monthEnd, { weekStartsOn: 1 })
    } else {
        start = startOfWeek(currentDate, { weekStartsOn: 1 })
        end = endOfWeek(currentDate, { weekStartsOn: 1 })
    }

    days = eachDayOfInterval({ start, end })

    // Group sessions by day
    const sessionsByDay = days.reduce((acc, day) => {
        const dayKey = format(day, "yyyy-MM-dd")
        acc[dayKey] = sessions.filter(s => isSameDay(new Date(s.startTime), day))
        return acc
    }, {} as Record<string, Session[]>)

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => navigate("prev")}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" onClick={() => navigate("today")}>
                        {translate("today")}
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => navigate("next")}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <h2 className="text-lg font-semibold ml-2">
                        {format(currentDate, currentView === "month" ? "MMMM yyyy" : "'Week of' MMM d, yyyy", { locale })}
                    </h2>
                </div>

                <Select value={currentView} onValueChange={(v: any) => handleViewChange(v)}>
                    <SelectTrigger className="w-[120px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="month">{translate("month")}</SelectItem>
                        <SelectItem value="week">{translate("week")}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className={cn(
                "grid border rounded-lg overflow-hidden bg-white dark:bg-slate-950",
                currentView === "month" ? "grid-cols-7" : "grid-cols-1 sm:grid-cols-7"
            )}>
                {/* Header */}
                {currentView === "month" && Array.from({ length: 7 }, (_, i) => {
                    const date = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), i)
                    return (
                        <div key={i} className="p-2 text-center text-sm font-medium border-b bg-slate-50 dark:bg-slate-900">
                            {format(date, "EEE", { locale })}
                        </div>
                    )
                })}

                {/* Days */}
                {days.map((day, dayIdx) => {
                    const daySessions = sessionsByDay[format(day, "yyyy-MM-dd")] || []
                    const isCurrentMonth = isSameMonth(day, currentDate)

                    return (
                        <div
                            key={day.toString()}
                            className={cn(
                                "min-h-[120px] p-2 border-b border-r relative transition-colors hover:bg-slate-50 dark:hover:bg-slate-900",
                                !isCurrentMonth && currentView === "month" && "bg-slate-50/50 dark:bg-slate-900/50 text-slate-400",
                                isToday(day) && "bg-blue-50/30 dark:bg-blue-900/10"
                            )}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className={cn(
                                    "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                                    isToday(day) && "bg-blue-600 text-white"
                                )}>
                                    {format(day, "d")}
                                </span>
                                {currentView === "week" && (
                                    <span className="text-xs text-slate-500 font-medium">
                                        {format(day, "EEEE", { locale })}
                                    </span>
                                )}
                            </div>

                            <div className="space-y-1">
                                {daySessions.map(session => (
                                    <div
                                        key={session.id}
                                        className="text-xs p-1.5 rounded border bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-semibold truncate text-blue-600 dark:text-blue-400">
                                                {format(new Date(session.startTime), "HH:mm")}
                                            </span>
                                            <Badge variant={session.type === "ONLINE" ? "secondary" : session.type === "HOMEWORK" ? "default" : "outline"} className="text-[10px] h-4 px-1">
                                                {session.type === "ONLINE" ? "Online" : session.type === "HOMEWORK" ? "Homework" : "On-site"}
                                            </Badge>
                                        </div>
                                        <div className="font-medium truncate" title={session.title || session.classroom.name}>
                                            {session.title || session.classroom.name}
                                        </div>
                                        <div className="text-slate-500 truncate text-[10px]">
                                            {session.classroom.name}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
