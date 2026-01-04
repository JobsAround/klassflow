import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '../app/api/signature/[token]/route'
import { POST as absencePOST } from '../app/api/signature/[token]/absence/route'
import { prisma } from '../lib/prisma'
import { NextRequest } from 'next/server'

// Mock Prisma
vi.mock('../lib/prisma', () => ({
    prisma: {
        signatureToken: {
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
        attendance: {
            findUnique: vi.fn(),
            upsert: vi.fn(),
        },
        classroomEnrollment: {
            findMany: vi.fn(),
        },
        classSession: {
            findMany: vi.fn(),
            findUnique: vi.fn(), // Mock findUnique for the current session fetch
        }
    }
}))

describe('Signature API Regression Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('GET /api/signature/[token]', () => {
        it('should include current classroom in missed sessions check even if student is not enrolled', async () => {
            // Setup data
            const mockToken = 'valid-token'
            const mockClassroomId = 'current-classroom-id'
            const mockStudentId = 'student-1'
            const mockSessionId = 'current-session-id'

            // Mock Signature Token Check
            vi.mocked(prisma.signatureToken.findUnique).mockResolvedValue({
                id: 'token-1',
                token: mockToken,
                studentId: mockStudentId,
                sessionId: mockSessionId,
                expiresAt: new Date(Date.now() + 10000), // Valid in future
                usedAt: null,
                student: { id: mockStudentId, name: 'Student', email: 's@test.com' },
                session: {
                    id: mockSessionId,
                    classroomId: mockClassroomId,
                    classroom: { id: mockClassroomId, name: 'Current Class' }
                }
            } as any)

            // Mock Enrollments -> Return EMPTY array (Student not enrolled)
            vi.mocked(prisma.classroomEnrollment.findMany).mockResolvedValue([])

            // Mock Current Session Fetch (This is part of the fix logic)
            vi.mocked(prisma.classSession.findUnique).mockResolvedValue({
                id: mockSessionId,
                classroomId: mockClassroomId
            } as any)

            // Mock Missed Sessions -> Return one past session
            vi.mocked(prisma.classSession.findMany).mockResolvedValue([
                {
                    id: 'missed-session-1',
                    title: 'Missed Session',
                    startTime: new Date(Date.now() - 100000),
                    endTime: new Date(Date.now() - 90000),
                    classroom: { name: 'Current Class' }
                }
            ] as any)

            // Mock Token generation for missed sessions
            vi.mocked(prisma.signatureToken.findFirst).mockResolvedValue(null)
            vi.mocked(prisma.signatureToken.create).mockResolvedValue({ token: 'new-missed-token' } as any)

            // Execute
            const req = new NextRequest(`http://localhost/api/signature/${mockToken}`)
            await GET(req, { params: { token: mockToken } })

            // ASSERTIONS
            // 1. Check if classroomEnrollment was called
            expect(prisma.classroomEnrollment.findMany).toHaveBeenCalledWith({
                where: { studentId: mockStudentId },
                select: { classroomId: true }
            })

            // 2. CRITICAL: Check if classSession.findMany was called with the correct classroomId
            // It should validly include 'current-classroom-id' despite empty enrollments
            expect(prisma.classSession.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    classroomId: expect.objectContaining({
                        in: expect.arrayContaining([mockClassroomId])
                    })
                })
            }))
        })
    })

    describe('POST /api/signature/[token]/absence', () => {
        it('should save absence and return missed sessions including current classroom', async () => {
            // Setup data
            const mockToken = 'valid-token-absence'
            const mockClassroomId = 'current-classroom-id'
            const mockStudentId = 'student-1'
            const mockSessionId = 'current-session-id'

            // Mock Signature Token Check
            vi.mocked(prisma.signatureToken.findUnique).mockResolvedValue({
                id: 'token-1',
                token: mockToken,
                studentId: mockStudentId,
                sessionId: mockSessionId,
                expiresAt: new Date(Date.now() + 10000), // Valid
                usedAt: null,
                student: { id: mockStudentId },
                session: {
                    id: mockSessionId,
                    classroomId: mockClassroomId,
                    classroom: { id: mockClassroomId, name: 'Current Class' } // Ensure session has classroom
                }
            } as any)

            // Mock Enrollments -> Return EMPTY (Student not enrolled)
            vi.mocked(prisma.classroomEnrollment.findMany).mockResolvedValue([])

            // Mock Missed Sessions logic (findMany on classSession)
            vi.mocked(prisma.classSession.findMany).mockResolvedValue([])

            // Mock API Request
            const req = new Request('http://localhost/api/signature/valid-token-absence/absence', {
                method: 'POST',
                body: JSON.stringify({ reason: 'Sick' })
            })

            // Execute
            const res = await absencePOST(req, { params: { token: mockToken } })
            const data = await res.json()

            // ASSERTIONS
            expect(res.status).toBe(200)
            expect(data.success).toBe(true)

            // Verify attendance upsert was called with ABSENT status
            expect(prisma.attendance.upsert).toHaveBeenCalledWith(expect.objectContaining({
                where: {
                    sessionId_studentId: { sessionId: mockSessionId, studentId: mockStudentId }
                },
                create: expect.objectContaining({
                    status: 'ABSENT',
                    proofUrl: expect.stringContaining('Reason: Sick')
                })
            }))

            // Verify token was marked used
            expect(prisma.signatureToken.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'token-1' },
                data: { usedAt: expect.any(Date) }
            }))

            // Verify Missed Sessions Logic used targetClassroomIds containing current classroom
            // We can check if findMany was called with the right classroomId constraint
            expect(prisma.classSession.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    classroomId: expect.objectContaining({
                        in: expect.arrayContaining([mockClassroomId])
                    })
                })
            }))
        })
    })

    describe('Token Validation', () => {
        it('should reject expired signature token', async () => {
            const mockToken = 'expired-token'

            // Mock Expired Token
            vi.mocked(prisma.signatureToken.findUnique).mockResolvedValue({
                id: 'token-expired',
                token: mockToken,
                studentId: 's1',
                sessionId: 'sess1',
                expiresAt: new Date(Date.now() - 10000), // EXPIRED
                usedAt: null,
                student: {},
                session: {}
            } as any)

            const req = new NextRequest(`http://localhost/api/signature/${mockToken}`, {
                method: 'POST',
                body: JSON.stringify({ signatureData: 'data' })
            })

            const res = await POST(req, { params: { token: mockToken } })
            const data = await res.json()

            expect(res.status).toBe(410)
            expect(data.error).toBe('Token expired')
        })
    })
})
