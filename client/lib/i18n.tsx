"use client"

import { createContext, useContext, useEffect, useState } from "react"

export type Language = "en" | "am" | "om"

export const LANGUAGES: { code: Language; label: string; native: string }[] = [
  { code: "en", label: "English", native: "English" },
  { code: "am", label: "Amharic", native: "አማርኛ" },
  { code: "om", label: "Oromo", native: "Afaan Oromoo" },
]

const STORAGE_KEY = "dawolife_lang"

const STRINGS: Record<Language, Record<string, string>> = {
  en: {
    "what_you_do": "What you are going to do?",
    "search_placeholder": "I am looking for ........",
    "select": "select",
    "home": "Home",
    "login": "Login",
    "register": "Register",
    "sign_in": "Sign in",
    "create_account": "Create Account",
    "welcome_back": "Welcome back",
    "welcome_back_long": "Sign in to continue to DawoLife",
    "create_your_account": "Create your account",
    "create_free_account": "Create your free account",
    "username": "Username",
    "email": "Email",
    "phone": "Phone",
    "password": "Password",
    "confirm_password": "Confirm Password",
    "full_name": "Full Name",
    "i_am_looking": "I am looking for ........",
    "buy_or_sell_house": "Buy or sell your house",
    "buy_or_sell_vehicle": "Buy or sell vehicles",
    "our_service": "our Service",
    "how_to_buy": "How to Buy",
    "how_to_sell": "How to Sell",
    "already_have_account": "Already have an account?",
    "new_to_dawolife": "New to DawoLife?",
    "sign_in_link": "Sign in",
    "create_account_link": "Create an account",
    "choose_account_type": "Join DawoLife as",
    "buyer_user": "Buyer / User",
    "buyer_user_desc": "Browse, save and message agents",
    "seller_agent": "Seller / Agent",
    "seller_agent_desc": "List properties and grow your business",
  },
  am: {
    "what_you_do": "ምን ማድረግ ነው የሚፈልጉት?",
    "search_placeholder": "እየፈለግኩ ያለሁት ........",
    "select": "ምረጥ",
    "home": "መነሻ",
    "login": "ግባ",
    "register": "ተመዝገብ",
    "sign_in": "ግባ",
    "create_account": "መለያ ፍጠር",
    "welcome_back": "እንኳን በደህና መጡ",
    "welcome_back_long": "ወደ DawoLife ለመግባት ይግቡ",
    "create_your_account": "መለያዎን ይፍጠሩ",
    "create_free_account": "ነፃ መለያ ይፍጠሩ",
    "username": "የተጠቃሚ ስም",
    "email": "ኢሜይል",
    "phone": "ስልክ",
    "password": "የይለፍ ቃል",
    "confirm_password": "የይለፍ ቃል ያረጋግጡ",
    "full_name": "ሙሉ ስም",
    "i_am_looking": "እየፈለግኩ ያለሁት ........",
    "buy_or_sell_house": "ቤት ይግዙ ወይም ይሽጡ",
    "buy_or_sell_vehicle": "መኪና ይግዙ ወይም ይሽጡ",
    "our_service": "አገልግሎታችን",
    "how_to_buy": "እንዴት መግዛት",
    "how_to_sell": "እንዴት መሸጥ",
    "already_have_account": "መለያ አለዎት?",
    "new_to_dawolife": "ለDawoLife አዲስ?",
    "sign_in_link": "ግባ",
    "create_account_link": "መለያ ይፍጠሩ",
    "choose_account_type": "በDawoLife ይቀላቀሉ",
    "buyer_user": "ገዢ / ተጠቃሚ",
    "buyer_user_desc": "ይመልከቱ፣ ያስቀምጡ እና ለወኪሎች መልዕክት ይላኩ",
    "seller_agent": "ሻጭ / ወኪል",
    "seller_agent_desc": "ንብረት ይዘርዝሩ እና ንግድዎን ያሳድጉ",
  },
  om: {
    "what_you_do": "Maal gochuu barbaaddee?",
    "search_placeholder": "Waan barbaaduu ture ........",
    "select": "Filadhu",
    "home": "Mana",
    "login": "Seeni",
    "register": "Galmeessi",
    "sign_in": "Seeni",
    "create_account": "Akaawuntii uumi",
    "welcome_back": "Baga nagaan dhufte",
    "welcome_back_long": "DawoLife seenuuf seeni",
    "create_your_account": "Akaawuntii kee uumi",
    "create_free_account": "Akaawuntii bilisaa uumi",
    "username": "Maqaa fayyadamaa",
    "email": "Imeelii",
    "phone": "Bilbila",
    "password": "Jecha iccitii",
    "confirm_password": "Jecha iccitii mirkaneessi",
    "full_name": "Maqaa guutuu",
    "i_am_looking": "Waan barbaaduu ture ........",
    "buy_or_sell_house": "Mana bituu yookiin gurguruu",
    "buy_or_sell_vehicle": "Makiinaa bituu yookiin gurguruu",
    "our_service": "Tajaajila keenya",
    "how_to_buy": "Akkamitti bituu",
    "how_to_sell": "Akkamitti gurguruu",
    "already_have_account": "Akaawuntii qabdaa?",
    "new_to_dawolife": "DawoLife haaraa?",
    "sign_in_link": "Seeni",
    "create_account_link": "Akaawuntii uumi",
    "choose_account_type": "DawoLife irratti hirmaadhu",
    "buyer_user": "Bituu / Fayyadamaa",
    "buyer_user_desc": "Ilaali, qusachiisi fi ergaa ergeessa",
    "seller_agent": "Gurguraa / Erijantii",
    "seller_agent_desc": "Qabeenya maxxansi fi daldala kee guddisi",
  },
}

interface I18nContextType {
  lang: Language
  setLang: (l: Language) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextType>({
  lang: "en",
  setLang: () => {},
  t: (key: string) => key,
})

export function useI18n() {
  return useContext(I18nContext)
}

function readStoredLang(): Language {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === "en" || stored === "am" || stored === "om") return stored
  } catch {}
  return "en"
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("en")

  useEffect(() => {
    setLangState(readStoredLang())
  }, [])

  function setLang(l: Language) {
    setLangState(l)
    try {
      window.localStorage.setItem(STORAGE_KEY, l)
    } catch {}
  }

  function t(key: string) {
    return STRINGS[lang][key] || STRINGS.en[key] || key
  }

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>
}
