import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const user = await prisma.user.findFirst({
        where: { email: 'dev@example.com' } // Assuming dev user email
    })
    if (user) {
        console.log(`DEV_USER_ID=${user.id}`)
    } else {
        // Fallback: get any user with ADMIN role
        const admin = await prisma.user.findFirst({
            where: { role: 'ADMIN' }
        })
        if (admin) {
            console.log(`DEV_USER_ID=${admin.id}`)
        } else {
            console.log('No dev user found')
        }
    }
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect()

    })
