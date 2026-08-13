/**
 * CrimeGPT-X — Site-wide UI language (English / Hindi / Gujarati).
 *
 * Scope is deliberately narrow: navigation, top bar, and page
 * headers/toolbars. Page body content (case data, tables, AI analysis
 * output, forms) stays in English — translating that would mean hand
 * -translating dynamic, backend-sourced content, which is a different
 * problem from this static UI-chrome dictionary.
 *
 * Unrelated to the per-document language picker on the Documents page
 * (see lib/demo/translate.ts + docsAPI.generate), which translates
 * generated legal document content, not the app's own UI.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Language = 'en' | 'hi' | 'gu'

export const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'gu', label: 'ગુજરાતી' },
]

interface LanguageState {
  language: Language
  setLanguage: (language: Language) => void
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (language) => set({ language }),
    }),
    { name: 'crimegpt-language' }
  )
)

type Vars = Record<string, string | number>

const en = {
  'nav.dashboard': 'Dashboard',
  'nav.groupInvestigation': 'Investigation',
  'nav.allCases': 'All Cases',
  'nav.newCase': 'New Case',
  'nav.firUpload': 'FIR Upload & OCR',
  'nav.groupAiIntelligence': 'AI Intelligence',
  'nav.aiLegalAnalysis': 'AI Legal Analysis',
  'nav.legalSearch': 'Legal Search',
  'nav.cyberDetection': 'Cyber Detection',
  'nav.groupEvidenceReports': 'Evidence & Reports',
  'nav.evidence': 'Evidence',
  'nav.reportsDocuments': 'Reports & Documents',
  'nav.caseDiary': 'Case Diary / Timeline',
  'nav.groupCommand': 'Command',
  'nav.analytics': 'Analytics',
  'nav.adminPanel': 'Admin Panel',
  'nav.tagline': 'Police Intelligence Platform',
  'nav.settings': 'Settings',
  'nav.signOut': 'Sign Out',
  'nav.collapse': 'Collapse',
  'nav.expandSidebar': 'Expand sidebar',
  'nav.collapseSidebar': 'Collapse sidebar',

  'common.searchPlaceholder': 'Search cases...',
  'common.searchHint': 'Search by case ID, FIR number, victim, or accused name',
  'common.searching': 'Searching…',
  'common.noResults': 'No cases found',
  'common.notifications': 'Notifications',
  'common.signedInAs': 'Signed in as {name}',
  'common.profile': 'Profile',
  'common.language': 'Language',

  'demo.liveDemo': 'Live Demo',
  'demo.liveDemoDesc': 'viewing sample data. All actions are read-only.',
  'demo.exitDemo': 'Exit Demo',

  'dashboard.title': 'Command Dashboard',
  'dashboard.subtitle': '{branch} · Welcome back, {name}',
  'dashboard.newCase': '+ New Case',

  'cases.title': 'Case Registry',
  'cases.subtitle': 'All investigations — {branch}',
  'cases.registerNewCase': 'Register New Case',

  'casesNew.title': 'Register New Case',
  'casesNew.subtitle': 'Single entry — all documents auto-populate from this data',
  'casesNew.autoId': 'Auto ID:',

  'caseDetail.aiLegalAnalysis': 'AI Legal Analysis',

  'fir.title': 'FIR Upload & OCR Extraction',
  'fir.subtitle': 'Upload FIR — real OCR extracts fields from the document',

  'legal.title': 'AI Legal Intelligence Engine',
  'legal.subtitleDefault': 'Select a case, or analyze free-form FIR text',

  'judgments.title': 'Landmark Judgment Search',
  'judgments.subtitle': 'RAG-powered semantic search across an ingested corpus of real Indian case law',

  'cyber.title': 'Cyber Crime Detection Engine',
  'cyber.subtitle': 'AI-powered pattern detection for digital fraud',

  'evidence.title': 'Digital Evidence Vault',
  'evidence.subtitleEmpty': 'Select a case to view its evidence',
  'evidence.subtitleCase': 'Case {id} — SHA-256 verified, chain of custody maintained',

  'documents.title': 'Document Generation Engine',
  'documents.subtitleEmpty': 'Select a case to generate documents',
  'documents.subtitleCase': 'Case {id} — AI auto-populates all fields from case data',
  'documents.generateAll': 'Generate All (8 Docs)',
  'documents.languageLabel': 'Document language:',

  'diary.title': 'Case Diary',
  'diary.titleCase': 'Case Diary — {id}',
  'diary.subtitle': 'Automated investigation timeline & audit trail',

  'analytics.title': 'Analytics & Intelligence',
  'analytics.subtitle': 'Department-level statistics — {branch}',
  'analytics.exportReport': 'Export Report',

  'admin.title': 'Administration Panel',
  'admin.subtitle': 'User management, audit logs, system configuration',

  'settings.title': 'Settings',
  'settings.subtitle': 'Manage your profile, security, and notification preferences',
}

const hi: Record<keyof typeof en, string> = {
  'nav.dashboard': 'डैशबोर्ड',
  'nav.groupInvestigation': 'अन्वेषण',
  'nav.allCases': 'सभी मामले',
  'nav.newCase': 'नया मामला',
  'nav.firUpload': 'एफआईआर अपलोड और ओसीआर',
  'nav.groupAiIntelligence': 'एआई इंटेलिजेंस',
  'nav.aiLegalAnalysis': 'एआई कानूनी विश्लेषण',
  'nav.legalSearch': 'कानूनी खोज',
  'nav.cyberDetection': 'साइबर डिटेक्शन',
  'nav.groupEvidenceReports': 'साक्ष्य और रिपोर्ट',
  'nav.evidence': 'साक्ष्य',
  'nav.reportsDocuments': 'रिपोर्ट और दस्तावेज़',
  'nav.caseDiary': 'मामला डायरी / समयरेखा',
  'nav.groupCommand': 'कमान',
  'nav.analytics': 'विश्लेषिकी',
  'nav.adminPanel': 'एडमिन पैनल',
  'nav.tagline': 'पुलिस इंटेलिजेंस प्लेटफ़ॉर्म',
  'nav.settings': 'सेटिंग्स',
  'nav.signOut': 'साइन आउट',
  'nav.collapse': 'संक्षिप्त करें',
  'nav.expandSidebar': 'साइडबार विस्तृत करें',
  'nav.collapseSidebar': 'साइडबार संक्षिप्त करें',

  'common.searchPlaceholder': 'मामले खोजें...',
  'common.searchHint': 'मामला आईडी, एफआईआर नंबर, पीड़ित या आरोपी के नाम से खोजें',
  'common.searching': 'खोजा जा रहा है…',
  'common.noResults': 'कोई मामला नहीं मिला',
  'common.notifications': 'सूचनाएं',
  'common.signedInAs': '{name} के रूप में साइन इन है',
  'common.profile': 'प्रोफ़ाइल',
  'common.language': 'भाषा',

  'demo.liveDemo': 'लाइव डेमो',
  'demo.liveDemoDesc': 'नमूना डेटा देखा जा रहा है। सभी क्रियाएं केवल पढ़ने योग्य हैं।',
  'demo.exitDemo': 'डेमो से बाहर निकलें',

  'dashboard.title': 'कमान डैशबोर्ड',
  'dashboard.subtitle': '{branch} · वापसी पर स्वागत है, {name}',
  'dashboard.newCase': '+ नया मामला',

  'cases.title': 'मामला रजिस्ट्री',
  'cases.subtitle': 'सभी जांच — {branch}',
  'cases.registerNewCase': 'नया मामला दर्ज करें',

  'casesNew.title': 'नया मामला दर्ज करें',
  'casesNew.subtitle': 'एकल प्रविष्टि — सभी दस्तावेज़ इस डेटा से स्वतः भर जाते हैं',
  'casesNew.autoId': 'स्वतः आईडी:',

  'caseDetail.aiLegalAnalysis': 'एआई कानूनी विश्लेषण',

  'fir.title': 'एफआईआर अपलोड और ओसीआर निष्कर्षण',
  'fir.subtitle': 'एफआईआर अपलोड करें — वास्तविक ओसीआर दस्तावेज़ से फ़ील्ड निकालता है',

  'legal.title': 'एआई कानूनी इंटेलिजेंस इंजन',
  'legal.subtitleDefault': 'एक मामला चुनें, या फ्री-फॉर्म एफआईआर टेक्स्ट का विश्लेषण करें',

  'judgments.title': 'ऐतिहासिक निर्णय खोज',
  'judgments.subtitle': 'वास्तविक भारतीय केस लॉ के संग्रह में RAG-संचालित सिमेंटिक खोज',

  'cyber.title': 'साइबर अपराध डिटेक्शन इंजन',
  'cyber.subtitle': 'डिजिटल धोखाधड़ी के लिए एआई-संचालित पैटर्न डिटेक्शन',

  'evidence.title': 'डिजिटल साक्ष्य तिजोरी',
  'evidence.subtitleEmpty': 'साक्ष्य देखने के लिए एक मामला चुनें',
  'evidence.subtitleCase': 'मामला {id} — SHA-256 सत्यापित, कस्टडी की श्रृंखला बनी हुई है',

  'documents.title': 'दस्तावेज़ निर्माण इंजन',
  'documents.subtitleEmpty': 'दस्तावेज़ बनाने के लिए एक मामला चुनें',
  'documents.subtitleCase': 'मामला {id} — एआई मामले के डेटा से सभी फ़ील्ड स्वतः भरता है',
  'documents.generateAll': 'सभी बनाएं (8 दस्तावेज़)',
  'documents.languageLabel': 'दस्तावेज़ की भाषा:',

  'diary.title': 'मामला डायरी',
  'diary.titleCase': 'मामला डायरी — {id}',
  'diary.subtitle': 'स्वचालित अन्वेषण समयरेखा और ऑडिट ट्रेल',

  'analytics.title': 'विश्लेषिकी और इंटेलिजेंस',
  'analytics.subtitle': 'विभाग-स्तरीय आँकड़े — {branch}',
  'analytics.exportReport': 'रिपोर्ट निर्यात करें',

  'admin.title': 'प्रशासन पैनल',
  'admin.subtitle': 'उपयोगकर्ता प्रबंधन, ऑडिट लॉग, सिस्टम कॉन्फ़िगरेशन',

  'settings.title': 'सेटिंग्स',
  'settings.subtitle': 'अपनी प्रोफ़ाइल, सुरक्षा और सूचना प्राथमिकताएं प्रबंधित करें',
}

const gu: Record<keyof typeof en, string> = {
  'nav.dashboard': 'ડેશબોર્ડ',
  'nav.groupInvestigation': 'તપાસ',
  'nav.allCases': 'બધા કેસ',
  'nav.newCase': 'નવો કેસ',
  'nav.firUpload': 'એફઆઈઆર અપલોડ અને OCR',
  'nav.groupAiIntelligence': 'AI ઈન્ટેલિજન્સ',
  'nav.aiLegalAnalysis': 'AI કાનૂની વિશ્લેષણ',
  'nav.legalSearch': 'કાનૂની શોધ',
  'nav.cyberDetection': 'સાયબર ડિટેક્શન',
  'nav.groupEvidenceReports': 'પુરાવા અને અહેવાલો',
  'nav.evidence': 'પુરાવો',
  'nav.reportsDocuments': 'અહેવાલો અને દસ્તાવેજો',
  'nav.caseDiary': 'કેસ ડાયરી / ટાઈમલાઈન',
  'nav.groupCommand': 'કમાન્ડ',
  'nav.analytics': 'એનાલિટિક્સ',
  'nav.adminPanel': 'એડમિન પેનલ',
  'nav.tagline': 'પોલીસ ઈન્ટેલિજન્સ પ્લેટફોર્મ',
  'nav.settings': 'સેટિંગ્સ',
  'nav.signOut': 'સાઇન આઉટ',
  'nav.collapse': 'સંકુચિત કરો',
  'nav.expandSidebar': 'સાઇડબાર વિસ્તૃત કરો',
  'nav.collapseSidebar': 'સાઇડબાર સંકુચિત કરો',

  'common.searchPlaceholder': 'કેસ શોધો...',
  'common.searchHint': 'કેસ આઈડી, એફઆઈઆર નંબર, પીડિત અથવા આરોપીના નામથી શોધો',
  'common.searching': 'શોધી રહ્યાં છીએ…',
  'common.noResults': 'કોઈ કેસ મળ્યો નથી',
  'common.notifications': 'સૂચનાઓ',
  'common.signedInAs': '{name} તરીકે સાઇન ઇન છે',
  'common.profile': 'પ્રોફાઇલ',
  'common.language': 'ભાષા',

  'demo.liveDemo': 'લાઈવ ડેમો',
  'demo.liveDemoDesc': 'નમૂના ડેટા જોઈ રહ્યાં છો. બધી ક્રિયાઓ ફક્ત-વાંચી શકાય તેવી છે.',
  'demo.exitDemo': 'ડેમોમાંથી બહાર નીકળો',

  'dashboard.title': 'કમાન્ડ ડેશબોર્ડ',
  'dashboard.subtitle': '{branch} · પાછા સ્વાગત છે, {name}',
  'dashboard.newCase': '+ નવો કેસ',

  'cases.title': 'કેસ રજિસ્ટ્રી',
  'cases.subtitle': 'બધી તપાસ — {branch}',
  'cases.registerNewCase': 'નવો કેસ નોંધો',

  'casesNew.title': 'નવો કેસ નોંધો',
  'casesNew.subtitle': 'એક જ એન્ટ્રી — બધા દસ્તાવેજો આ ડેટામાંથી આપમેળે ભરાય છે',
  'casesNew.autoId': 'ઑટો આઈડી:',

  'caseDetail.aiLegalAnalysis': 'AI કાનૂની વિશ્લેષણ',

  'fir.title': 'એફઆઈઆર અપલોડ અને OCR નિષ્કર્ષણ',
  'fir.subtitle': 'એફઆઈઆર અપલોડ કરો — વાસ્તવિક OCR દસ્તાવેજમાંથી ફીલ્ડ કાઢે છે',

  'legal.title': 'AI કાનૂની ઈન્ટેલિજન્સ એન્જિન',
  'legal.subtitleDefault': 'એક કેસ પસંદ કરો, અથવા ફ્રી-ફોર્મ એફઆઈઆર ટેક્સ્ટનું વિશ્લેષણ કરો',

  'judgments.title': 'સીમાચિહ્ન ચુકાદો શોધ',
  'judgments.subtitle': 'વાસ્તવિક ભારતીય કેસ લૉના સંગ્રહમાં RAG-સંચાલિત સિમેન્ટિક શોધ',

  'cyber.title': 'સાયબર ક્રાઈમ ડિટેક્શન એન્જિન',
  'cyber.subtitle': 'ડિજિટલ છેતરપિંડી માટે AI-સંચાલિત પેટર્ન ડિટેક્શન',

  'evidence.title': 'ડિજિટલ પુરાવો તિજોરી',
  'evidence.subtitleEmpty': 'પુરાવો જોવા માટે એક કેસ પસંદ કરો',
  'evidence.subtitleCase': 'કેસ {id} — SHA-256 ચકાસાયેલ, કસ્ટડીની સાંકળ જળવાયેલી છે',

  'documents.title': 'દસ્તાવેજ જનરેશન એન્જિન',
  'documents.subtitleEmpty': 'દસ્તાવેજો બનાવવા માટે એક કેસ પસંદ કરો',
  'documents.subtitleCase': 'કેસ {id} — AI કેસ ડેટામાંથી બધા ફીલ્ડ આપમેળે ભરે છે',
  'documents.generateAll': 'બધા બનાવો (8 દસ્તાવેજ)',
  'documents.languageLabel': 'દસ્તાવેજની ભાષા:',

  'diary.title': 'કેસ ડાયરી',
  'diary.titleCase': 'કેસ ડાયરી — {id}',
  'diary.subtitle': 'સ્વયંસંચાલિત તપાસ ટાઈમલાઈન અને ઓડિટ ટ્રેલ',

  'analytics.title': 'એનાલિટિક્સ અને ઈન્ટેલિજન્સ',
  'analytics.subtitle': 'વિભાગ-સ્તરના આંકડા — {branch}',
  'analytics.exportReport': 'અહેવાલ નિકાસ કરો',

  'admin.title': 'વહીવટ પેનલ',
  'admin.subtitle': 'વપરાશકર્તા સંચાલન, ઓડિટ લોગ, સિસ્ટમ રૂપરેખાંકન',

  'settings.title': 'સેટિંગ્સ',
  'settings.subtitle': 'તમારી પ્રોફાઇલ, સુરક્ષા અને સૂચના પસંદગીઓ સંચાલિત કરો',
}

export type TranslationKey = keyof typeof en

const dictionaries: Record<Language, Record<TranslationKey, string>> = { en, hi, gu }

function interpolate(str: string, vars?: Vars): string {
  if (!vars) return str
  return str.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''))
}

export function useT() {
  const language = useLanguageStore(s => s.language)
  return (key: TranslationKey, vars?: Vars) => interpolate(dictionaries[language][key] ?? en[key], vars)
}
