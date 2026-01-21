/**
 * Translation completeness test for @klassflow/core
 * Ensures all languages have the same keys as the English base translation.
 */

import en from '../../messages/en.json'
import fr from '../../messages/fr.json'
import de from '../../messages/de.json'
import es from '../../messages/es.json'
import pt from '../../messages/pt.json'
import ru from '../../messages/ru.json'
import uk from '../../messages/uk.json'

type TranslationObject = Record<string, unknown>

const languages: Record<string, TranslationObject> = { en, fr, de, es, pt, ru, uk }

/**
 * Recursively extracts all keys from a nested object as dot-separated paths
 */
function getKeys(obj: TranslationObject, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    return typeof value === 'object' && value !== null && !Array.isArray(value)
      ? getKeys(value as TranslationObject, path)
      : [path]
  })
}

describe('Core translations (core/messages)', () => {
  const englishKeys = getKeys(en)

  it('English should have translation keys', () => {
    expect(englishKeys.length).toBeGreaterThan(0)
  })

  Object.entries(languages).forEach(([lang, messages]) => {
    if (lang === 'en') return

    describe(`${lang.toUpperCase()} translations`, () => {
      const langKeys = getKeys(messages)

      it(`should have all keys from English`, () => {
        const missing = englishKeys.filter(key => !langKeys.includes(key))
        if (missing.length > 0) {
          throw new Error(
            `Missing ${missing.length} translation key(s) in ${lang}.json:\n` +
            missing.map(k => `  - ${k}`).join('\n')
          )
        }
      })

      it(`should not have extra keys not in English`, () => {
        const extra = langKeys.filter(key => !englishKeys.includes(key))
        if (extra.length > 0) {
          throw new Error(
            `Extra ${extra.length} translation key(s) in ${lang}.json not in en.json:\n` +
            extra.map(k => `  - ${k}`).join('\n')
          )
        }
      })
    })
  })
})
