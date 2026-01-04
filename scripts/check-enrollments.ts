import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

async function main() {
    console.log("Checking enrollments...")

    // Get all classrooms
    const classrooms = await prisma.classroom.findMany({
        include: {
            enrollments: {
                include: {
                    student: true
                }
            }
        }
    })

    console.log(`Found ${classrooms.length} classrooms.`)

    for (const classroom of classrooms) {
        console.log(`Classroom: ${classroom.name} (${classroom.id})`)
        console.log(`  Enrollments: ${classroom.enrollments.length}`)
        classroom.enrollments.forEach(e => {
            console.log(`    - Student: ${e.student.name} (${e.student.email})`)
        })
    }
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
