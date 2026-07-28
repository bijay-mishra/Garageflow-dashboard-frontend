import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { translate, type Lang } from '@/lib/i18n'

interface LanguageCtx {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageCtx | undefined>(undefined)
const STORAGE_KEY = 'gf_lang'

function getInitialLang(): Lang {
  if (typeof window === 'undefined') return 'en'
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'np' || stored === 'en' ? stored : 'en'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getInitialLang)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang)
    document.documentElement.lang = lang === 'np' ? 'ne' : 'en'
  }, [lang])

  const value: LanguageCtx = {
    lang,
    setLang: setLangState,
    t: (key) => translate(lang, key),
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLang() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLang must be used within LanguageProvider')
  return ctx
}
