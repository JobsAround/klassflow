"use client"

import React from 'react'
import {
    Document,
    Page,
    Text,
    View,
    Image,
    StyleSheet,
    pdf
} from '@react-pdf/renderer'
import { format, type Locale } from 'date-fns'
import { fr, enUS, de, es, pt, ru, uk } from 'date-fns/locale'

// Use Helvetica - built into @react-pdf/renderer, no external font loading needed

const colors = {
    primary: '#2563eb',
    primaryDark: '#1d4ed8',
    secondary: '#64748b',
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
    background: '#f8fafc',
    white: '#ffffff',
    border: '#e2e8f0',
    text: '#1e293b',
    textLight: '#64748b',
}

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Helvetica',
        fontSize: 10,
        color: colors.text,
        backgroundColor: colors.white,
    },
    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 30,
        paddingBottom: 20,
        borderBottomWidth: 2,
        borderBottomColor: colors.primary,
    },
    title: {
        fontSize: 24,
        fontFamily: 'Helvetica-Bold',
        color: colors.primary,
    },
    subtitle: {
        fontSize: 11,
        color: colors.textLight,
        marginTop: 4,
    },
    orgName: {
        fontSize: 12,
        fontFamily: 'Helvetica-Bold',
        textAlign: 'right',
        color: colors.text,
    },
    // Info cards
    infoRow: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 25,
    },
    infoCard: {
        flex: 1,
        backgroundColor: colors.background,
        padding: 15,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: colors.primary,
    },
    infoLabel: {
        fontSize: 9,
        color: colors.textLight,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 12,
        fontFamily: 'Helvetica-Bold',
        color: colors.text,
    },
    // Session
    sessionContainer: {
        marginBottom: 25,
    },
    sessionHeader: {
        backgroundColor: colors.primary,
        padding: 12,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sessionDate: {
        fontSize: 12,
        fontFamily: 'Helvetica-Bold',
        color: colors.white,
    },
    sessionType: {
        fontSize: 9,
        color: colors.white,
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
    },
    sessionInfo: {
        backgroundColor: colors.background,
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    teacherInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    teacherLabel: {
        fontSize: 9,
        color: colors.textLight,
    },
    teacherName: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
    },
    signatureBox: {
        width: 120,
        height: 40,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 4,
        backgroundColor: colors.white,
        justifyContent: 'center',
        alignItems: 'center',
    },
    signatureImage: {
        width: 115,
        height: 36,
        objectFit: 'contain',
    },
    // Table
    table: {
        borderWidth: 1,
        borderColor: colors.border,
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
        overflow: 'hidden',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    tableHeaderCell: {
        padding: 10,
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        color: colors.textLight,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    tableRowLast: {
        flexDirection: 'row',
    },
    tableCell: {
        padding: 10,
        fontSize: 10,
    },
    cellStudent: {
        flex: 3,
    },
    cellStatus: {
        flex: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cellStatusHeader: {
        flex: 1.5,
        textAlign: 'center',
    },
    cellSignature: {
        flex: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cellSignatureHeader: {
        flex: 2,
        textAlign: 'center',
    },
    // Status badges
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
    },
    statusPresent: {
        backgroundColor: '#dcfce7',
        color: '#166534',
    },
    statusAbsent: {
        backgroundColor: '#fee2e2',
        color: '#991b1b',
    },
    statusPending: {
        backgroundColor: '#fef3c7',
        color: '#92400e',
    },
    // Signature
    studentSignature: {
        width: 100,
        height: 35,
        objectFit: 'contain',
    },
    noSignature: {
        fontSize: 8,
        color: colors.textLight,
    },
    // Summary
    summary: {
        marginBottom: 25,
        flexDirection: 'row',
        gap: 15,
    },
    summaryCard: {
        flex: 1,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    summaryCardPrimary: {
        backgroundColor: colors.primary,
    },
    summaryCardSecondary: {
        backgroundColor: colors.secondary,
    },
    summaryLabel: {
        fontSize: 9,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 18,
        fontFamily: 'Helvetica-Bold',
        color: colors.white,
    },
    // Footer
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
        fontSize: 8,
        color: colors.textLight,
    },
})

// Translations
const translations: Record<string, Record<string, string>> = {
    en: {
        title: 'Attendance Sheet',
        training: 'Training',
        period: 'Period',
        teacher: 'Teacher',
        signature: 'Signature',
        student: 'Student',
        status: 'Status',
        present: 'Present',
        absent: 'Absent',
        pending: 'Pending',
        online: 'Online',
        onsite: 'On-site',
        homework: 'Homework',
        teacherHours: 'Teacher Hours',
        studentHours: 'Student Hours',
        page: 'Page',
        of: 'of',
    },
    fr: {
        title: 'Fiche de Présence',
        training: 'Formation',
        period: 'Période',
        teacher: 'Formateur',
        signature: 'Signature',
        student: 'Apprenant',
        status: 'Statut',
        present: 'Présent',
        absent: 'Absent',
        pending: 'En attente',
        online: 'En ligne',
        onsite: 'Sur site',
        homework: 'Travail personnel',
        teacherHours: 'Heures formateur',
        studentHours: 'Heures stagiaires',
        page: 'Page',
        of: 'sur',
    },
    de: {
        title: 'Anwesenheitsliste',
        training: 'Schulung',
        period: 'Zeitraum',
        teacher: 'Dozent',
        signature: 'Unterschrift',
        student: 'Teilnehmer',
        status: 'Status',
        present: 'Anwesend',
        absent: 'Abwesend',
        pending: 'Ausstehend',
        online: 'Online',
        onsite: 'Vor Ort',
        homework: 'Hausaufgabe',
        teacherHours: 'Dozentenstunden',
        studentHours: 'Teilnehmerstunden',
        page: 'Seite',
        of: 'von',
    },
    es: {
        title: 'Hoja de Asistencia',
        training: 'Formación',
        period: 'Período',
        teacher: 'Profesor',
        signature: 'Firma',
        student: 'Estudiante',
        status: 'Estado',
        present: 'Presente',
        absent: 'Ausente',
        pending: 'Pendiente',
        online: 'En línea',
        onsite: 'Presencial',
        homework: 'Tarea',
        teacherHours: 'Horas del profesor',
        studentHours: 'Horas de estudiantes',
        page: 'Página',
        of: 'de',
    },
    pt: {
        title: 'Folha de Presença',
        training: 'Formação',
        period: 'Período',
        teacher: 'Formador',
        signature: 'Assinatura',
        student: 'Formando',
        status: 'Estado',
        present: 'Presente',
        absent: 'Ausente',
        pending: 'Pendente',
        online: 'Online',
        onsite: 'Presencial',
        homework: 'Trabalho pessoal',
        teacherHours: 'Horas do formador',
        studentHours: 'Horas dos formandos',
        page: 'Página',
        of: 'de',
    },
    ru: {
        title: 'Ведомость посещаемости',
        training: 'Обучение',
        period: 'Период',
        teacher: 'Преподаватель',
        signature: 'Подпись',
        student: 'Студент',
        status: 'Статус',
        present: 'Присутствовал',
        absent: 'Отсутствовал',
        pending: 'Ожидание',
        online: 'Онлайн',
        onsite: 'На месте',
        homework: 'Домашнее задание',
        teacherHours: 'Часы преподавателя',
        studentHours: 'Часы студентов',
        page: 'Страница',
        of: 'из',
    },
    uk: {
        title: 'Відомість відвідування',
        training: 'Навчання',
        period: 'Період',
        teacher: 'Викладач',
        signature: 'Підпис',
        student: 'Студент',
        status: 'Статус',
        present: 'Присутній',
        absent: 'Відсутній',
        pending: 'Очікування',
        online: 'Онлайн',
        onsite: 'На місці',
        homework: 'Домашнє завдання',
        teacherHours: 'Години викладача',
        studentHours: 'Години студентів',
        page: 'Сторінка',
        of: 'з',
    },
}

const dateLocaleMap: Record<string, Locale> = {
    en: enUS,
    fr: fr,
    de: de,
    es: es,
    pt: pt,
    ru: ru,
    uk: uk,
}

export interface AttendanceSession {
    id: string
    startTime: string | Date
    endTime: string | Date
    type?: string
    teacherSignature?: string | null
    location: string
    teacherName?: string
    students: {
        name: string
        status: string
        signature: string | null
    }[]
}

export interface AttendanceData {
    organizationName: string
    classroomName: string
    teacherName: string
    startDate: Date
    endDate: Date
    range: string
    sessions: AttendanceSession[]
    teacherTotalHours: number
    totalStudentHours: number
    totalExpectedStudentHours: number
}

interface StatusBadgeProps {
    status: string
    t: Record<string, string>
}

const StatusBadge = ({ status, t }: StatusBadgeProps) => {
    const getStatusStyle = () => {
        switch (status) {
            case 'PRESENT':
                return styles.statusPresent
            case 'ABSENT':
                return styles.statusAbsent
            default:
                return styles.statusPending
        }
    }

    const getStatusText = () => {
        switch (status) {
            case 'PRESENT':
                return t.present
            case 'ABSENT':
                return t.absent
            default:
                return t.pending
        }
    }

    return (
        <Text style={[styles.statusBadge, getStatusStyle()]}>
            {getStatusText()}
        </Text>
    )
}

interface SessionProps {
    session: AttendanceSession
    defaultTeacherName: string
    t: Record<string, string>
    dateLocale: Locale
}

const Session = ({ session, defaultTeacherName, t, dateLocale }: SessionProps) => {
    const sessionDate = new Date(session.startTime)
    const sessionEnd = new Date(session.endTime)
    const dateStr = format(sessionDate, "EEEE dd MMMM yyyy", { locale: dateLocale })
    const timeStr = `${format(sessionDate, "HH:mm")} - ${format(sessionEnd, "HH:mm")}`

    const getTypeLabel = () => {
        switch (session.type) {
            case 'ONLINE':
                return t.online
            case 'ONSITE':
                return t.onsite
            case 'HOMEWORK':
                return t.homework
            default:
                return ''
        }
    }

    return (
        <View style={styles.sessionContainer}>
            {/* Session Header */}
            <View style={styles.sessionHeader}>
                <View>
                    <Text style={styles.sessionDate}>{dateStr}</Text>
                    <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>
                        {timeStr}
                    </Text>
                </View>
                {session.type && (
                    <Text style={styles.sessionType}>{getTypeLabel()}</Text>
                )}
            </View>

            {/* Teacher Info */}
            <View style={styles.sessionInfo}>
                <View style={styles.teacherInfo}>
                    <Text style={styles.teacherLabel}>{t.teacher}:</Text>
                    <Text style={styles.teacherName}>{session.teacherName || defaultTeacherName}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.teacherLabel}>{t.signature}:</Text>
                    <View style={styles.signatureBox}>
                        {session.teacherSignature ? (
                            <Image src={session.teacherSignature} style={styles.signatureImage} />
                        ) : null}
                    </View>
                </View>
            </View>

            {/* Students Table */}
            <View style={styles.table}>
                <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderCell, styles.cellStudent]}>{t.student}</Text>
                    <Text style={[styles.tableHeaderCell, styles.cellStatusHeader]}>{t.status}</Text>
                    <Text style={[styles.tableHeaderCell, styles.cellSignatureHeader]}>{t.signature}</Text>
                </View>
                {session.students.map((student, idx) => (
                    <View
                        key={idx}
                        style={idx === session.students.length - 1 ? styles.tableRowLast : styles.tableRow}
                    >
                        <Text style={[styles.tableCell, styles.cellStudent]}>{student.name}</Text>
                        <View style={[styles.tableCell, styles.cellStatus]}>
                            <StatusBadge status={student.status} t={t} />
                        </View>
                        <View style={[styles.tableCell, styles.cellSignature]}>
                            {student.signature && student.status === 'PRESENT' ? (
                                <Image src={student.signature} style={styles.studentSignature} />
                            ) : student.status === 'ABSENT' ? (
                                <Text style={styles.noSignature}>N/A</Text>
                            ) : (
                                <Text style={styles.noSignature}>—</Text>
                            )}
                        </View>
                    </View>
                ))}
            </View>
        </View>
    )
}

interface AttendancePDFProps {
    data: AttendanceData
    locale?: string
}

const AttendancePDF = ({ data, locale = 'fr' }: AttendancePDFProps) => {
    const t = translations[locale] || translations.fr
    const dateLocale = dateLocaleMap[locale] || fr

    const startDateStr = format(new Date(data.startDate), "dd/MM/yyyy")
    const endDateStr = format(new Date(data.endDate), "dd/MM/yyyy")

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>{t.title}</Text>
                        <Text style={styles.subtitle}>{data.classroomName}</Text>
                    </View>
                    <Text style={styles.orgName}>{data.organizationName}</Text>
                </View>

                {/* Info Cards */}
                <View style={styles.infoRow}>
                    <View style={styles.infoCard}>
                        <Text style={styles.infoLabel}>{t.training}</Text>
                        <Text style={styles.infoValue}>{data.classroomName}</Text>
                    </View>
                    <View style={styles.infoCard}>
                        <Text style={styles.infoLabel}>{t.period}</Text>
                        <Text style={styles.infoValue}>{startDateStr} - {endDateStr}</Text>
                    </View>
                    <View style={styles.infoCard}>
                        <Text style={styles.infoLabel}>{t.teacher}</Text>
                        <Text style={styles.infoValue}>{data.teacherName}</Text>
                    </View>
                </View>

                {/* Summary - at the top */}
                <View style={styles.summary}>
                    <View style={[styles.summaryCard, styles.summaryCardPrimary]}>
                        <Text style={styles.summaryLabel}>{t.teacherHours}</Text>
                        <Text style={styles.summaryValue}>{data.teacherTotalHours.toFixed(1)}h</Text>
                    </View>
                    <View style={[styles.summaryCard, styles.summaryCardSecondary]}>
                        <Text style={styles.summaryLabel}>{t.studentHours}</Text>
                        <Text style={styles.summaryValue}>
                            {data.totalStudentHours.toFixed(1)}h / {data.totalExpectedStudentHours.toFixed(1)}h
                        </Text>
                    </View>
                </View>

                {/* Sessions */}
                {data.sessions.map((session, idx) => (
                    <Session
                        key={session.id || idx}
                        session={session}
                        defaultTeacherName={data.teacherName}
                        t={t}
                        dateLocale={dateLocale}
                    />
                ))}

                {/* Footer */}
                <View style={styles.footer} fixed>
                    <Text>KlassFlow</Text>
                    <Text render={({ pageNumber, totalPages }) => `${t.page} ${pageNumber} ${t.of} ${totalPages}`} />
                </View>
            </Page>
        </Document>
    )
}

export async function generateAttendancePDFv2(data: AttendanceData, locale: string = 'fr'): Promise<void> {
    const blob = await pdf(<AttendancePDF data={data} locale={locale} />).toBlob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `presence_${data.classroomName.replace(/\s+/g, '_')}_${format(new Date(), "yyyyMMdd")}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

export { AttendancePDF }
