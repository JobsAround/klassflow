import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export const locales = ['en', 'fr', 'uk', 'ru', 'es', 'de'] as const;
export type Locale = typeof locales[number];

export default getRequestConfig(async () => {
    const cookieStore = await cookies();
    const locale = (cookieStore.get('locale')?.value as Locale) || 'en';

    return {
        locale,
        messages: (await import(`../messages/${locale}.json`)).default
    };
});
