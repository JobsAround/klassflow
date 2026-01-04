import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding French class examples...')

    // Get the Dev Organization
    const org = await prisma.organization.findFirst({
        where: { name: 'Dev Organization' }
    })

    if (!org) {
        console.error('❌ Dev Organization not found. Please run dev-login first.')
        return
    }

    // Create "Français A1" classroom
    const classroomA1 = await prisma.classroom.upsert({
        where: { id: 'french-a1-example' },
        update: {},
        create: {
            id: 'french-a1-example',
            name: 'Français A1 - Débutants',
            description: 'Cours de français pour débutants - Niveau A1 du CECRL',
            organizationId: org.id
        }
    })

    console.log('✅ Created classroom:', classroomA1.name)

    // Create ONSITE session (requires signature)
    const onsiteSession = await prisma.classSession.upsert({
        where: { id: 'onsite-french-session' },
        update: {},
        create: {
            id: 'onsite-french-session',
            title: 'Grammaire et Conjugaison',
            type: 'ONSITE',
            classroomId: classroomA1.id,
            startTime: new Date('2024-12-15T09:00:00'),
            endTime: new Date('2024-12-15T12:00:00'),
            reminderEnabled: true,
            reminderHoursBefore: 24,
            signatureMinutesBefore: 5
        }
    })

    console.log('✅ Created ONSITE session:', onsiteSession.title)

    // Create ONLINE session
    const onlineSession = await prisma.classSession.upsert({
        where: { id: 'online-french-session' },
        update: {},
        create: {
            id: 'online-french-session',
            title: 'Expression Orale - Conversation',
            type: 'ONLINE',
            classroomId: classroomA1.id,
            startTime: new Date('2024-12-17T14:00:00'),
            endTime: new Date('2024-12-17T16:00:00'),
            meetingLink: 'https://meet.google.com/abc-defg-hij',
            isOnline: true,
            reminderEnabled: true,
            reminderHoursBefore: 24,
            signatureMinutesBefore: 5
        }
    })

    console.log('✅ Created ONLINE session:', onlineSession.title)

    console.log('\n🎉 Seed complete!')
    console.log('\nCreated:')
    console.log('- 1 Classroom: Français A1 - Débutants')
    console.log('- 1 ONSITE Session: Grammaire et Conjugaison (15/12 9h-12h)')
    console.log('  → Reminder: 24h before')
    console.log('  → Signature email: 5min before')
    console.log('- 1 ONLINE Session: Expression Orale (17/12 14h-16h)')
    console.log('  → With Google Meet link')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()

    })
