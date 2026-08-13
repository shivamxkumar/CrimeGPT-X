/**
 * Client-side mirror of backend/app/services/multilingual_service.py, used
 * only in demo mode where there's no server to call for real translation.
 * Same glossary, same "annotate + banner" strategy — good enough to make
 * the language selector feel real without shipping a translation API key.
 */
export const SUPPORTED_LANGUAGES: Record<string, string> = {
  en: 'English',
  hi: 'हिन्दी',
  gu: 'ગુજરાતી',
}

const LEGAL_GLOSSARY: Record<string, { hi: string; gu: string }> = {
  Chargesheet: { hi: 'आरोप पत्र', gu: 'આરોપ પત્ર' },
  FIR: { hi: 'प्रथम सूचना रिपोर्ट', gu: 'પ્રથમ માહિતી અહેવાલ' },
  Complainant: { hi: 'शिकायतकर्ता', gu: 'ફરિયાદી' },
  Victim: { hi: 'पीड़ित', gu: 'પીડિત' },
  Accused: { hi: 'आरोपी', gu: 'આરોપી' },
  Evidence: { hi: 'साक्ष्य', gu: 'પુરાવો' },
  Witness: { hi: 'गवाह', gu: 'સાક્ષી' },
  'Investigating Officer': { hi: 'अन्वेषण अधिकारी', gu: 'તપાસ અધિકારી' },
  'Police Station': { hi: 'पुलिस स्टेशन', gu: 'પોલીસ સ્ટેશન' },
  Remand: { hi: 'रिमांड', gu: 'રિમાન્ડ' },
  Seizure: { hi: 'जब्ती', gu: 'જ‌પ્તી' },
  Arrest: { hi: 'गिरफ्तारी', gu: 'ધરપકડ' },
  'Digital Evidence': { hi: 'डिजिटल साक्ष्य', gu: 'ડિજિટલ પુરાવો' },
  Panchanama: { hi: 'पंचनामा', gu: 'પંચનામું' },
  'Facts of the Case': { hi: 'मामले के तथ्य', gu: 'કેસની હકીકતો' },
  'Amount Involved': { hi: 'शामिल राशि', gu: 'સંકળાયેલી રકમ' },
}

function glossaryAnnotate(html: string, targetLang: 'hi' | 'gu'): string {
  let result = html
  for (const [term, translations] of Object.entries(LEGAL_GLOSSARY)) {
    if (result.includes(term)) {
      result = result.split(term).join(`${term} (${translations[targetLang]})`)
    }
  }
  return result
}

/** Mirrors multilingual_service.translate_document(): banner + glossary annotation, English legal text kept intact for accuracy. */
export function translateDemoDocument(html: string, targetLang: string): string {
  if (targetLang === 'en' || !(targetLang === 'hi' || targetLang === 'gu')) return html
  const langName = SUPPORTED_LANGUAGES[targetLang]
  const banner = `<div style="background:#f0f8ff;border:1px solid #c8d8e8;padding:10px 16px;margin-bottom:16px;font-size:12px;border-radius:6px">
    <strong>Language / भाषा / ભાષા:</strong> ${langName} |
    This document has been partially translated. Legal sections remain in English for accuracy.
  </div>`
  return banner + glossaryAnnotate(html, targetLang)
}
