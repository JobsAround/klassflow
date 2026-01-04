"use client"

import { useState, useRef } from "react"
import { Loader2 } from "lucide-react"
import SignatureCanvas, { SignatureCanvasHandle } from "@/components/signature/signature-canvas"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export interface SignatureSessionData {
    student: {
        id: string
        name: string
        email: string
    }
    session: {
        id: string
        title: string | null
        startTime: string
        endTime: string
        classroom: {
            name: string
            organization?: {
                name: string
            }
        }
    }
    signed?: boolean
    missedSessions?: MissedSession[]
}

export interface MissedSession {
    id: string
    title: string | null
    classroomName: string
    startTime: string
    endTime: string
    token: string
    signed?: boolean
}

export interface SignatureFlowProps {
    sessionData: SignatureSessionData
    onSubmitSignature: (signatureData: string) => Promise<{ success: boolean; missedSessions?: MissedSession[]; error?: string }>
    onSignMissedSession?: (token: string, signatureData: string) => Promise<{ success: boolean; error?: string }>
    onDeclareAbsence?: (token: string) => void
    translations?: Partial<{
        title: string
        student: string
        date: string
        schedule: string
        duration: string
        yourSignature: string
        signPrompt: string
        confirmPresence: string
        sending: string
        or: string
        declareAbsence: string
        error: string
        loading: string
        signatureRecorded: string
        presenceRecorded: string
        thankYou: string
        missedSessionsTitle: string
        missedSessionsDescription: string
        signButton: string
        signed: string
    }>
}

const defaultTranslations = {
    title: "Signature de présence",
    student: "Stagiaire",
    date: "Date",
    schedule: "Horaire",
    duration: "Durée",
    yourSignature: "Votre signature",
    signPrompt: "Signez dans la zone ci-dessus",
    confirmPresence: "Confirmer ma présence",
    sending: "Envoi en cours...",
    or: "ou",
    declareAbsence: "Déclarer une absence",
    error: "Erreur",
    loading: "Chargement...",
    signatureRecorded: "Signature enregistrée",
    presenceRecorded: "Votre présence a été enregistrée pour",
    thankYou: "Merci !",
    missedSessionsTitle: "Sessions manquées",
    missedSessionsDescription: "Vous pouvez également signer pour ces sessions passées",
    signButton: "Signer",
    signed: "Signé"
}

export function SignatureFlow({
    sessionData,
    onSubmitSignature,
    onSignMissedSession,
    onDeclareAbsence,
    translations = {}
}: SignatureFlowProps) {
    const t = { ...defaultTranslations, ...translations }

    const signatureRef = useRef<SignatureCanvasHandle>(null)
    const missedSessionSignatureRef = useRef<SignatureCanvasHandle>(null)

    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(sessionData.signed || false)
    const [missedSessions, setMissedSessions] = useState<MissedSession[]>(sessionData.missedSessions || [])
    const [signingSessionId, setSigningSessionId] = useState<string | null>(null)

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("fr-FR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        })
    }

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit"
        })
    }

    const calculateDuration = (startStr: string, endStr: string) => {
        const start = new Date(startStr)
        const end = new Date(endStr)
        const minutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60))
        return `${minutes} min`
    }

    const handleSubmit = async () => {
        const signatureData = signatureRef.current?.getData()

        if (!signatureData || signatureRef.current?.isEmpty) {
            setError(t.yourSignature + " required")
            return
        }

        setSubmitting(true)
        setError("")

        try {
            const result = await onSubmitSignature(signatureData)
            if (!result.success) {
                throw new Error(result.error || t.error)
            }
            if (result.missedSessions) {
                setMissedSessions(result.missedSessions)
            }
            setSuccess(true)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setSubmitting(false)
        }
    }

    const handleSignMissedSession = async (session: MissedSession) => {
        if (!onSignMissedSession) return

        const signatureData = missedSessionSignatureRef.current?.getData()
        if (!signatureData || missedSessionSignatureRef.current?.isEmpty) return

        setSubmitting(true)

        try {
            const result = await onSignMissedSession(session.token, signatureData)
            if (result.success) {
                setMissedSessions(prev =>
                    prev.map(s => s.id === session.id ? { ...s, signed: true } : s)
                )
                setSigningSessionId(null)
            }
        } catch (err) {
            console.error(err)
        } finally {
            setSubmitting(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 py-8 px-4">
                <div className="max-w-2xl mx-auto space-y-6">
                    <Card className="w-full">
                        <CardHeader>
                            <CardTitle className="text-green-600">✓ {t.signatureRecorded}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <p className="text-gray-700">
                                    {t.presenceRecorded}{" "}
                                    <strong>{sessionData.session.classroom.name}</strong>
                                    {sessionData.session.classroom.organization?.name && (
                                        <span> ({sessionData.session.classroom.organization.name})</span>
                                    )}.
                                </p>
                                <p className="text-sm text-gray-500">{t.thankYou}</p>
                            </div>

                            {missedSessions.length > 0 && (
                                <div className="border-t pt-4">
                                    <h3 className="font-semibold text-lg mb-2 text-amber-700">{t.missedSessionsTitle}</h3>
                                    <p className="text-sm text-gray-600 mb-4">{t.missedSessionsDescription}</p>

                                    <div className="space-y-3">
                                        {missedSessions.map(session => (
                                            <div key={session.id} className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <div>
                                                    <p className="font-medium text-amber-900">{session.title || session.classroomName}</p>
                                                    <p className="text-xs text-amber-800">
                                                        {formatDate(session.startTime)} • {formatTime(session.startTime)}
                                                    </p>
                                                </div>

                                                {session.signed ? (
                                                    <Button variant="outline" className="text-green-600 border-green-200 bg-green-50" disabled>
                                                        ✓ {t.signed}
                                                    </Button>
                                                ) : (
                                                    <div className="flex gap-2">
                                                        <Dialog open={signingSessionId === session.id} onOpenChange={(open) => setSigningSessionId(open ? session.id : null)}>
                                                            <DialogTrigger asChild>
                                                                <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
                                                                    {t.signButton}
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent>
                                                                <DialogHeader>
                                                                    <DialogTitle>{t.title}</DialogTitle>
                                                                </DialogHeader>
                                                                <div className="space-y-4 py-4">
                                                                    <div className="bg-gray-50 p-3 rounded text-sm">
                                                                        <p><strong>{t.date}:</strong> {formatDate(session.startTime)}</p>
                                                                        <p><strong>{t.schedule}:</strong> {formatTime(session.startTime)} - {formatTime(session.endTime)}</p>
                                                                    </div>

                                                                    <div>
                                                                        <label className="text-sm font-medium mb-2 block">{t.yourSignature}</label>
                                                                        <SignatureCanvas ref={missedSessionSignatureRef} />
                                                                    </div>

                                                                    <Button
                                                                        onClick={() => handleSignMissedSession(session)}
                                                                        disabled={submitting}
                                                                        className="w-full"
                                                                    >
                                                                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                                        {t.confirmPresence}
                                                                    </Button>
                                                                </div>
                                                            </DialogContent>
                                                        </Dialog>
                                                        {onDeclareAbsence && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => onDeclareAbsence(session.token)}
                                                                className="border-gray-300"
                                                            >
                                                                {t.declareAbsence}
                                                            </Button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-2xl mx-auto space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>{t.title}</CardTitle>
                        <CardDescription>
                            {sessionData.session.classroom.name}
                            {sessionData.session.title && ` - ${sessionData.session.title}`}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-sm text-blue-900">
                                <strong>{t.student}:</strong> {sessionData.student.name}
                            </p>
                            <p className="text-sm text-blue-900">
                                <strong>{t.date}:</strong> {formatDate(sessionData.session.startTime)}
                            </p>
                            <p className="text-sm text-blue-900">
                                <strong>{t.schedule}:</strong> {formatTime(sessionData.session.startTime)} - {formatTime(sessionData.session.endTime)}
                            </p>
                            <p className="text-sm text-blue-900">
                                <strong>{t.duration}:</strong> {calculateDuration(sessionData.session.startTime, sessionData.session.endTime)}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t.yourSignature} *</label>
                            <SignatureCanvas ref={signatureRef} />
                            <p className="text-xs text-muted-foreground">{t.signPrompt}</p>
                        </div>

                        {error && (
                            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                                {error}
                            </div>
                        )}

                        <Button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="w-full"
                            size="lg"
                        >
                            {submitting ? t.sending : t.confirmPresence}
                        </Button>

                        {onDeclareAbsence && (
                            <>
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-white px-2 text-muted-foreground">{t.or}</span>
                                    </div>
                                </div>

                                <Button
                                    variant="outline"
                                    onClick={() => onDeclareAbsence("")}
                                    className="w-full"
                                    disabled={submitting}
                                >
                                    {t.declareAbsence}
                                </Button>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
