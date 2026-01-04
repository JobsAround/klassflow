import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import Nodemailer from "next-auth/providers/nodemailer"
import Resend from "next-auth/providers/resend"
import { authConfig } from "./auth.config"

const smtpConfig = {
    host: process.env.SMTP_HOST || "localhost",
    port: Number(process.env.SMTP_PORT) || 1025,
    secure: false,
    tls: {
        rejectUnauthorized: false
    }
}

if (process.env.SMTP_USER) {
    (smtpConfig as any).auth = {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    }
} else {
    // For MailPit or other dev servers that advertise AUTH but don't strictly require valid creds
    // We provide dummy creds to satisfy the client's need to send something if it decides to auth.
    (smtpConfig as any).auth = {
        user: "test",
        pass: "test",
    }
}

(smtpConfig as any).ignoreTLS = true

console.log("SMTP Config:", { ...smtpConfig, auth: (smtpConfig as any).auth ? { user: (smtpConfig as any).auth.user, pass: "***" } : undefined })

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma) as any,
    providers: [
        process.env.RESEND_API_KEY
            ? Resend({
                apiKey: process.env.RESEND_API_KEY,
                from: process.env.SMTP_FROM || "noreply@klassflow.app",
            })
            : Nodemailer({
                server: smtpConfig,
                from: process.env.SMTP_FROM || "noreply@klassflow.app",
            }),
    ],
    callbacks: authConfig.callbacks,
    trustHost: true,
})
