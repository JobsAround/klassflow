"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useTranslations } from 'next-intl'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ChevronLeft, Loader2 } from "lucide-react"
import { LanguageSelector } from "@/components/layout/language-selector"
import SignatureCanvas from "@/components/signature/signature-canvas"

export default function AbsencePage() {
    const params = useParams()
    const router = useRouter()
    const token = params.token as string
    const t = useTranslations('signature')

    const [submitting, setSubmitting] = useState(false)
    const [reason, setReason] = useState("")
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)
    const [missedSessions, setMissedSessions] = useState<any[]>([])
    const [organizationName, setOrganizationName] = useState<string>("")
    const [signingSessionId, setSigningSessionId] = useState<string | null>(null)
    const missedSessionSignatureRef = useRef<any>(null)

    const handleSubmit = async () => {
        if (!reason.trim()) {
            setError("Veuillez indiquer un motif")
            return
        }

        setSubmitting(true)
        setError("")

        try {
            const res = await fetch(`/api/signature/${token}/absence`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason })
            })

            if (!res.ok) {
                throw new Error("Failed to submit absence")
            }

            const data = await res.json()
            setMissedSessions(data.missedSessions || [])
            if (data.organizationName) setOrganizationName(data.organizationName)
            setSuccess(true)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setSubmitting(false)
        }
    }

    const handleSignMissedSession = async (session: any) => {
        if (!missedSessionSignatureRef.current) return

        const signatureData = missedSessionSignatureRef.current.toDataURL()
        if (!signatureData || signatureData === missedSessionSignatureRef.current.getEmptyDataURL()) {
            alert(t("pleaseSign"))
            return
        }

        setSubmitting(true)
        try {
            const res = await fetch(`/api/signature/${session.token}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ signatureData })
            })

            if (!res.ok) throw new Error("Failed to sign")

            // Mark as signed
            setMissedSessions(prev =>
                prev.map(s => s.id === session.id ? { ...s, signed: true } : s)
            )
            setSigningSessionId(null)
        } catch (err) {
            console.error(err)
        } finally {
            setSubmitting(false)
        }
    }

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

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 py-8 px-4">
                <div className="max-w-2xl mx-auto space-y-6">
                    <div className="flex justify-end relative z-10">
                        <LanguageSelector />
                    </div>

                    <Card className="w-full">
                        <CardHeader>
                            <CardTitle className="text-green-600">✓ Absence enregistrée</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <p className="text-gray-700">
                                    Votre déclaration d'absence {organizationName ? `pour ${organizationName} ` : ""}a bien été transmise à l'administration et à votre enseignant.
                                </p>
                                <p className="text-sm text-gray-500">Merci de votre prévenance.</p>
                            </div>

                            {missedSessions.length > 0 && (
                                <div className="border-t pt-4">
                                    <h3 className="font-semibold text-lg mb-2 text-amber-700">{t("missedSessionsTitle")}</h3>
                                    <p className="text-sm text-gray-600 mb-4">{t("missedSessionsDescription")}</p>

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
                                                        ✓ {t("signed")}
                                                    </Button>
                                                ) : (
                                                    <div className="flex gap-2">
                                                        <Dialog open={signingSessionId === session.id} onOpenChange={(open) => setSigningSessionId(open ? session.id : null)}>
                                                            <DialogTrigger asChild>
                                                                <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
                                                                    {t("signButton")}
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent>
                                                                <DialogHeader>
                                                                    <DialogTitle>{t("title")}</DialogTitle>
                                                                </DialogHeader>
                                                                <div className="space-y-4 py-4">
                                                                    <div className="bg-gray-50 p-3 rounded text-sm">
                                                                        <p><strong>{t("date")}:</strong> {formatDate(session.startTime)}</p>
                                                                        <p><strong>{t("schedule")}:</strong> {formatTime(session.startTime)} - {formatTime(session.endTime)}</p>
                                                                    </div>

                                                                    <div>
                                                                        <label className="text-sm font-medium mb-2 block">{t("yourSignature")}</label>
                                                                        <SignatureCanvas ref={missedSessionSignatureRef} />
                                                                    </div>

                                                                    <Button
                                                                        onClick={() => handleSignMissedSession(session)}
                                                                        disabled={submitting}
                                                                        className="w-full"
                                                                    >
                                                                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                                        {t("confirmPresence")}
                                                                    </Button>
                                                                </div>
                                                            </DialogContent>
                                                        </Dialog>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => router.push(`/signature/${session.token}/absence`)}
                                                            className="border-gray-300"
                                                        >
                                                            {t("declareAbsence")}
                                                        </Button>
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
            <div className="max-w-md mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <Button variant="ghost" onClick={() => router.back()}>
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Retour
                    </Button>
                    <div className="relative z-10">
                        <LanguageSelector />
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Déclarer une absence</CardTitle>
                        <CardDescription>
                            Veuillez justifier votre absence pour ce cours.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="reason">Motif de l'absence *</Label>
                            <Textarea
                                id="reason"
                                placeholder="Maladie, empêchement..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                disabled={submitting}
                                rows={4}
                            />
                        </div>

                        {error && (
                            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                                {error}
                            </div>
                        )}

                        <Button
                            onClick={handleSubmit}
                            disabled={!reason.trim() || submitting}
                            className="w-full"
                            variant="destructive"
                        >
                            {submitting ? "Envoi en cours..." : "Confirmer mon absence"}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
