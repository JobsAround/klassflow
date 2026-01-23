import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { format } from "date-fns"
import { fr, enUS, de, es, pt, ru, uk } from "date-fns/locale"

export interface AttendanceData {
    organizationName: string
    classroomName: string
    teacherName: string
    startDate: Date
    endDate: Date
    range: string
    sessions: {
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
    }[]
    teacherTotalHours: number
    totalStudentHours: number
    totalExpectedStudentHours: number
}

// Translation maps for PDF text
const translations: Record<string, Record<string, string>> = {
    en: {
        title: "Attendance Sheet",
        organization: "Organization",
        period: "Period",
        from: "From",
        to: "to",
        week: "Week of",
        month: "Month of",
        training: "Training",
        teacherHours: "Teacher Hours",
        studentHours: "Student Hours",
        teacher: "Teacher",
        signature: "Signature",
        student: "Student",
        status: "Status",
        present: "Present",
        absent: "Absent",
        pending: "Pending",
        online: "Online",
        onsite: "On-site",
        homework: "Homework",
        notSpecified: "Not specified"
    },
    fr: {
        title: "Fiche de Présence",
        organization: "Organisme",
        period: "Période",
        from: "Du",
        to: "au",
        week: "Semaine du",
        month: "Mois de",
        training: "Formation",
        teacherHours: "Total Heures Formateur",
        studentHours: "Total Heures Stagiaires",
        teacher: "Formateur",
        signature: "Signature",
        student: "Apprenant",
        status: "Statut",
        present: "Présent",
        absent: "Absent",
        pending: "En attente",
        online: "En ligne",
        onsite: "Sur site",
        homework: "Travail personnel",
        notSpecified: "Non spécifié"
    },
    de: {
        title: "Anwesenheitsliste",
        organization: "Organisation",
        period: "Zeitraum",
        from: "Von",
        to: "bis",
        week: "Woche vom",
        month: "Monat",
        training: "Schulung",
        teacherHours: "Dozentenstunden",
        studentHours: "Teilnehmerstunden",
        teacher: "Dozent",
        signature: "Unterschrift",
        student: "Teilnehmer",
        status: "Status",
        present: "Anwesend",
        absent: "Abwesend",
        pending: "Ausstehend",
        online: "Online",
        onsite: "Vor Ort",
        homework: "Hausaufgabe",
        notSpecified: "Nicht angegeben"
    },
    es: {
        title: "Hoja de Asistencia",
        organization: "Organización",
        period: "Período",
        from: "Del",
        to: "al",
        week: "Semana del",
        month: "Mes de",
        training: "Formación",
        teacherHours: "Horas del Profesor",
        studentHours: "Horas de Estudiantes",
        teacher: "Profesor",
        signature: "Firma",
        student: "Estudiante",
        status: "Estado",
        present: "Presente",
        absent: "Ausente",
        pending: "Pendiente",
        online: "En línea",
        onsite: "Presencial",
        homework: "Tarea",
        notSpecified: "No especificado"
    },
    ru: {
        title: "Ведомость посещаемости",
        organization: "Организация",
        period: "Период",
        from: "С",
        to: "по",
        week: "Неделя с",
        month: "Месяц",
        training: "Обучение",
        teacherHours: "Часы преподавателя",
        studentHours: "Часы студентов",
        teacher: "Преподаватель",
        signature: "Подпись",
        student: "Студент",
        status: "Статус",
        present: "Присутствовал",
        absent: "Отсутствовал",
        pending: "Ожидание",
        online: "Онлайн",
        onsite: "На месте",
        homework: "Домашнее задание",
        notSpecified: "Не указано"
    },
    uk: {
        title: "Відомість відвідування",
        organization: "Організація",
        period: "Період",
        from: "З",
        to: "по",
        week: "Тиждень з",
        month: "Місяць",
        training: "Навчання",
        teacherHours: "Години викладача",
        studentHours: "Години студентів",
        teacher: "Викладач",
        signature: "Підпис",
        student: "Студент",
        status: "Статус",
        present: "Присутній",
        absent: "Відсутній",
        pending: "Очікування",
        online: "Онлайн",
        onsite: "На місці",
        homework: "Домашнє завдання",
        notSpecified: "Не вказано"
    },
    pt: {
        title: "Folha de Presença",
        organization: "Organização",
        period: "Período",
        from: "De",
        to: "a",
        week: "Semana de",
        month: "Mês de",
        training: "Formação",
        teacherHours: "Horas do Formador",
        studentHours: "Horas dos Formandos",
        teacher: "Formador",
        signature: "Assinatura",
        student: "Formando",
        status: "Estado",
        present: "Presente",
        absent: "Ausente",
        pending: "Pendente",
        online: "Online",
        onsite: "Presencial",
        homework: "Trabalho pessoal",
        notSpecified: "Não especificado"
    }
}

const dateLocaleMap: Record<string, any> = {
    en: enUS,
    fr: fr,
    de: de,
    es: es,
    pt: pt,
    ru: ru,
    uk: uk
}

export function generateAttendancePDF(data: AttendanceData, locale: string = 'fr') {
    const t = translations[locale] || translations.fr
    const dateLocale = dateLocaleMap[locale] || fr
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width
    let currentY = 20

    // --- Header ---
    doc.setFontSize(18)
    doc.text(t.title, 14, currentY)

    doc.setFontSize(12)
    const orgText = `${t.organization} : ${data.organizationName}`
    const orgWidth = doc.getTextWidth(orgText)
    doc.text(orgText, pageWidth - orgWidth - 14, currentY) // Right align

    currentY += 15

    // --- Info Block ---
    doc.setFontSize(11)

    // Period formatting
    const startDateStr = format(new Date(data.startDate), "dd/MM/yyyy")
    const endDateStr = format(new Date(data.endDate), "dd/MM/yyyy")
    let periodText = `${t.period} : ${t.from} ${startDateStr} ${t.to} ${endDateStr}`

    if (data.range === 'week') {
        periodText = `${t.period} : ${t.week} ${startDateStr} ${t.to} ${endDateStr}`
    } else if (data.range === 'month') {
        const monthYear = format(new Date(data.startDate), "MMMM yyyy", { locale: dateLocale })
        periodText = `${t.period} : ${t.month} ${monthYear}`
    }

    doc.text(`${t.training} : ${data.classroomName}`, 14, currentY)
    doc.text(periodText, 14, currentY + 6)

    doc.text(`${t.teacherHours} : ${data.teacherTotalHours.toFixed(1)}h`, 120, currentY)
    doc.text(`${t.studentHours} : ${data.totalStudentHours.toFixed(1)}h / ${data.totalExpectedStudentHours.toFixed(1)}h`, 120, currentY + 6)

    currentY += 20

    // --- Sessions Loop ---
    data.sessions.forEach((session, index) => {
        const sessionDate = new Date(session.startTime)
        const sessionEnd = new Date(session.endTime)
        const dateStr = format(sessionDate, "EEEE dd/MM/yyyy", { locale: dateLocale })
        const startStr = format(sessionDate, "HH:mm")
        const endStr = format(sessionEnd, "HH:mm")

        // Check for page break
        // Force page break for subsequent sessions to keep them intact
        if (index > 0) {
            doc.addPage()
            currentY = 20
        }

        // Session Header
        doc.setFillColor(240, 240, 240)
        doc.rect(14, currentY - 5, pageWidth - 28, 25, 'F') // Background box

        doc.setFontSize(12)
        doc.setFont("helvetica", "bold")

        // Get session type label
        let typeLabel = ""
        if (session.type === "ONLINE") {
            typeLabel = t.online
        } else if (session.type === "ONSITE") {
            typeLabel = t.onsite
        } else if (session.type === "HOMEWORK") {
            typeLabel = t.homework
        }

        // Display date/time with session type
        const headerText = typeLabel ? `${dateStr} ${startStr} à ${endStr} (${typeLabel})` : `${dateStr} ${startStr} à ${endStr}`
        doc.text(headerText, 18, currentY + 2)

        // Location (Right aligned with icon)
        // Translate common fallback location texts
        let locationText = session.location
        if (locationText === "Online") {
            locationText = t.online
        } else if (locationText === "On-site") {
            locationText = t.onsite
        } else if (locationText === "Not specified") {
            locationText = t.notSpecified
        }

        const locWidth = doc.getTextWidth(locationText)
        const locX = pageWidth - locWidth - 18

        doc.text(locationText, locX, currentY + 2)

        const isOnline = session.location.startsWith('http') || session.location.startsWith('www')

        doc.setFillColor(50, 50, 50)

        if (isOnline) {
            // Camera Icon
            const iconX = locX - 4
            const iconY = currentY - 2.5

            // Camera body
            doc.roundedRect(iconX - 3, iconY, 3, 2, 0.2, 0.2, 'F')
            // Lens triangle
            doc.triangle(
                iconX, iconY + 0.5,
                iconX, iconY + 1.5,
                iconX + 1, iconY + 2,
                'F'
            )
        } else {
            // Improved Pin Icon
            const iconX = locX - 3
            const iconY = currentY - 2

            // Pin head
            doc.circle(iconX, iconY, 1.2, 'F')
            // Pin point
            doc.triangle(
                iconX - 1.2, iconY,
                iconX + 1.2, iconY,
                iconX, iconY + 2.5,
                'F'
            )
            // Center hole (white)
            doc.setFillColor(255, 255, 255)
            doc.circle(iconX, iconY, 0.4, 'F')
        }

        doc.setFillColor(240, 240, 240) // Reset to background color if needed, or black for text
        doc.setTextColor(0, 0, 0) // Ensure text is black

        doc.setFontSize(11)
        doc.setFont("helvetica", "normal")
        doc.text(`${t.teacher} : ${session.teacherName || data.teacherName}`, 18, currentY + 12)

        // Teacher Signature Line
        doc.text(`${t.signature} :`, 100, currentY + 12)

        if (session.teacherSignature) {
            try {
                doc.addImage(session.teacherSignature, 'PNG', 125, currentY + 2, 40, 13)
            } catch (e) {
                // If invalid image, fallback to line
                doc.line(125, currentY + 12, 180, currentY + 12)
            }
        } else {
            doc.line(125, currentY + 12, 180, currentY + 12) // Line for signature
        }

        currentY += 25

        // Students Table
        const tableBody = session.students.map(student => [
            student.name,
            student.status === "PRESENT" ? t.present : (student.status === "ABSENT" ? t.absent : t.pending),
            "" // Placeholder
        ])

        const signatureMap = new Map<number, string | null>()
        session.students.forEach((s, i) => {
            if (s.signature && s.status === "PRESENT") {
                signatureMap.set(i, s.signature)
            }
        })

        autoTable(doc, {
            startY: currentY,
            head: [[t.student, t.status, t.signature]],
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185], halign: 'left' },
            columnStyles: {
                0: { cellWidth: 80 },
                1: { cellWidth: 40 },
                2: { cellWidth: 60, minCellHeight: 15 } // Taller for signature
            },
            margin: { left: 14, right: 14 },
            didDrawCell: (dataHook) => {
                if (dataHook.column.index === 2 && dataHook.cell.section === 'body') {
                    const signatureUrl = signatureMap.get(dataHook.row.index)
                    if (signatureUrl) {
                        try {
                            doc.addImage(signatureUrl, 'PNG', dataHook.cell.x + 2, dataHook.cell.y + 1, 40, 13)
                        } catch (e) {
                            // ignore
                        }
                    } else {
                        // Check status of mapping
                        const rowIndex = dataHook.row.index
                        const student = session.students[rowIndex]
                        if (student && student.status === "ABSENT") {
                            doc.setFontSize(9)
                            doc.setTextColor(150, 0, 0)
                            doc.text("N/A", dataHook.cell.x + 5, dataHook.cell.y + 10)
                            doc.setTextColor(0, 0, 0)
                        }
                    }
                }
            }
        })

        // Update currentY for next loop
        // @ts-ignore
        currentY = doc.lastAutoTable.finalY + 15
    })

    doc.save(`presence_${data.classroomName.replace(/\s+/g, '_')}_${format(new Date(), "yyyyMMdd")}.pdf`)
}
