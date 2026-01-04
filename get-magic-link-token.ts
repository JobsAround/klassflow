
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const email = 'dev@openclassroom.local'
    const token = await prisma.verificationToken.findFirst({
        where: { identifier: email },
        orderBy: { expires: 'desc' }
    })

    if (token) {
        console.log(`VERIFICATION_TOKEN: ${token.token}`)
        console.log(`VERIFICATION_IDENTIFIER: ${token.identifier}`)
    } else {
        console.log('NO_TOKEN_FOUND')
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
