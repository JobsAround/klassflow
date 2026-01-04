
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const orgId = 'cmjvhsq7e0001avhp79fmsfn5'
    const user = await prisma.user.findFirst({
        where: {
            organizationId: orgId,
            role: 'ADMIN' // or 'TEACHER' if no admin
        }
    })

    if (user) {
        console.log(`FOUND_USER_ID: ${user.id}`)
    } else {
        // Fallback to any user in the org
        const anyUser = await prisma.user.findFirst({
            where: { organizationId: orgId }
        })
        if (anyUser) {
            console.log(`FOUND_USER_ID: ${anyUser.id} (Role: ${anyUser.role})`)
        } else {
            console.log('NO_USER_FOUND')
        }
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
