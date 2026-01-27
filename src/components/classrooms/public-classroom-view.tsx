"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Calendar, FileText, Users, User, Loader2, Clock, Globe, Video, GraduationCap, CheckCircle2, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { enUS, fr, de, es, ru, uk, pt } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScheduleCalendar } from "@/components/schedule/schedule-calendar"
import { ResourcesList } from "@/components/resources/resources-list"
import { PublicAttendanceExporter } from "@/components/classrooms/public-attendance-exporter"

const languages = [
    { code: "en", name: "English", locale: enUS },
    { code: "fr", name: "Français", locale: fr },
    { code: "de", name: "Deutsch", locale: de },
    { code: "es", name: "Español", locale: es },
    { code: "pt", name: "Português", locale: pt },
    { code: "ru", name: "Русский", locale: ru },
    { code: "uk", name: "Українська", locale: uk },
]

export interface PublicClassroomData {
    id: string
    name: string
    description: string | null
    locationOnline?: string | null
    locationOnline2?: string | null
    videoEnabled?: boolean
    organization: { name: string }
    teachers: Array<{ id?: string; name: string | null; email: string }>
    enrollments: Array<{ student: { id?: string; name: string | null; email: string; image?: string | null } }>
    sessions: Array<{
        id: string
        title: string | null
        type: string
        startTime: string | Date
        endTime: string | Date
        meetingLink?: string | null
        isOnline?: boolean
        classroom?: { name: string }
    }>
    resources: Array<{
        id: string
        title: string
        url: string
        type: string
        description?: string | null
        pinned: boolean
        createdAt: string | Date
    }>
}

export interface PublicClassroomViewProps {
    classroom: PublicClassroomData
    translations?: Record<string, Record<string, string>>
    onJoinVideo?: (roomSuffix?: string) => void
    joinLoading?: boolean
    logoText?: string
    badgeText?: string
}

interface PendingSession {
    id: string
    title: string | null
    startTime: string
    endTime: string
    pendingStudents: { id: string; name: string | null; email: string }[]
}

interface PendingAttendanceData {
    pendingSessions: PendingSession[]
    pendingCount: number
    completedCount: number
}

const defaultTranslations: Record<string, Record<string, string>> = {
    en: {
        loading: "Loading...",
        classroomNotFound: "Classroom not found or sharing disabled",
        calendar: "Calendar",
        upcomingSessions: "Upcoming",
        resources: "Resources",
        participants: "Participants",
        attendance: "Attendance",
        attendanceDescription: "Download signed attendance sheets for your records.",
        teachers: "Teachers",
        students: "Students",
        noUpcomingSessions: "No upcoming sessions",
        noStudentsEnrolled: "No students enrolled",
        classSession: "Class Session",
        online: "Online",
        onsite: "On-site",
        homework: "Homework",
        time: "Time:",
        teacher: "Teacher:",
        joinVideo: "Join Video Session",
        today: "Today",
        month: "Month",
        week: "Week",
        pickDate: "Pick a date",
        download: "Download PDF",
        downloading: "Downloading...",
        exportError: "Failed to export. Please try again.",
        noSessions: "No sessions found for this period.",
        pendingAttendance: "Pending attendance",
        allUpToDate: "All attendance records are up to date",
        completedAttendance: "completed attendance records",
        inMinutes: "in {minutes} min",
        daysAgo: "{days} days ago",
        startsIn: "starts in",
        exportAttendance: "Export attendance sheets",
    },
    fr: {
        loading: "Chargement...",
        classroomNotFound: "Classe non trouvée ou partage désactivé",
        calendar: "Calendrier",
        upcomingSessions: "À venir",
        resources: "Ressources",
        participants: "Participants",
        attendance: "Émargement",
        attendanceDescription: "Téléchargez les feuilles d'émargement signées pour vos archives.",
        teachers: "Formateurs",
        students: "Stagiaires",
        noUpcomingSessions: "Aucune session à venir",
        noStudentsEnrolled: "Aucun stagiaire inscrit",
        classSession: "Session de cours",
        online: "En ligne",
        onsite: "Présentiel",
        homework: "Travail personnel",
        time: "Horaire :",
        teacher: "Formateur :",
        joinVideo: "Rejoindre la visio",
        today: "Aujourd'hui",
        month: "Mois",
        week: "Semaine",
        pickDate: "Choisir une date",
        download: "Télécharger PDF",
        downloading: "Téléchargement...",
        exportError: "Échec de l'export. Veuillez réessayer.",
        noSessions: "Aucune session trouvée pour cette période.",
        pendingAttendance: "Émargements en attente",
        allUpToDate: "Tous les émargements sont à jour",
        completedAttendance: "émargements complétés",
        inMinutes: "dans {minutes} min",
        daysAgo: "il y a {days} jours",
        startsIn: "commence dans",
        exportAttendance: "Exporter les feuilles d'émargement",
    },
    de: {
        loading: "Laden...",
        classroomNotFound: "Klassenzimmer nicht gefunden",
        calendar: "Kalender",
        upcomingSessions: "Kommende",
        resources: "Ressourcen",
        participants: "Teilnehmer",
        attendance: "Anwesenheit",
        attendanceDescription: "Laden Sie unterschriebene Anwesenheitslisten herunter.",
        teachers: "Lehrer",
        students: "Schüler",
        noUpcomingSessions: "Keine kommenden Sitzungen",
        noStudentsEnrolled: "Keine Schüler eingeschrieben",
        classSession: "Unterricht",
        online: "Online",
        onsite: "Vor Ort",
        homework: "Hausaufgabe",
        time: "Zeit:",
        teacher: "Lehrer:",
        joinVideo: "Video beitreten",
        today: "Heute",
        month: "Monat",
        week: "Woche",
        pickDate: "Datum auswählen",
        download: "PDF herunterladen",
        downloading: "Wird heruntergeladen...",
        exportError: "Export fehlgeschlagen. Bitte erneut versuchen.",
        noSessions: "Keine Sitzungen für diesen Zeitraum gefunden.",
        pendingAttendance: "Ausstehende Anwesenheit",
        allUpToDate: "Alle Anwesenheitseinträge sind aktuell",
        completedAttendance: "abgeschlossene Anwesenheitseinträge",
        inMinutes: "in {minutes} Min",
        daysAgo: "vor {days} Tagen",
        startsIn: "beginnt in",
        exportAttendance: "Anwesenheitslisten exportieren",
    },
    es: {
        loading: "Cargando...",
        classroomNotFound: "Aula no encontrada",
        calendar: "Calendario",
        upcomingSessions: "Próximas",
        resources: "Recursos",
        participants: "Participantes",
        attendance: "Asistencia",
        attendanceDescription: "Descarga las hojas de asistencia firmadas para tus registros.",
        teachers: "Profesores",
        students: "Estudiantes",
        noUpcomingSessions: "No hay sesiones próximas",
        noStudentsEnrolled: "No hay estudiantes inscritos",
        classSession: "Sesión de clase",
        online: "En línea",
        onsite: "Presencial",
        homework: "Tarea",
        time: "Hora:",
        teacher: "Profesor:",
        joinVideo: "Unirse al video",
        today: "Hoy",
        month: "Mes",
        week: "Semana",
        pickDate: "Elegir fecha",
        download: "Descargar PDF",
        downloading: "Descargando...",
        exportError: "Error al exportar. Intente de nuevo.",
        noSessions: "No se encontraron sesiones para este período.",
        pendingAttendance: "Asistencia pendiente",
        allUpToDate: "Todos los registros de asistencia están al día",
        completedAttendance: "registros de asistencia completados",
        inMinutes: "en {minutes} min",
        daysAgo: "hace {days} días",
        startsIn: "comienza en",
        exportAttendance: "Exportar hojas de asistencia",
    },
    ru: {
        loading: "Загрузка...",
        classroomNotFound: "Класс не найден",
        calendar: "Календарь",
        upcomingSessions: "Предстоящие",
        resources: "Ресурсы",
        participants: "Участники",
        attendance: "Посещаемость",
        attendanceDescription: "Скачайте подписанные листы посещаемости для ваших записей.",
        teachers: "Преподаватели",
        students: "Студенты",
        noUpcomingSessions: "Нет предстоящих сессий",
        noStudentsEnrolled: "Нет зачисленных студентов",
        classSession: "Занятие",
        online: "Онлайн",
        onsite: "Очно",
        homework: "Домашнее задание",
        time: "Время:",
        teacher: "Преподаватель:",
        joinVideo: "Присоединиться к видео",
        today: "Сегодня",
        month: "Месяц",
        week: "Неделя",
        pickDate: "Выбрать дату",
        download: "Скачать PDF",
        downloading: "Загрузка...",
        exportError: "Ошибка экспорта. Попробуйте снова.",
        noSessions: "Сессии за этот период не найдены.",
        pendingAttendance: "Ожидающие записи",
        allUpToDate: "Все записи посещаемости актуальны",
        completedAttendance: "завершённых записей посещаемости",
        inMinutes: "через {minutes} мин",
        daysAgo: "{days} дней назад",
        startsIn: "начинается через",
        exportAttendance: "Экспортировать листы посещаемости",
    },
    uk: {
        loading: "Завантаження...",
        classroomNotFound: "Клас не знайдено",
        calendar: "Календар",
        upcomingSessions: "Майбутні",
        resources: "Ресурси",
        participants: "Учасники",
        attendance: "Відвідуваність",
        attendanceDescription: "Завантажте підписані листи відвідуваності для ваших записів.",
        teachers: "Викладачі",
        students: "Студенти",
        noUpcomingSessions: "Немає майбутніх сесій",
        noStudentsEnrolled: "Немає зарахованих студентів",
        classSession: "Заняття",
        online: "Онлайн",
        onsite: "Очно",
        homework: "Домашнє завдання",
        time: "Час:",
        teacher: "Викладач:",
        joinVideo: "Приєднатися до відео",
        today: "Сьогодні",
        month: "Місяць",
        week: "Тиждень",
        pickDate: "Вибрати дату",
        download: "Завантажити PDF",
        downloading: "Завантаження...",
        exportError: "Помилка експорту. Спробуйте ще раз.",
        noSessions: "Сесії за цей період не знайдено.",
        pendingAttendance: "Очікувані записи",
        allUpToDate: "Усі записи відвідуваності актуальні",
        completedAttendance: "завершених записів відвідуваності",
        inMinutes: "через {minutes} хв",
        daysAgo: "{days} днів тому",
        startsIn: "починається через",
        exportAttendance: "Експортувати листи відвідуваності",
    },
    pt: {
        loading: "A carregar...",
        classroomNotFound: "Sala de aula não encontrada",
        calendar: "Calendário",
        upcomingSessions: "Próximas",
        resources: "Recursos",
        participants: "Participantes",
        attendance: "Presenças",
        attendanceDescription: "Descarregue as folhas de presença assinadas para os seus registos.",
        teachers: "Professores",
        students: "Estudantes",
        noUpcomingSessions: "Sem sessões agendadas",
        noStudentsEnrolled: "Nenhum estudante inscrito",
        classSession: "Aula",
        online: "Online",
        onsite: "Presencial",
        homework: "Trabalho pessoal",
        time: "Hora:",
        teacher: "Professor:",
        joinVideo: "Entrar no vídeo",
        today: "Hoje",
        month: "Mês",
        week: "Semana",
        pickDate: "Escolher data",
        download: "Descarregar PDF",
        downloading: "A descarregar...",
        exportError: "Falha ao exportar. Tente novamente.",
        noSessions: "Nenhuma sessão encontrada para este período.",
        pendingAttendance: "Presenças pendentes",
        allUpToDate: "Todos os registos de presença estão atualizados",
        completedAttendance: "registos de presença concluídos",
        inMinutes: "em {minutes} min",
        daysAgo: "há {days} dias",
        startsIn: "começa em",
        exportAttendance: "Exportar folhas de presença",
    },
}

function detectBrowserLanguage(): string {
    if (typeof window === "undefined") return "en"
    const browserLang = navigator.language.split("-")[0]
    return ["en", "fr", "de", "es", "ru", "uk", "pt"].includes(browserLang) ? browserLang : "en"
}

type TabValue = "calendar" | "upcoming" | "resources" | "participants" | "attendance"

const validTabs: TabValue[] = ["calendar", "upcoming", "resources", "participants", "attendance"]

function getTabFromHash(): TabValue {
    if (typeof window === "undefined") return "calendar"
    const hash = window.location.hash.slice(1) // Remove the # prefix
    return validTabs.includes(hash as TabValue) ? (hash as TabValue) : "calendar"
}

export function PublicClassroomView({
    classroom,
    translations = defaultTranslations,
    onJoinVideo,
    joinLoading = false,
    logoText = "KlassFlow",
    badgeText = "Cloud"
}: PublicClassroomViewProps) {
    const [activeTab, setActiveTab] = useState<TabValue>(() => getTabFromHash())
    // Start with "en" to match server render, then update on client
    const [lang, setLang] = useState<string>("en")
    const [langInitialized, setLangInitialized] = useState(false)

    useEffect(() => {
        const savedLang = localStorage.getItem("publicClassroomLang") || detectBrowserLanguage()
        setLang(savedLang)
        setLangInitialized(true)
    }, [])

    // Handle URL hash changes (browser back/forward)
    useEffect(() => {
        const handleHashChange = () => {
            setActiveTab(getTabFromHash())
        }
        window.addEventListener("hashchange", handleHashChange)
        return () => window.removeEventListener("hashchange", handleHashChange)
    }, [])

    // Update URL hash when tab changes
    const handleTabChange = (tab: TabValue) => {
        setActiveTab(tab)
        if (typeof window !== "undefined") {
            window.history.replaceState(null, "", `#${tab}`)
        }
    }

    const allTranslations = { ...defaultTranslations, ...translations }
    const t = (key: string) => allTranslations[lang]?.[key] || allTranslations.en[key] || key
    const getDateLocale = () => languages.find(l => l.code === lang)?.locale || enUS

    const changeLang = (newLang: string) => {
        setLang(newLang)
        if (typeof window !== "undefined") {
            localStorage.setItem("publicClassroomLang", newLang)
        }
    }

    const dateLocale = getDateLocale()

    // Use state for "now" to avoid hydration mismatch (server vs client time)
    const [now, setNow] = useState<Date | null>(null)
    useEffect(() => {
        setNow(new Date())
    }, [])

    // Pending attendance state
    const [pendingData, setPendingData] = useState<PendingAttendanceData | null>(null)
    const [pendingLoading, setPendingLoading] = useState(false)

    const fetchPendingAttendance = useCallback(async () => {
        setPendingLoading(true)
        try {
            const res = await fetch(`/api/public/classroom/${classroom.id}/pending-attendance`)
            if (res.ok) {
                const data = await res.json()
                setPendingData(data)
            }
        } catch (error) {
            console.error("Failed to fetch pending attendance:", error)
        } finally {
            setPendingLoading(false)
        }
    }, [classroom.id])

    // Fetch pending attendance when tab is attendance
    useEffect(() => {
        if (activeTab === "attendance") {
            fetchPendingAttendance()
        }
    }, [activeTab, fetchPendingAttendance])

    // Helper to format relative time
    const formatRelativeTime = (dateStr: string): string => {
        if (!now) return ""
        const date = new Date(dateStr)
        const diffMs = date.getTime() - now.getTime()
        const diffMinutes = Math.round(diffMs / (1000 * 60))
        const diffDays = Math.round(-diffMs / (1000 * 60 * 60 * 24))

        if (diffMinutes > 0 && diffMinutes <= 60) {
            return t("inMinutes").replace("{minutes}", String(diffMinutes))
        } else if (diffDays > 0) {
            return t("daysAgo").replace("{days}", String(diffDays))
        }
        return ""
    }

    const upcomingSessions = useMemo(() => {
        if (!now) return classroom.sessions // Show all sessions during SSR/initial render
        return classroom.sessions.filter(s => new Date(s.endTime) >= now)
    }, [classroom.sessions, now])

    // Prepare sessions for calendar with classroom name
    const calendarSessions = classroom.sessions.map(s => ({
        ...s,
        startTime: typeof s.startTime === 'string' ? s.startTime : s.startTime.toISOString(),
        endTime: typeof s.endTime === 'string' ? s.endTime : s.endTime.toISOString(),
        classroom: s.classroom || { name: classroom.name }
    }))

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            {/* Header */}
            <div className="bg-white dark:bg-slate-950 border-b">
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
                                <GraduationCap className="h-5 w-5 text-white" />
                            </div>
                            <span className="font-bold text-xl">{logoText}</span>
                            {badgeText && (
                                <span className="text-xs font-normal text-blue-600 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                                    {badgeText}
                                </span>
                            )}
                        </div>
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

                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{classroom.name}</h1>
                    {classroom.description && (
                        <p className="text-slate-600 dark:text-slate-400 mt-2">{classroom.description}</p>
                    )}
                    {(classroom.videoEnabled !== false && classroom.locationOnline) && (
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

                    {(onJoinVideo && classroom.videoEnabled !== false) && (
                        <div className="mt-6 flex flex-wrap gap-4">
                            <Button
                                onClick={() => onJoinVideo("")}
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
                                    onClick={() => onJoinVideo("-2")}
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
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="max-w-4xl mx-auto px-4 py-6">
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    <Button
                        variant={activeTab === "calendar" ? "default" : "outline"}
                        onClick={() => handleTabChange("calendar")}
                    >
                        <Calendar className="w-4 h-4 mr-2" />
                        {t("calendar")}
                    </Button>
                    <Button
                        variant={activeTab === "upcoming" ? "default" : "outline"}
                        onClick={() => handleTabChange("upcoming")}
                    >
                        <Clock className="w-4 h-4 mr-2" />
                        {t("upcomingSessions")} ({upcomingSessions.length})
                    </Button>
                    <Button
                        variant={activeTab === "resources" ? "default" : "outline"}
                        onClick={() => handleTabChange("resources")}
                    >
                        <FileText className="w-4 h-4 mr-2" />
                        {t("resources")} ({classroom.resources.length})
                    </Button>
                    <Button
                        variant={activeTab === "participants" ? "default" : "outline"}
                        onClick={() => handleTabChange("participants")}
                    >
                        <Users className="w-4 h-4 mr-2" />
                        {t("participants")}
                    </Button>
                    <Button
                        variant={activeTab === "attendance" ? "default" : "outline"}
                        onClick={() => handleTabChange("attendance")}
                    >
                        <FileText className="w-4 h-4 mr-2" />
                        {t("attendance")}
                    </Button>
                </div>

                {/* Calendar Tab */}
                {activeTab === "calendar" && (
                    <div className="bg-white dark:bg-slate-950 rounded-lg border p-4">
                        <ScheduleCalendar
                            sessions={calendarSessions}
                            locale={dateLocale}
                            translate={t}
                        />
                    </div>
                )}

                {/* Upcoming Tab */}
                {activeTab === "upcoming" && (
                    <div className="space-y-4">
                        {upcomingSessions.length === 0 ? (
                            <Card>
                                <CardContent className="pt-6 text-center py-12">
                                    <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                                    <p className="text-slate-500">{t("noUpcomingSessions")}</p>
                                </CardContent>
                            </Card>
                        ) : (
                            upcomingSessions.map((session) => (
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
                                            <Badge variant={session.type === "ONLINE" ? "default" : session.type === "HOMEWORK" ? "outline" : "secondary"}>
                                                {session.type === "ONLINE" ? t("online") : session.type === "HOMEWORK" ? t("homework") : t("onsite")}
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
                        resources={classroom.resources as any}
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
                                    <Card key={teacher.id || i}>
                                        <CardContent className="flex items-center gap-3 pt-6">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                <User className="w-5 h-5 text-slate-500" />
                                            </div>
                                            <div className="min-w-0 dark:text-slate-200">
                                                <p className="font-medium truncate" title={teacher.name || "Teacher"}>{teacher.name || "Teacher"}</p>
                                                <p className="text-sm text-slate-500 truncate" title={teacher.email}>{teacher.email}</p>
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
                                        <Card key={enrollment.student.id || i}>
                                            <CardContent className="flex items-center gap-3 pt-6">
                                                {enrollment.student.image ? (
                                                    <img src={enrollment.student.image} alt="" className="w-10 h-10 rounded-full object-cover" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                        <User className="w-5 h-5 text-slate-500" />
                                                    </div>
                                                )}
                                                <div className="min-w-0 dark:text-slate-200">
                                                    <p className="font-medium truncate" title={enrollment.student.name || "Student"}>{enrollment.student.name || "Student"}</p>
                                                    <p className="text-sm text-slate-500 truncate" title={enrollment.student.email}>{enrollment.student.email}</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Attendance Tab */}
                {activeTab === "attendance" && (
                    <div className="space-y-6">
                        {/* Pending Attendance Section */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5 text-amber-500" />
                                    {t("pendingAttendance")}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {pendingLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                                    </div>
                                ) : pendingData && pendingData.pendingCount > 0 ? (
                                    <div className="space-y-4">
                                        {/* Group by student */}
                                        {(() => {
                                            // Transform data: group sessions by student
                                            const studentMap = new Map<string, {
                                                id: string
                                                name: string | null
                                                email: string
                                                sessions: { id: string; title: string | null; startTime: string }[]
                                            }>()

                                            pendingData.pendingSessions.forEach(session => {
                                                session.pendingStudents.forEach(student => {
                                                    const existing = studentMap.get(student.id)
                                                    if (existing) {
                                                        existing.sessions.push({
                                                            id: session.id,
                                                            title: session.title,
                                                            startTime: session.startTime
                                                        })
                                                    } else {
                                                        studentMap.set(student.id, {
                                                            ...student,
                                                            sessions: [{
                                                                id: session.id,
                                                                title: session.title,
                                                                startTime: session.startTime
                                                            }]
                                                        })
                                                    }
                                                })
                                            })

                                            // Sort by number of pending sessions (most first)
                                            const studentsWithPending = Array.from(studentMap.values())
                                                .sort((a, b) => b.sessions.length - a.sessions.length)

                                            return (
                                                <>
                                                    <div className="text-sm font-medium text-amber-600 dark:text-amber-400">
                                                        {studentsWithPending.length} {studentsWithPending.length === 1 ? "stagiaire" : "stagiaires"} {t("pendingAttendance").toLowerCase()}
                                                    </div>
                                                    {studentsWithPending.map((student) => (
                                                        <div
                                                            key={student.id}
                                                            className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
                                                        >
                                                            <div className="flex items-start justify-between mb-2">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-800 flex items-center justify-center">
                                                                        <User className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-medium text-slate-900 dark:text-slate-100">
                                                                            {student.name || student.email}
                                                                        </p>
                                                                        {student.name && (
                                                                            <p className="text-sm text-slate-500">
                                                                                {student.email}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <Badge variant="outline" className="text-amber-600 border-amber-300">
                                                                    {student.sessions.length} session{student.sessions.length > 1 ? "s" : ""}
                                                                </Badge>
                                                            </div>
                                                            <div className="ml-13 mt-2 text-sm text-slate-600 dark:text-slate-400">
                                                                {student.sessions
                                                                    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                                                                    .map((session, idx) => (
                                                                        <span key={session.id}>
                                                                            {format(new Date(session.startTime), "d MMM", { locale: dateLocale })}
                                                                            {idx < student.sessions.length - 1 ? ", " : ""}
                                                                        </span>
                                                                    ))
                                                                }
                                                            </div>
                                                        </div>
                                                    ))}
                                                </>
                                            )
                                        })()}
                                        {pendingData.completedCount > 0 && (
                                            <div className="pt-4 border-t text-sm text-slate-500 flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                {pendingData.completedCount} {t("completedAttendance")}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                                        <div>
                                            <p className="text-green-700 dark:text-green-400 font-medium text-sm">
                                                {t("allUpToDate")}
                                            </p>
                                            {pendingData && pendingData.completedCount > 0 && (
                                                <p className="text-xs text-green-600/70 dark:text-green-500/70">
                                                    {pendingData.completedCount} {t("completedAttendance")}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* PDF Export Section */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-slate-500" />
                                    {t("exportAttendance")}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <PublicAttendanceExporter
                                    classroomId={classroom.id}
                                    lang={lang}
                                    translations={{
                                        attendance: t("attendance"),
                                        attendanceDescription: t("attendanceDescription"),
                                        week: t("week"),
                                        month: t("month"),
                                        pickDate: t("pickDate"),
                                        download: t("download"),
                                        downloading: t("downloading"),
                                        exportError: t("exportError"),
                                        noSessions: t("noSessions"),
                                    }}
                                />
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    )
}
