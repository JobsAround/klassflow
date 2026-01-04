import { SignIn } from "@/components/auth/sign-in-button"
import { DevLogin } from "@/components/auth/dev-login-button"
import { QrCode, Calendar, Users, FileCheck, ShieldCheck, Mail, Laptop } from "lucide-react"
import { getTranslations } from 'next-intl/server'
import { LanguageSelector } from "@/components/layout/language-selector"

export default async function Home({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams
  const t = await getTranslations('homepage')

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <header className="absolute top-4 right-4 z-10">
        <LanguageSelector />
      </header>
      <main className="flex-1">
        <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
          <div className="container mx-auto flex max-w-[64rem] flex-col items-center gap-4 text-center px-4">
            <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400"
              dangerouslySetInnerHTML={{ __html: t.raw('title') }}>
            </h1>
            <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8 text-slate-600 dark:text-slate-400">
              {t('subtitle')}
            </p>
            <div className="flex flex-col gap-4 sm:flex-row mt-4">
              <SignIn />
              <DevLogin />
            </div>

            {params?.error === "Unregistered" && (
              <div className="mt-4 p-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
                <span className="font-medium">{t('accessDenied')}</span> {t('unregistered')}
              </div>
            )}
            {params?.error === "UnauthorizedRole" && (
              <div className="mt-4 p-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
                <span className="font-medium">{t('accessDenied')}</span> {t('unauthorizedRole')}
              </div>
            )}
          </div>
        </section>

        <section className="container mx-auto space-y-6 bg-slate-50 py-8 dark:bg-transparent md:py-12 lg:py-24 px-4">
          <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-4">
            <div className="relative overflow-hidden rounded-lg border bg-background p-2">
              <div className="flex flex-col gap-4 rounded-md p-6 h-full">
                <QrCode className="h-12 w-12 text-blue-600" />
                <div className="space-y-2">
                  <h3 className="font-bold">{t('digitalAttendance')}</h3>
                  <p className="text-sm text-muted-foreground">{t('digitalAttendanceDesc')}</p>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-lg border bg-background p-2">
              <div className="flex flex-col gap-4 rounded-md p-6 h-full">
                <Calendar className="h-12 w-12 text-blue-600" />
                <div className="space-y-2">
                  <h3 className="font-bold">{t('planning')}</h3>
                  <p className="text-sm text-muted-foreground">{t('planningDesc')}</p>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-lg border bg-background p-2">
              <div className="flex flex-col gap-4 rounded-md p-6 h-full">
                <Laptop className="h-12 w-12 text-blue-600" />
                <div className="space-y-2">
                  <h3 className="font-bold">{t('hybrid')}</h3>
                  <p className="text-sm text-muted-foreground">{t('hybridDesc')}</p>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-lg border bg-background p-2">
              <div className="flex flex-col gap-4 rounded-md p-6 h-full">
                <FileCheck className="h-12 w-12 text-blue-600" />
                <div className="space-y-2">
                  <h3 className="font-bold">{t('automatedPdf')}</h3>
                  <p className="text-sm text-muted-foreground">{t('automatedPdfDesc')}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="py-6 md:px-8 md:py-0">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            {t('builtBy')} <a href="https://jobsaround.fr" target="_blank" rel="noreferrer" className="font-medium underline underline-offset-4">JobsAround</a>.
            The source code is available on <a href="https://github.com/JobsAround/open-classroom" target="_blank" rel="noreferrer" className="font-medium underline underline-offset-4">GitHub</a>.
          </p>
        </div>
      </footer>
    </div>
  )
}
