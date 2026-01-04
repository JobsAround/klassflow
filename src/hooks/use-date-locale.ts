import { useLocale } from 'next-intl'

export function useDateLocale() {
    const locale = useLocale()

    // Map next-intl locales to date-fns/Intl locales
    const localeMap: Record<string, string> = {
        'en': 'en-US',
        'fr': 'fr-FR',
        'uk': 'uk-UA',
        'ru': 'ru-RU'
    }

    return localeMap[locale] || 'en-US'
}
