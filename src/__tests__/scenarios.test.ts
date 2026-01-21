import { describe, it, expect, vi, beforeEach } from 'vitest'
import { authConfig } from '../auth.config'
import { POST as resendSignature } from '../app/api/sessions/[id]/resend-signature/route'
import { POST as signSession } from '../app/api/sessions/[id]/sign/route'
import { PATCH as updateSettings } from '../app/api/classrooms/[id]/settings/route'
import { prisma } from '../lib/prisma'
import { sendSignatureEmail, sendAdminNotificationEmail, sendTeacherSignatureRequestEmail } from '../lib/email'

// Mock Prisma
vi.mock('../lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
            findMany: vi.fn(),
        },
        classSession: {
            findUnique: vi.fn(),
            findMany: vi.fn(),
        },
        signatureToken: {
            findFirst: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
        attendance: {
            upsert: vi.fn(),
        },
        classroom: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
        organization: {
            findUnique: vi.fn(),
        }
    }
}))

// Mock Email
vi.mock('../lib/email', () => ({
    sendSignatureEmail: vi.fn(),
    sendAdminNotificationEmail: vi.fn(),
    sendTeacherSignatureRequestEmail: vi.fn(),
    getEmailTransport: vi.fn(),
}))

// Mock Auth
vi.mock('@/auth', () => ({
    auth: vi.fn(),
}))

// Mock RateLimit
vi.mock('../lib/ratelimit', () => ({
    rateLimit: vi.fn().mockResolvedValue({ success: true }),
}))

describe('Scenario Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('Authentication', () => {
        it('should block STUDENT role', async () => {
            const user = { role: 'STUDENT', emailVerified: new Date() }
            const result = await authConfig.callbacks?.signIn?.({ user } as any)
            expect(result).toBe(false)
        })

        it('should block unverified email', async () => {
            const user = { role: 'TEACHER', emailVerified: null }
            const result = await authConfig.callbacks?.signIn?.({ user } as any)
            expect(result).toBe(false)
        })

        it('should allow verified TEACHER', async () => {
            const user = { role: 'TEACHER', emailVerified: new Date() }
            const result = await authConfig.callbacks?.signIn?.({ user } as any)
            expect(result).toBe(true)
        })
    })

    describe('Email System - Force Resend', () => {
        it('should resend email and update token', async () => {
            const mockSession = {
                id: 'session-1',
                startTime: new Date(),
                classroom: {
                    name: 'Class A',
                    organizationId: 'org-1'
                }
            }
            const mockStudent = {
                id: 'student-1',
                name: 'Student A',
                email: 'student@test.com'
            }

            vi.mocked(prisma.classSession.findUnique).mockResolvedValue(mockSession as any)
            vi.mocked(prisma.user.findUnique).mockResolvedValue(mockStudent as any)
            vi.mocked(prisma.signatureToken.findFirst).mockResolvedValue(null)
            vi.mocked(prisma.signatureToken.create).mockResolvedValue({ token: 'new-token' } as any)

            const req = new Request('http://localhost/api/sessions/session-1/resend-signature', {
                method: 'POST',
                body: JSON.stringify({ studentId: 'student-1' })
            })

            // Mock auth session
            const { auth } = await import('@/auth')
            vi.mocked(auth).mockResolvedValue({ user: { role: 'TEACHER', organizationId: 'org-1' } } as any)

            const res = await resendSignature(req, { params: { id: 'session-1' } })

            expect(res.status).toBe(200)
            expect(prisma.signatureToken.create).toHaveBeenCalled()
            expect(sendSignatureEmail).toHaveBeenCalledWith(
                'org-1',
                'student@test.com',
                'Student A',
                expect.stringContaining('new-token'),
                expect.any(Object)
            )
        })
    })

    describe('Signature - Device Sharing', () => {
        it('should sign for student', async () => {
            const mockStudent = { id: 'student-1' }

            const req = new Request('http://localhost/api/sessions/session-1/sign', {
                method: 'POST',
                body: JSON.stringify({
                    studentId: 'student-1',
                    signatureData: 'base64-sig'
                })
            })

            // Mock auth session
            const { auth } = await import('@/auth')
            vi.mocked(auth).mockResolvedValue({ user: { role: 'TEACHER' } } as any)

            const res = await signSession(req, { params: { id: 'session-1' } })

            expect(res.status).toBe(200)
            expect(prisma.attendance.upsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        sessionId_studentId: {
                            sessionId: 'session-1',
                            studentId: 'student-1'
                        }
                    },
                    update: expect.objectContaining({
                        status: 'PRESENT',
                        signatureUrl: 'base64-sig'
                    })
                })
            )
        })
    })

    describe('Settings - Disable Signature', () => {
        it('should notify admin when disabled', async () => {
            const mockClassroom = {
                id: 'class-1',
                name: 'Class A',
                organizationId: 'org-1',
                organization: {
                    users: [{ email: 'admin@test.com', role: 'ADMIN' }]
                }
            }

            vi.mocked(prisma.classroom.findUnique).mockResolvedValue(mockClassroom as any)
            vi.mocked(prisma.classroom.update).mockResolvedValue({ ...mockClassroom, signatureEnabled: false } as any)
            vi.mocked(prisma.user.findMany).mockResolvedValue([{ email: 'admin@test.com' }] as any)

            const req = new Request('http://localhost/api/classrooms/class-1/settings', {
                method: 'PATCH',
                body: JSON.stringify({ signatureEnabled: false })
            })

            // Mock auth session
            const { auth } = await import('@/auth')
            vi.mocked(auth).mockResolvedValue({ user: { role: 'TEACHER', name: 'Teacher A', email: 'teacher@test.com', organizationId: 'org-1' } } as any)

            const res = await updateSettings(req, { params: { id: 'class-1' } })

            expect(res.status).toBe(200)
            expect(sendAdminNotificationEmail).toHaveBeenCalledWith(
                'org-1',
                'admin@test.com',
                expect.stringContaining('Signature désactivée'),
                expect.stringContaining('Teacher A')
            )
        })
    })
    describe('Teacher Signature Request', () => {
        it('should send email to teacher', async () => {
            const mockSession = {
                id: 'session-1',
                title: 'Math',
                startTime: new Date(),
                endTime: new Date(),
                classroom: {
                    name: 'Class A'
                }
            }
            const mockTeacher = {
                id: 'teacher-2',
                email: 'teacher2@test.com',
                name: 'Teacher 2'
            }

            vi.mocked(prisma.classSession.findUnique).mockResolvedValue(mockSession as any)
            vi.mocked(prisma.classSession.findMany).mockResolvedValue([])
            vi.mocked(prisma.user.findUnique).mockResolvedValue(mockTeacher as any)
            vi.mocked(prisma.signatureToken.findFirst).mockResolvedValue(null)
            vi.mocked(prisma.signatureToken.create).mockResolvedValue({
                id: 'token-1',
                token: 'test-token-123',
                sessionId: 'session-1',
                studentId: 'teacher-2',
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            } as any)

            const req = new Request('http://localhost/api/sessions/session-1/request-signature', {
                method: 'POST',
                body: JSON.stringify({ teacherId: 'teacher-2' })
            })

            // Mock auth session
            const { auth } = await import('@/auth')
            vi.mocked(auth).mockResolvedValue({ user: { role: 'TEACHER', organizationId: 'org-1' } } as any)

            // Dynamic import to avoid circular dependencies issues in tests setup if any
            const { POST: requestTeacherSignature } = await import('../app/api/sessions/[id]/request-signature/route')

            const res = await requestTeacherSignature(req, { params: { id: 'session-1' } })

            expect(res.status).toBe(200)
            expect(sendTeacherSignatureRequestEmail).toHaveBeenCalledWith(
                'org-1',
                'teacher2@test.com',
                'Teacher 2',
                expect.objectContaining({
                    id: 'session-1',
                    title: 'Math',
                    classroomName: 'Class A'
                }),
                [], // pendingSessions
                expect.stringContaining('teacher-signature/test-token-123') // signature link
            )
        })
    })
})
