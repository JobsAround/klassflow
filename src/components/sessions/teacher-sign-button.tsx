"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { PenTool, Send, Check } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import SignatureCanvas, { SignatureCanvasHandle } from "@/components/signature/signature-canvas"
import { useTranslations } from 'next-intl'
import { Label } from "@/components/ui/label"

interface TeacherSignButtonProps {
    sessionId: string
    teacherId: string
    teacherName?: string | null
    teachers?: { id: string; name: string | null; email: string }[]
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
    size?: "default" | "sm" | "lg" | "icon"
    hasSigned?: boolean
    onSuccess?: () => void
}

export function TeacherSignButton({
    sessionId,
    teacherId,
    teacherName,
    teachers = [],
    variant = "outline",
    size = "sm",
    hasSigned = false,
    onSuccess
}: TeacherSignButtonProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const t = useTranslations('session')
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)
    const [selectedTeacherId, setSelectedTeacherId] = useState<string>(teacherId)
    const signatureRef = useRef<SignatureCanvasHandle>(null)

    // Auto-open dialog if query param matches
    useEffect(() => {
        const signSessionId = searchParams.get('signSessionId')
        if (signSessionId === sessionId && !hasSigned) {
            setOpen(true)
        }
    }, [searchParams, sessionId, hasSigned])

    const handleSubmit = async () => {
        const signatureData = signatureRef.current?.getData()
        if (!signatureData) return

        setLoading(true)
        try {
            const res = await fetch(`/api/sessions/${sessionId}/sign`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    studentId: teacherId, // Signing as Current User
                    signatureData
                })
            })

            if (!res.ok) throw new Error("Failed to sign")

            setOpen(false)
            if (onSuccess) onSuccess()
            else router.refresh()
        } catch (error) {
            console.error(error)
            alert("Failed to save signature.")
        } finally {
            setLoading(false)
        }
    }

    const handleRequest = async () => {
        if (!selectedTeacherId) return

        setLoading(true)
        try {
            const res = await fetch(`/api/sessions/${sessionId}/request-signature`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ teacherId: selectedTeacherId })
            })

            if (!res.ok) throw new Error("Failed to send request")

            setOpen(false)
            alert("Email sent successfully!")
        } catch (error) {
            console.error(error)
            alert("Failed to send email.")
        } finally {
            setLoading(false)
        }
    }

    const handleClear = () => {
        signatureRef.current?.clear()
    }

    const handleSignClick = () => {
        if (hasSigned) {
            if (!confirm("You have already signed this session. Do you want to sign again?")) {
                return
            }
        }
        setOpen(true)
    }

    return (
        <>
            <Button
                variant={hasSigned ? "ghost" : variant}
                size={size}
                onClick={handleSignClick}
                title={hasSigned ? "Signed (Click to re-sign)" : "Sign / Request"}
                className={hasSigned ? "text-green-600 font-medium hover:text-green-700 hover:bg-green-50" : ""}
            >
                {hasSigned ? (
                    <Check className="w-4 h-4 mr-2" />
                ) : (
                    <PenTool className="w-4 h-4 mr-2" />
                )}
                Signature formateur
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Teacher Signature</DialogTitle>
                    </DialogHeader>

                    <Tabs defaultValue="sign">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="sign">Sign as {teacherName || "Teacher"}</TabsTrigger>
                            <TabsTrigger value="request">Request by Email</TabsTrigger>
                        </TabsList>

                        <TabsContent value="sign" className="space-y-4">
                            <div className="border rounded p-4 bg-white mt-4">
                                <SignatureCanvas ref={signatureRef} />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={handleClear}>Clear</Button>
                                <Button onClick={handleSubmit} disabled={loading}>
                                    {loading ? "Signing..." : "Confirm Signature"}
                                </Button>
                            </div>
                        </TabsContent>

                        <TabsContent value="request" className="space-y-4">
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Select Teacher</Label>
                                    <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select a teacher" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {teachers.map(t => (
                                                <SelectItem key={t.id} value={t.id}>
                                                    {t.name || t.email}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-sm text-slate-500">
                                        Sends an email with a link to sign this session.
                                    </p>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <Button onClick={handleRequest} disabled={loading || !selectedTeacherId}>
                                    <Send className="w-4 h-4 mr-2" />
                                    {loading ? "Sending..." : "Send Request"}
                                </Button>
                            </div>
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>
        </>
    )
}
