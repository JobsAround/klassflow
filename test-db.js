const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    try {
        await prisma.$connect()
        console.log('Successfully connected to database')
        const count = await prisma.user.count()
        console.log('User count:', count)
    } catch (e) {
        console.error('Connection failed:', e)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

main()
