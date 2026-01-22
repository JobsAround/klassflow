import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import formidable from "formidable"
import fs from "fs/promises"
import path from "path"
import { Readable } from "stream"
import { getAuthUser } from "@/lib/auth-utils"

const ALLOWED_TYPES = [
    // Documents
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    // Images
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    // Archives
    "application/zip"
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(req: NextRequest) {
    try {
        const user = await getAuthUser()
        if (!user || !user.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Only teachers and admins can upload files
        if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN" && user.role !== "TEACHER") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        // Convert NextRequest to Node.js IncomingMessage
        const buffer = await req.arrayBuffer()
        const readable = Readable.from(Buffer.from(buffer))

        // Mock IncomingMessage for formidable by attaching headers
        const headers: Record<string, string | string[]> = {}
        req.headers.forEach((value, key) => {
            headers[key] = value
        })
        Object.assign(readable, { headers })

        // Parse form data
        const form = formidable({
            maxFileSize: MAX_FILE_SIZE,
            filter: ({ mimetype }) => ALLOWED_TYPES.includes(mimetype || "")
        })

        const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
            form.parse(readable as any, (err, fields, files) => {
                if (err) reject(err)
                else resolve([fields, files])
            })
        })

        const classroomId = Array.isArray(fields.classroomId) ? fields.classroomId[0] : fields.classroomId
        const title = Array.isArray(fields.title) ? fields.title[0] : fields.title
        const description = Array.isArray(fields.description) ? fields.description[0] : fields.description

        if (!classroomId || !title) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        // Verify classroom belongs to user's organization
        const classroom = await prisma.classroom.findFirst({
            where: {
                id: classroomId,
                organizationId: user.organizationId
            }
        })

        if (!classroom) {
            return NextResponse.json({ error: "Classroom not found" }, { status: 404 })
        }

        const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file
        if (!uploadedFile) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
        }

        // Create resource ID
        const resourceId = `${Date.now()}-${Math.random().toString(36).substring(7)}`

        // Create upload directory
        const uploadDir = path.join(process.cwd(), "public", "uploads", user.organizationId!, resourceId)
        await fs.mkdir(uploadDir, { recursive: true })

        // Sanitize filename
        const sanitizedFilename = uploadedFile.originalFilename?.replace(/[^a-zA-Z0-9.-]/g, "_") || "file"
        const filePath = path.join(uploadDir, sanitizedFilename)

        // Move file
        await fs.copyFile(uploadedFile.filepath, filePath)
        await fs.unlink(uploadedFile.filepath) // Clean up temp file

        // Create resource record
        const fileUrl = `/uploads/${user.organizationId}/${resourceId}/${sanitizedFilename}`
        const resource = await prisma.resource.create({
            data: {
                title,
                description: description || null,
                url: fileUrl,
                type: "FILE",
                classroomId
            }
        })

        return NextResponse.json(resource)
    } catch (error) {
        console.error("Upload error:", error)
        return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
    }
}


