"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, FileText, ExternalLink, Video, Users, User, Loader2, Clock, Globe } from "lucide-react"
import { format } from "date-fns"
import { enUS, fr, de, es, ru, uk } from "date-fns/locale"
import { ScheduleCalendar } from "@/components/schedule/schedule-calendar"
import { ResourcesList } from "@/components/resources/resources-list"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const languages = [
    { code: "en", name: "English", locale: enUS },
    { code: "fr", name: "Français", locale: fr },
    { code: "de", name: "Deutsch", locale: de },
    { code: "es", name: "Español", locale: es },
    { code: "ru", name: "Русский", locale: ru },
    { code: "uk", name: "Українська", locale: uk },
]

interface ClassroomData {
    id: string
    name: string
    description: string | null
    locationOnline?: string | null
    locationOnline2?: string | null
    organization: { name: string }
    teachers: Array<{ name: string | null; email: string }>
    enrollments: Array<{ student: { name: string | null; email: string; image: string | null } }>
    sessions: Array<{
        id: string
        title: string | null
        type: string
        startTime: string
        endTime: string
        meetingLink: string | null
        isOnline: boolean
    }>
    resources: Array<{
        id: string
        title: string
        url: string
        type: string
        description: string | null
        pinned: boolean
        createdAt: string
    }>
}

function detectBrowserLanguage(): string {
    if (typeof window === "undefined") return "en"

    const browserLang = navigator.language.split("-")[0]
    const supportedLangs = ["en", "fr", "de", "es", "ru", "uk"]

    return supportedLangs.includes(browserLang) ? browserLang : "en"
}

export default function PublicClassroomPage() {
    const params = useParams()
    const token = params.token as string

    const [classroom, setClassroom] = useState<ClassroomData | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<"calendar" | "upcoming" | "resources" | "participants">("calendar")
    const [error, setError] = useState<string | null>(null)
    const [joinLoading, setJoinLoading] = useState(false)
    const [lang, setLang] = useState<string>("en")
    const [translations, setTranslations] = useState<any>({})
    const [translationsLoaded, setTranslationsLoaded] = useState(false)

    useEffect(() => {
        // Load language from localStorage or detect from browser
        const savedLang = localStorage.getItem("publicClassroomLang")
        const initialLang = savedLang || detectBrowserLanguage()
        setLang(initialLang)
    }, [])

    useEffect(() => {
        // Load translations for selected language
        async function loadTranslations() {
            try {
                setTranslationsLoaded(false)
                const response = await fetch(`/messages/${lang}.json`)
                if (!response.ok) throw new Error("Failed to load translations")
                const data = await response.json()
                setTranslations(data.publicClassroom || {})
                setTranslationsLoaded(true)
            } catch (err) {
                console.error("Failed to load translations:", err)
                // Fallback to English
                try {
                    const fallbackResponse = await fetch(`/messages/en.json`)
                    const fallbackData = await fallbackResponse.json()
                    setTranslations(fallbackData.publicClassroom || {})
                } catch (fallbackErr) {
                    console.error("Failed to load fallback translations:", fallbackErr)
                }
                setTranslationsLoaded(true)
            }
        }
        loadTranslations()
    }, [lang])

    const t = (key: string) => {
        return translations[key] || key
    }

    const getDateLocale = () => {
        return languages.find(l => l.code === lang)?.locale || enUS
    }

    const changeLang = (newLang: string) => {
        setLang(newLang)
        localStorage.setItem("publicClassroomLang", newLang)
    }

    async function handleJoin(roomSuffix: string = "") {
        setJoinLoading(true)
        try {
            const response = await fetch(`/api/public/classroom/${token}/join`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    guestName: "",
                    roomSuffix // Pass optional suffix to API
                })
            })

            if (!response.ok) throw new Error("Failed to get access")

            const data = await response.json()
            const { url, token: jwt } = data
            window.open(`${url}#jwt=${jwt}`, '_blank')
        } catch (error) {
            console.error(error)
            alert("Failed to join session")
        } finally {
            setJoinLoading(false)
        }
    }

    useEffect(() => {
        async function fetchClassroom() {
            if (!token) return

            try {
                const response = await fetch(`/api/public/classroom/${token}`)

                if (!response.ok) {
                    throw new Error("Classroom not found or sharing disabled")
                }

                const data = await response.json()
                setClassroom(data)
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load classroom")
            } finally {
                setLoading(false)
            }
        }

        fetchClassroom()
    }, [token])

    if (loading || !translationsLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-slate-500">{translations.loading || "Loading..."}</p>
            </div>
        )
    }

    if (error || !classroom) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="max-w-md">
                    <CardContent className="pt-6">
                        <p className="text-center text-slate-500">{error || t("classroomNotFound")}</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const dateLocale = getDateLocale()

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <div className="flex items-start justify-between mb-4">
                        <h1 className="text-3xl font-bold text-slate-900">{classroom.name}</h1>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Globe className="w-4 h-4 mr-2" />
                                    {languages.find(l => l.code === lang)?.name}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {languages.map((language) => (
                                    <DropdownMenuItem
                                        key={language.code}
                                        onClick={() => changeLang(language.code)}
                                    >
                                        {language.name}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    {classroom.description && (
                        <p className="text-slate-600 mt-2">{classroom.description}</p>
                    )}
                    {classroom.locationOnline && (
                        <div className="flex items-center gap-2 mt-2 text-slate-500">
                            <Video className="w-4 h-4" />
                            <a href={classroom.locationOnline} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-blue-600">
                                {classroom.locationOnline}
                            </a>
                        </div>
                    )}
                    <p className="text-sm text-slate-500 mt-4">
                        <strong>{classroom.organization.name}</strong>
                    </p>
                    <div className="mt-6 flex flex-wrap gap-4">
                        <Button
                            onClick={() => handleJoin("")}
                            disabled={joinLoading}
                            className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                        >
                            {joinLoading ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Video className="w-4 h-4 mr-2" />
                            )}
                            {t("joinVideo")} {classroom.locationOnline2 === "ENABLED" ? " (1)" : ""}
                        </Button>

                        {classroom.locationOnline2 === "ENABLED" && (
                            <Button
                                onClick={() => handleJoin("-2")}
                                disabled={joinLoading}
                                className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                            >
                                {joinLoading ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Video className="w-4 h-4 mr-2" />
                                )}
                                {t("joinVideo")} (2)
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="max-w-4xl mx-auto px-4 py-6">
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    <Button
                        variant={activeTab === "calendar" ? "default" : "outline"}
                        onClick={() => setActiveTab("calendar")}
                    >
                        <Calendar className="w-4 h-4 mr-2" />
                        {t("calendar")}
                    </Button>
                    <Button
                        variant={activeTab === "upcoming" ? "default" : "outline"}
                        onClick={() => setActiveTab("upcoming")}
                    >
                        <Clock className="w-4 h-4 mr-2" />
                        {t("upcomingSessions")} ({classroom.sessions.filter(s => new Date(s.endTime) >= new Date()).length})
                    </Button>
                    <Button
                        variant={activeTab === "resources" ? "default" : "outline"}
                        onClick={() => setActiveTab("resources")}
                    >
                        <FileText className="w-4 h-4 mr-2" />
                        {t("resources")} ({classroom.resources.length})
                    </Button>
                    <Button
                        variant={activeTab === "participants" ? "default" : "outline"}
                        onClick={() => setActiveTab("participants")}
                    >
                        <Users className="w-4 h-4 mr-2" />
                        {t("participants")}
                    </Button>
                </div>

                {/* Calendar Tab */}
                {activeTab === "calendar" && (
                    <div className="bg-white rounded-lg border p-4">
                        <ScheduleCalendar
                            sessions={classroom.sessions.map(s => ({
                                ...s,
                                classroom: { name: classroom.name }
                            }))}
                            locale={dateLocale}
                            translate={t}
                        />
                    </div>
                )}

                {/* Upcoming Tab */}
                {activeTab === "upcoming" && (
                    <div className="space-y-4">
                        {classroom.sessions.filter(s => new Date(s.endTime) >= new Date()).length === 0 ? (
                            <Card>
                                <CardContent className="pt-6 text-center py-12">
                                    <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                                    <p className="text-slate-500">{t("noUpcomingSessions")}</p>
                                </CardContent>
                            </Card>
                        ) : (
                            classroom.sessions
                                .filter(s => new Date(s.endTime) >= new Date())
                                .map((session) => (
                                    <Card key={session.id} className="hover:shadow-md transition-shadow">
                                        <CardHeader>
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <CardTitle className="text-lg">
                                                        {session.title || t("classSession")}
                                                    </CardTitle>
                                                    <CardDescription>
                                                        {format(new Date(session.startTime), "EEEE, MMMM d, yyyy", { locale: dateLocale })}
                                                    </CardDescription>
                                                </div>
                                                <Badge variant={session.type === "ONLINE" ? "default" : "secondary"}>
                                                    {session.type === "ONLINE" ? t("online") : t("onsite")}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-slate-500">{t("time")}</span>
                                                    <span className="font-medium">
                                                        {format(new Date(session.startTime), lang === "fr" || lang === "de" ? "HH:mm" : "h:mm a", { locale: dateLocale })} -{" "}
                                                        {format(new Date(session.endTime), lang === "fr" || lang === "de" ? "HH:mm" : "h:mm a", { locale: dateLocale })}
                                                    </span>
                                                </div>
                                                {classroom.teachers.length > 0 && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-slate-500">{t("teacher")}</span>
                                                        <span className="font-medium">
                                                            {classroom.teachers.map(t => t.name).join(", ")}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                        )}
                    </div>
                )}

                {/* Resources Tab */}
                {activeTab === "resources" && (
                    <ResourcesList
                        classroomId={classroom.id}
                        resources={classroom.resources}
                        canPin={false}
                    />
                )}

                {/* Participants Tab */}
                {activeTab === "participants" && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                <Users className="w-5 h-5 text-slate-500" />
                                {t("teachers")} ({classroom.teachers.length})
                            </h3>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {classroom.teachers.map((teacher, i) => (
                                    <Card key={i}>
                                        <CardContent className="flex items-center gap-3 pt-6">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                                                <User className="w-5 h-5 text-slate-500" />
                                            </div>
                                            <div>
                                                <p className="font-medium">{teacher.name || "Teacher"}</p>
                                                <p className="text-sm text-slate-500">{teacher.email}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                <Users className="w-5 h-5 text-slate-500" />
                                {t("students")} ({classroom.enrollments.length})
                            </h3>
                            {classroom.enrollments.length === 0 ? (
                                <p className="text-slate-500">{t("noStudentsEnrolled")}</p>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {classroom.enrollments.map((enrollment, i) => (
                                        <Card key={i}>
                                            <CardContent className="flex items-center gap-3 pt-6">
                                                {enrollment.student.image ? (
                                                    <img src={enrollment.student.image} alt="" className="w-10 h-10 rounded-full object-cover" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                                                        <User className="w-5 h-5 text-slate-500" />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-medium">{enrollment.student.name || "Student"}</p>
                                                    <p className="text-sm text-slate-500">{enrollment.student.email}</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
