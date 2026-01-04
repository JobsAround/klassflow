import { NextAuthConfig } from "next-auth"
import { prisma } from "@/lib/prisma"

export const authConfig: NextAuthConfig = {
    providers: [], // Providers are configured in the main auth.ts
    callbacks: {
        async signIn({ user, account, profile }) {
            console.log("SignIn Callback:", { user, account, profile })
            // We need to cast user to any because the type definition might not have our custom fields yet
            const dbUser = user as any

            // Block students
            if (dbUser.role === 'STUDENT') {
                console.log("SignIn blocked: User is STUDENT")
                return false
            }

            // Block unverified emails (unless provider verified them, but here we check DB)
            // Note: NextAuth updates emailVerified on login if provider gives it. 
            // But if we want to enforce "clicked link", we rely on DB.
            // If the user was created via invitation, they might not have verified yet.
            // For Magic Link (Nodemailer), we should allow the login process to proceed so they can verify.
            // For Magic Link (Nodemailer), we should allow the login process to proceed so they can verify.
            if (account?.provider === "nodemailer" || account?.provider === "resend") {
                console.log(`SignIn allowed: Provider is ${account?.provider}`)
                console.log("User email:", user.email)

                try {
                    // Strict check: User MUST exist in DB and be TEACHER or ADMIN
                    if (!user.email) {
                        console.log("SignIn blocked: No email provided")
                        return false
                    }

                    const dbUser = await prisma.user.findUnique({
                        where: { email: user.email }
                    })
                    console.log("DB User found:", dbUser ? "Yes" : "No")

                    if (!dbUser) {
                        console.log("SignIn blocked: User not found in DB")
                        // Redirect to welcome page with error
                        return "/?error=Unregistered"
                    }

                    if (dbUser.role !== "TEACHER" && dbUser.role !== "ADMIN") {
                        console.log("SignIn blocked: User is not TEACHER or ADMIN")
                        return "/?error=UnauthorizedRole"
                    }

                    return true
                } catch (error) {
                    console.error("SignIn error:", error)
                    return false
                }
            }

            if (!dbUser.emailVerified) {
                console.log("SignIn blocked: Email not verified")
                return false
            }

            console.log("SignIn allowed: Default case")
            return true
        },
        session({ session, user }) {
            // Add role and organizationId to the session
            if (session.user) {
                session.user.role = user.role
                session.user.organizationId = user.organizationId
                session.user.id = user.id
            }
            return session
        },
        async redirect({ url, baseUrl }) {
            console.log("Redirect Callback:", { url, baseUrl })

            // If the url is just the baseUrl (e.g. after login), we might want to customize the destination
            // But we don't have the user role here easily available in the redirect callback arguments directly
            // However, the default behavior is usually fine.
            // The issue is that after login, NextAuth redirects to the callbackUrl.
            // If we want to force a redirect based on role, we might need to handle it in the middleware or page.

            // For now, let's keep standard behavior but allow specific paths.
            if (url.startsWith("/")) return `${baseUrl}${url}`
            if (new URL(url).origin === baseUrl) return url
            return baseUrl
        }
    },
}
