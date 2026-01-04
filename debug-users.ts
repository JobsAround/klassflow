
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const users = await prisma.user.findMany({ take: 5 })
    console.log('Users:', users)

    const orgs = await prisma.organization.findMany({ take: 5 })
    console.log('Orgs:', orgs)
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
