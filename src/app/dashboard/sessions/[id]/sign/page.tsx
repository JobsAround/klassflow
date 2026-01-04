"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import SignatureCanvas from "@/components/signature/signature-canvas"
import { Lock, Unlock, ChevronLeft, CheckCircle, XCircle, Clock } from "lucide-react"
import { ResendEmailButton } from "@/components/sessions/resend-email-button"

interface Student {
    id: string
    name: string
    email: string
    signed: boolean
    status: "SIGNED" | "ABSENT" | "NONE"
}

export default function DeviceSharingPage() {
    const params = useParams()
    const router = useRouter()
    const sessionId = params.id as string

    const [loading, setLoading] = useState(true)
    const [students, setStudents] = useState<Student[]>([])
    const [sessionTitle, setSessionTitle] = useState("")
    const [isLocked, setIsLocked] = useState(false)
    const [pin, setPin] = useState("")
    const [inputPin, setInputPin] = useState("")
    const [showPinDialog, setShowPinDialog] = useState(false)
    const [showUnlockDialog, setShowUnlockDialog] = useState(false)
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
    const [signatureData, setSignatureData] = useState("")
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        fetchSessionData()
    }, [sessionId])

    const fetchSessionData = async () => {
        try {
            const res = await fetch(`/api/sessions/${sessionId}/students`)
            if (!res.ok) throw new Error("Failed to fetch session")
            const data = await res.json()
            setStudents(data.students)
            setSessionTitle(data.title)
            // If session has a PIN set, we might want to know? 
            // But for security, maybe we set it locally for the session?
            // Requirement: "configuré lors de la création".
            // If it's in DB, we verify against DB.
            // But here "Start Sharing" blocks the interface.
            // If we rely on DB PIN, we need to verify it via API.
            // Let's assume we verify PIN via API when unlocking.
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleLock = () => {
        if (!pin) {
            setShowPinDialog(true)
        } else {
            setIsLocked(true)
        }
    }

    const confirmLock = () => {
        if (inputPin.length < 4) return
        setPin(inputPin)
        setIsLocked(true)
        setShowPinDialog(false)
        setInputPin("")
    }

    const handleUnlock = async () => {
        // Verify PIN
        // If we set it locally:
        if (inputPin === pin) {
            setIsLocked(false)
            setShowUnlockDialog(false)
            setInputPin("")
        } else {
            alert("Incorrect PIN")
        }
    }

    const handleStudentClick = (student: Student) => {
        if (student.signed) return
        setSelectedStudent(student)
        setSignatureData("")
    }

    const handleSignatureSave = (data: string) => {
        setSignatureData(data)
    }

    const handleSubmitSignature = async () => {
        if (!selectedStudent || !signatureData) return
        setSubmitting(true)
        try {
            const res = await fetch(`/api/sessions/${sessionId}/sign`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    studentId: selectedStudent.id,
                    signatureData
                })
            })

            if (!res.ok) throw new Error("Failed to sign")

            // Update local state
            setStudents(students.map(s =>
                s.id === selectedStudent.id ? { ...s, signed: true } : s
            ))
            setSelectedStudent(null)
        } catch (error) {
            console.error(error)
            alert("Failed to save signature")
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return <div className="p-8">Loading...</div>

    if (selectedStudent) {
        return (
            <div className="min-h-screen bg-gray-50 p-4 flex flex-col items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Sign for {selectedStudent.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="border rounded p-4 bg-white">
                            <SignatureCanvas onSave={handleSignatureSave} />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setSelectedStudent(null)}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmitSignature}
                                disabled={!signatureData || submitting}
                                className="flex-1"
                            >
                                {submitting ? "Saving..." : "Confirm"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className={`min-h-screen bg-gray-50 ${isLocked ? "p-4" : "p-8"}`}>
            {!isLocked && (
                <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" onClick={() => router.back()}>
                            <ChevronLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                        <h1 className="text-2xl font-bold">{sessionTitle} - Signatures</h1>
                    </div>
                    <Button onClick={handleLock}>
                        <Lock className="w-4 h-4 mr-2" />
                        Device Sharing (Lock)
                    </Button>
                </div>
            )}

            {isLocked && (
                <div className="flex justify-end mb-4">
                    <Button variant="outline" size="sm" onClick={() => setShowUnlockDialog(true)}>
                        <Unlock className="w-4 h-4 mr-2" />
                        Unlock Teacher Interface
                    </Button>
                </div>
            )}

            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {students.map(student => (
                    <Card
                        key={student.id}
                        className={`cursor-pointer transition-colors ${student.status === "SIGNED" ? "bg-green-50 border-green-200" :
                            student.status === "ABSENT" ? "bg-red-50 border-red-200" :
                                "hover:bg-blue-50"
                            }`}
                        onClick={() => handleStudentClick(student)}
                    >
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="font-medium">{student.name}</p>
                                <p className="text-sm text-slate-500">{student.email}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <ResendEmailButton sessionId={sessionId} studentId={student.id} />
                                {student.status === "SIGNED" && (
                                    <div className="flex items-center text-green-600">
                                        <CheckCircle className="w-5 h-5 mr-1" />
                                        <span className="text-sm font-medium">Signed</span>
                                    </div>
                                )}
                                {student.status === "ABSENT" && (
                                    <div className="flex items-center text-red-600">
                                        <XCircle className="w-5 h-5 mr-1" />
                                        <span className="text-sm font-medium">Absent</span>
                                    </div>
                                )}
                                {student.status === "NONE" && (
                                    <div className="flex items-center text-slate-400">
                                        <Clock className="w-5 h-5 mr-1" />
                                        <span className="text-sm">Pending</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* PIN Dialog to Lock */}
            <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Set Session PIN</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Label>Enter a PIN to lock the interface</Label>
                        <Input
                            type="password"
                            value={inputPin}
                            onChange={e => setInputPin(e.target.value)}
                            maxLength={4}
                            className="mt-2 text-center text-2xl tracking-widest"
                        />
                    </div>
                    <DialogFooter>
                        <Button onClick={confirmLock}>Lock Interface</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Unlock Dialog */}
            <Dialog open={showUnlockDialog} onOpenChange={setShowUnlockDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Unlock Interface</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Label>Enter PIN</Label>
                        <Input
                            type="password"
                            value={inputPin}
                            onChange={e => setInputPin(e.target.value)}
                            maxLength={4}
                            className="mt-2 text-center text-2xl tracking-widest"
                        />
                    </div>
                    <DialogFooter>
                        <Button onClick={handleUnlock}>Unlock</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
