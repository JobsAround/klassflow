import nodemailer from "nodemailer"
import { prisma } from "./prisma"

interface SMTPConfig {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
  from: string
}

export async function getEmailTransport(organizationId: string) {
  // In development, default to MailPit if no SMTP config exists
  if (process.env.NODE_ENV === "development") {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { smtpConfig: true }
    })

    // Use MailPit if no SMTP configured
    if (!org?.smtpConfig) {
      console.log("Using MailPit for email in development mode")
      return nodemailer.createTransport({
        host: "localhost",
        port: 1025,
        secure: false,
        // No auth needed for MailPit
      })
    }
  }

  // Production or when SMTP is configured
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { smtpConfig: true }
  })

  if (!org?.smtpConfig) {
    // Check for System-wide SMTP (Env Vars)
    if (process.env.RESEND_API_KEY) {
      return nodemailer.createTransport({
        host: "smtp.resend.com",
        port: 465,
        secure: true,
        auth: {
          user: "resend",
          pass: process.env.RESEND_API_KEY
        }
      })
    }

    if (process.env.SMTP_HOST) {
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      })
    }

    throw new Error("SMTP not configured for this organization and no system default available")
  }

  const config = org.smtpConfig as unknown as SMTPConfig

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass
    }
  })
}

export async function sendReminderEmail(
  organizationId: string,
  to: string,
  studentName: string,
  sessionData: {
    title: string | null
    classroomName: string
    startTime: Date
    endTime: Date
    type: string
    meetingLink?: string | null
  }
) {
  const transport = await getEmailTransport(organizationId)
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { smtpConfig: true, name: true }
  })

  const config = org?.smtpConfig as unknown as SMTPConfig
  const isOnline = sessionData.type === "ONLINE"

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
    .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">📚 Rappel de cours</h1>
    </div>
    <div class="content">
      <p>Bonjour ${studentName},</p>
      
      <p>Ce message vous rappelle que vous avez un cours demain :</p>
      
      <div class="info-box">
        <h2 style="margin-top: 0; color: #2563eb;">${sessionData.classroomName}</h2>
        ${sessionData.title ? `<p><strong>Sujet :</strong> ${sessionData.title}</p>` : ""}
        <p><strong>📅 Date :</strong> ${sessionData.startTime.toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "Europe/Paris" })}</p>
        <p><strong>🕐 Horaire :</strong> ${sessionData.startTime.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })} - ${sessionData.endTime.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })}</p>
        <p><strong>📍 Type :</strong> ${isOnline ? "En ligne (Distanciel)" : "En présentiel"}</p>
      </div>
      
      ${isOnline && sessionData.meetingLink ? `
        <p>Rejoignez le cours en ligne en cliquant sur le lien ci-dessous :</p>
        <a href="${sessionData.meetingLink}" class="button">🎥 Rejoindre le cours</a>
      ` : `
        <p>⚠️ <strong>N'oubliez pas d'apporter votre matériel !</strong></p>
        <p>Vous recevrez un email quelques minutes avant le début du cours pour confirmer votre présence.</p>
      `}
      
      <p>À bientôt !</p>
    </div>
    <div class="footer">
      <p>${org?.name || "Klass Flow"}</p>
      <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
    </div>
  </div>
</body>
</html>
  `

  await transport.sendMail({
    from: config?.from || process.env.SMTP_FROM || '"KlassFlow" <noreply@klassflow.app>',
    to,
    subject: `📚 Rappel : ${sessionData.classroomName}${sessionData.title ? ` - ${sessionData.title}` : ""}`,
    html
  })
}

export async function sendSignatureEmail(
  organizationId: string,
  to: string,
  studentName: string,
  signatureUrl: string,
  sessionData: {
    title: string | null
    classroomName: string
    startTime: Date
    endTime: Date
  }
) {
  const transport = await getEmailTransport(organizationId)
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { smtpConfig: true, name: true }
  })

  const config = org?.smtpConfig as unknown as SMTPConfig

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #374151; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669; }
    .button { display: inline-block; background: #059669; color: #ffffff !important; padding: 16px 32px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-size: 18px; font-weight: bold; }
    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">✍️ Signature de présence</h1>
    </div>
    <div class="content">
      <p>Bonjour ${studentName},</p>
      
      <p>Veuillez confirmer votre présence à votre formation chez <strong>${org?.name || "Klass Flow"}</strong>.</p>

      <center>
        <a href="${signatureUrl}" class="button">✍️ Signer ma présence</a>
      </center>
      
      <div class="info-box">
        <h2 style="margin-top: 0; color: #059669;">${sessionData.classroomName}</h2>
        ${sessionData.title ? `<p><strong>Sujet :</strong> ${sessionData.title}</p>` : ""}
        <p><strong>📅 Date :</strong> ${sessionData.startTime.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" })}</p>
        <p><strong>🕐 Horaire :</strong> ${sessionData.startTime.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })} - ${sessionData.endTime.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })}</p>
        <p><strong>⏱️ Durée :</strong> ${Math.round((sessionData.endTime.getTime() - sessionData.startTime.getTime()) / (1000 * 60))} minutes</p>
      </div>
      

      
      <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
        Si vous ne pouvez pas assister au cours, vous pourrez télécharger un justificatif d'absence via le même lien.
      </p>
    </div>
    <div class="footer">
      <p>${org?.name || "Klass Flow"}</p>
      <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
    </div>
  </div>
</body>
</html>
  `

  await transport.sendMail({
    from: config?.from || process.env.SMTP_FROM || '"KlassFlow" <noreply@klassflow.app>',
    to,
    subject: `✍️ Signature requise : ${sessionData.classroomName} (${sessionData.startTime.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Paris" })} ${sessionData.startTime.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })}-${sessionData.endTime.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })})`,
    html
  })
}

export async function sendInvitationEmail(
  organizationId: string,
  to: string,
  userName: string,
  userRole: string,
  classroomNames?: string[]
) {
  const transport = await getEmailTransport(organizationId)
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { smtpConfig: true, name: true }
  })

  const config = org?.smtpConfig as unknown as SMTPConfig | null
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
    .info-box { background: white; border-left: 4px solid #667eea; padding: 15px; margin: 25px 0; border-radius: 4px; }
    .classroom-list { background: #f0f4ff; border-left: 4px solid #4f46e5; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .classroom-item { padding: 8px 0; border-bottom: 1px solid #e0e7ff; }
    .classroom-item:last-child { border-bottom: none; }
    .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">Welcome to Klass Flow!</h1>
    </div>
    <div class="content">
      <p style="font-size: 16px; margin-bottom: 20px;">Hi <strong>${userName}</strong>,</p>
      
      <p style="font-size: 16px; margin-bottom: 20px;">
        You've been invited to join <strong>${org?.name || "Klass Flow"}</strong> as a <strong>${userRole.toLowerCase()}</strong>.
      </p>
      
      <div class="info-box">
        <p style="margin: 0; font-size: 14px; color: #6b7280;">
          <strong>Your login email:</strong><br>
          ${to}
        </p>
      </div>
      
      ${classroomNames && classroomNames.length > 0 ? `
        <div class="classroom-list">
          <p style="margin: 0 0 10px 0; font-weight: 600; color: #4f46e5;">
            📚 You've been ${userRole === "STUDENT" ? "enrolled in" : "assigned to"} the following classroom${classroomNames.length > 1 ? 's' : ''}:
          </p>
          ${classroomNames.map(name => `
            <div class="classroom-item">
              <span style="color: #1e40af; font-weight: 500;">• ${name}</span>
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      <p style="font-size: 16px; margin-bottom: 25px;">
        To get started, click the button below to access the platform:
      </p>
      
      <center>
        <a href="${appUrl}" class="button">Access Klass Flow</a>
      </center>
      
      <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
        If you have any questions, please contact your organization administrator.
      </p>
    </div>
    <div class="footer">
      <p>${org?.name || "Klass Flow"}</p>
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `

  await transport.sendMail({
    from: config?.from || process.env.SMTP_FROM || '"KlassFlow" <noreply@klassflow.app>',
    to,
    subject: `Welcome to ${org?.name || "Klass Flow"}!`,
    html
  })
}

export async function sendAdminNotificationEmail(
  organizationId: string,
  to: string,
  subject: string,
  message: string
) {
  const transport = await getEmailTransport(organizationId)
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { smtpConfig: true, name: true }
  })

  const config = org?.smtpConfig as unknown as SMTPConfig | null

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">⚠️ Notification Admin</h1>
    </div>
    <div class="content">
      <p>${message}</p>
    </div>
    <div class="footer">
      <p>${org?.name || "Klass Flow"}</p>
    </div>
  </div>
</body>
</html>
  `

  await transport.sendMail({
    from: config?.from || process.env.SMTP_FROM || '"KlassFlow" <noreply@klassflow.app>',
    to,
    subject: `[Admin] ${subject}`,
    html
  })
}

export async function sendTeacherSignatureRequestEmail(
  organizationId: string,
  to: string,
  teacherName: string,
  sessionData: {
    id: string
    title: string | null
    classroomId: string
    classroomName: string
    startTime: Date
    endTime: Date
  },
  pendingSessions?: {
    id: string
    classroomName: string
    startTime: Date
    endTime: Date
  }[],
  link?: string
) {
  const transport = await getEmailTransport(organizationId)
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { smtpConfig: true, name: true }
  })

  const config = org?.smtpConfig as unknown as SMTPConfig | null
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  let signLink = link

  if (!signLink) {
    signLink = `${appUrl}/dashboard/classrooms/${sessionData.classroomId}?signSessionId=${sessionData.id}`
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #374151; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669; }
    .button { display: inline-block; background: #059669; color: white !important; padding: 16px 32px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-size: 18px; font-weight: bold; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">✍️ Signature Formateur</h1>
    </div>
    <div class="content">
      <p>Bonjour ${teacherName},</p>
      
      <p>Vous êtes invité à signer la feuille de présence <strong>en tant que formateur</strong> pour le cours suivant chez <strong>${org?.name || "Klass Flow"}</strong> :</p>
      
      <div class="info-box">
        <h2 style="margin-top: 0; color: #059669;">${sessionData.classroomName}</h2>
        ${sessionData.title ? `<p><strong>Sujet :</strong> ${sessionData.title}</p>` : ""}
        <p><strong>📅 Date :</strong> ${sessionData.startTime.toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "Europe/Paris" })}</p>
        <p><strong>🕐 Horaire :</strong> ${sessionData.startTime.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })} - ${sessionData.endTime.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })}</p>
      </div>
      
      <p>Merci de cliquer sur le bouton ci-dessous pour accéder au cours et signer :</p>
      
      <center>
        <a href="${signLink}" class="button">✍️ Accéder et Signer</a>
      </center>
      
      ${pendingSessions && pendingSessions.length > 0 ? `
        <div style="margin-top: 30px; border-top: 1px solid #e5e7eb; pt-4;">
          <h3 style="color: #b91c1c;">⚠️ Sessions précédentes non signées</h3>
          <p>Vous avez d'autres sessions en attente de signature :</p>
          <ul style="list-style: none; padding: 0;">
            ${pendingSessions.map(s => `
              <li style="margin-bottom: 10px; padding: 10px; background: #fff1f2; border-radius: 4px; border-left: 3px solid #b91c1c;">
                <strong>${s.classroomName}</strong><br>
                ${s.startTime.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })} 
                ${s.startTime.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </li>
            `).join('')}
          </ul>
        </div>
      ` : ''}

      <p style="font-size: 14px; color: #666; margin-top: 20px;">
        Si vous n'êtes pas connecté, vous devrez vous connecter avant de pouvoir signer.
      </p>
    </div>
    <div class="footer">
      <p>${org?.name || "Klass Flow"}</p>
      <p>Cet email a été envoyé automatiquement.</p>
    </div>
  </div>
</body>
</html>
  `

  await transport.sendMail({
    from: config?.from || process.env.SMTP_FROM || '"KlassFlow" <noreply@klassflow.app>',
    to,
    subject: `✍️ Signature Formateur requise : ${sessionData.classroomName}`,
    html
  })
}
