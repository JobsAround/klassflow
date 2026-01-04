
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const orgId = 'cmjosb08g0002um1354l46d9i'
    const classroom = await prisma.classroom.findFirst({
        where: { organizationId: orgId }
    })

    if (classroom) {
        console.log(`FOUND_CLASSROOM_ID: ${classroom.id}`)
    } else {
        console.log('NO_CLASSROOM_FOUND')
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
