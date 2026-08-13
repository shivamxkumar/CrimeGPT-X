/**
 * CrimeGPT-X — Demo Mode Mock Data
 *
 * A fully self-contained, internally-consistent dataset for "Explore Live
 * Demo" — 20 realistic cyber crime cases (Ahmedabad Cyber Crime Branch),
 * each with FIR/OCR, AI legal analysis, evidence, generated documents, and
 * a case diary. Nothing here ever touches the real backend. Dates are
 * computed relative to "now" at import time so the demo always looks
 * current, not stuck on a fixed past date.
 */
import {
  Case, CaseListItem, CaseStatus, CasePriority, CrimeCategory,
  Evidence, EvidenceType, EvidenceCategory, CustodyEntry,
  Document, DocumentType, DiaryEntry, DiaryEntryType,
  Witness, LegalSection, Judgment, User, AIAnalysisResult,
} from '@/types'

// ── Time helpers ────────────────────────────────────────────────
const NOW = Date.now()
const DAY = 86400000
const daysAgo = (n: number) => new Date(NOW - n * DAY).toISOString()
const hoursAfter = (iso: string, h: number) => new Date(new Date(iso).getTime() + h * 3600000).toISOString()

function sha256Like(seed: string): string {
  // Deterministic 64-hex-char placeholder derived from a seed string — looks
  // like a real SHA-256 digest without needing an actual hashing dependency.
  let h1 = 0x811c9dc5, h2 = 0x1000193
  for (let i = 0; i < seed.length; i++) {
    const c = seed.charCodeAt(i)
    h1 = (h1 ^ c) * 0x01000193 >>> 0
    h2 = (h2 ^ c) * 0x85ebca6b >>> 0
  }
  const hex = (n: number) => n.toString(16).padStart(8, '0')
  return (hex(h1) + hex(h2) + hex(h1 ^ h2) + hex(h1 + h2) + hex(h1 * 3) + hex(h2 * 7) + hex(h1 ^ 0xdead) + hex(h2 ^ 0xbeef)).slice(0, 64)
}

// ── Demo officer identity ───────────────────────────────────────
export const DEMO_OFFICER: User = {
  id: 'demo-officer-001',
  badge_number: 'AHM-DEMO-IO-001',
  name: 'SI Kavita Rathod',
  email: 'kavita.rathod@demo.crimegpt-x.online',
  phone: '9825199001',
  role: 'io',
  police_station: 'Ahmedabad Cyber Crime Branch',
  rank: 'Sub-Inspector',
  is_active: true,
  last_login: new Date(NOW).toISOString(),
  created_at: daysAgo(400),
}

// ── Shared landmark judgments pool ──────────────────────────────
const JUDGMENT_POOL: Record<string, Judgment> = {
  sharat_babu: {
    title: 'Sharat Babu Digumarti vs. State (NCT of Delhi)',
    court: 'Supreme Court of India',
    year: '2016',
    citation: '(2017) 2 SCC 18',
    summary: 'Held that once conduct is covered by a specific IT Act provision, prosecution must proceed under that special law rather than general IPC/BNS provisions for the same act, guiding which sections to press for electronic-record offences.',
    legal_relevance: 'Directly relevant to charge-framing where digital fraud overlaps IT Act Section 66C/66D and BNS cheating provisions — establishes the special-law-prevails principle used in this case\'s chargesheet.',
    relevance_score: 0.91,
  },
  anvar_pv: {
    title: 'Anvar P.V. vs. P.K. Basheer & Ors.',
    court: 'Supreme Court of India',
    year: '2014',
    citation: '(2014) 10 SCC 473',
    summary: 'Mandated a Section 65B (BSA Section 63) certificate for admissibility of electronic evidence such as call records, screenshots, and chat exports, overruling earlier permissive practice.',
    legal_relevance: 'Establishes the mandatory certification requirement applied to the WhatsApp chat export and bank SMS screenshots seized in this case, cited in the chargesheet\'s evidence-admissibility note.',
    relevance_score: 0.88,
  },
  shreya_singhal: {
    title: 'Shreya Singhal vs. Union of India',
    court: 'Supreme Court of India',
    year: '2015',
    citation: '(2015) 5 SCC 1',
    summary: 'Struck down IT Act Section 66A while upholding Sections 66C/66D/67 as constitutionally valid tools against identity theft, impersonation, and obscene electronic content.',
    legal_relevance: 'Confirms the constitutional validity of the identity-theft and impersonation sections invoked against the accused for spoofed bank/government communication.',
    relevance_score: 0.79,
  },
  gagan_harsh: {
    title: 'Gagan Harsh Sharma vs. State of Maharashtra',
    court: 'Bombay High Court',
    year: '2018',
    citation: '2019 CriLJ 1398',
    summary: 'Clarified the scope of unauthorized access and data theft offences under IT Act Section 43/66 in an employer-employee cyber-trespass context, relevant to remote-access-tool cases.',
    legal_relevance: 'Applied to establish unauthorized computer access as a standalone offence alongside the cheating charge where a remote-access app was used to drain the victim\'s account.',
    relevance_score: 0.74,
  },
  vinod_kaushik: {
    title: 'Vinod Kaushik vs. Madhvika Joshi',
    court: 'Adjudicating Officer, IT Act',
    year: '2011',
    citation: 'CC No. 2 of 2011',
    summary: 'Awarded compensation under IT Act Section 43 for unauthorized access to a private email account, an early precedent on civil liability for account compromise.',
    legal_relevance: 'Supports the victim\'s compensation claim alongside the criminal prosecution for the unauthorized account access component of the fraud.',
    relevance_score: 0.68,
  },
  state_v_azeez: {
    title: 'State of Tamil Nadu vs. Suhas Katti',
    court: "Chennai Metropolitan Magistrate's Court",
    year: '2004',
    citation: 'CC No. 4680 of 2004',
    summary: 'One of India\'s earliest cyber-crime convictions, establishing that harassment and defamation conducted purely through electronic messages is fully prosecutable and evidentially provable via message logs.',
    legal_relevance: 'Cited as precedent for the sextortion/harassment case, confirming that message-log evidence alone is sufficient to sustain a conviction.',
    relevance_score: 0.82,
  },
}

// ── AI legal sections builder ───────────────────────────────────
function bnsSections(...defs: [string, string, string, number, string][]): LegalSection[] {
  return defs.map(([section, title, description, confidence, act]) => ({ section, title, description, confidence, act }))
}

// ── Names / locations pools (Gujarat context) ───────────────────
const VICTIMS = [
  'Rajendra Bhai Patel', 'Meera Shah', 'Kiran Bhai Chauhan', 'Nisha Desai', 'Ashok Bhai Modi',
  'Priyanka Trivedi', 'Vikram Bhai Solanki', 'Rekha Joshi', 'Mahesh Bhai Parmar', 'Sonal Gandhi',
  'Dinesh Bhai Rana', 'Kavya Mehta', 'Suresh Bhai Vaghela', 'Anjali Pandya', 'Bharat Bhai Thakor',
  'Deepa Bhatt', 'Naresh Bhai Chavda', 'Ritu Doshi', 'Girish Bhai Zala', 'Falguni Vora',
]
const AREAS = [
  'Navrangpura, Ahmedabad', 'Satellite, Ahmedabad', 'Maninagar, Ahmedabad', 'Bopal, Ahmedabad',
  'Vastrapur, Ahmedabad', 'Chandkheda, Ahmedabad', 'Naranpura, Ahmedabad', 'Paldi, Ahmedabad',
  'Gota, Ahmedabad', 'Thaltej, Ahmedabad', 'Ghatlodia, Ahmedabad', 'Vejalpur, Ahmedabad',
]

let seq = 0
function nextCaseId(): string {
  seq += 1
  return `CC/2026/${String(800 + seq).padStart(4, '0')}`
}

interface CaseSeed {
  category: CrimeCategory
  status: CaseStatus
  priority: CasePriority
  daysAgo: number
  victim: string
  accused: string
  accusedMode: string
  amount: number
  narrative: string
  location: string
  sections: LegalSection[]
  judgmentKeys: (keyof typeof JUDGMENT_POOL)[]
  crimeTypeDetected: string
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  riskScore: number
  riskFactors: string[]
  keyFacts: string[]
  recommendations: string[]
  witnesses: Witness[]
}

const CASE_SEEDS: CaseSeed[] = [
  {
    category: 'upi_fraud', status: 'chargesheet', priority: 'high', daysAgo: 38,
    victim: VICTIMS[0], accused: 'Rohit Kumar (alias)', accusedMode: 'UPI QR Code',
    amount: 185000, location: AREAS[0],
    narrative: 'Victim listed a used refrigerator on OLX. A buyer claiming to be an Army officer posted at the border insisted on paying via a "collect" QR code sent over WhatsApp, claiming it was required for advance payment verification. Victim scanned the QR code expecting to receive money; instead ₹1,85,000 was debited from his linked bank account across three consecutive UPI transactions within four minutes.',
    sections: bnsSections(
      ['BNS 318(4)', 'Cheating by personation', 'Whoever cheats by pretending to be some other person, or by knowingly substituting one person for another, commits cheating by personation.', 92, 'BNS'],
      ['IT Act 66D', 'Cheating by personation using computer resource', 'Punishment for cheating by personation by using computer resource — covers UPI/QR-based impersonation fraud.', 89, 'IT Act'],
      ['BNS 316(2)', 'Criminal breach of trust', 'Applies where the accused induced trust through false representation to gain financial advantage.', 71, 'BNS'],
    ),
    judgmentKeys: ['sharat_babu', 'anvar_pv'],
    crimeTypeDetected: 'UPI/QR Code Reverse-Scan Fraud',
    riskLevel: 'high', riskScore: 78,
    riskFactors: ['Multiple rapid transactions suggest an organized fraud ring', 'Mule account likely used for fund layering', 'Accused phone number is a VoIP/virtual number, hard to trace geographically'],
    keyFacts: ['Fraud executed via OLX marketplace contact', 'Three UPI debits within 4 minutes totalling ₹1,85,000', 'Accused impersonated defence personnel to build urgency and trust'],
    recommendations: ['Issue Section 91 BNSS notice to the UPI PSP for transaction trail and linked bank details', 'Request account freeze on the beneficiary account via the bank\'s nodal cyber cell officer', 'Trace the VoIP number provider for subscriber KYC records', 'Check the OLX listing metadata for IP/device fingerprint of the buyer account'],
    witnesses: [{ name: 'Ramesh Bhai Patel', phone: '9825100101', address: AREAS[0], statement: 'Neighbour who was present when the victim received the fraudulent call and can confirm the timeline.' }],
  },
  {
    category: 'phishing', status: 'active', priority: 'high', daysAgo: 12,
    victim: VICTIMS[1], accused: 'Unknown', accusedMode: 'Fake Website',
    amount: 92500, location: AREAS[1],
    narrative: 'Victim received an SMS claiming her bank KYC would expire within 24 hours, with a link to "re-verify". The link led to a pixel-perfect clone of her bank\'s net-banking portal. She entered her login credentials, PIN, and received-and-entered a fraudulent OTP, after which ₹92,500 was transferred out via IMPS to an unfamiliar account.',
    sections: bnsSections(
      ['IT Act 66C', 'Identity theft', 'Fraudulent use of another person\'s electronic signature, password, or unique identification feature.', 94, 'IT Act'],
      ['IT Act 66D', 'Cheating by personation using computer resource', 'The cloned banking portal constitutes personation of a legitimate financial institution to extract credentials.', 91, 'IT Act'],
      ['BNS 318(4)', 'Cheating by personation', 'The SMS and clone site together constitute a deliberate personation scheme to induce the victim to part with money.', 85, 'BNS'],
    ),
    judgmentKeys: ['shreya_singhal', 'sharat_babu'],
    crimeTypeDetected: 'Banking Phishing / Credential Harvesting',
    riskLevel: 'high', riskScore: 74,
    riskFactors: ['Phishing domain closely mimics real bank branding — high victim-conversion risk to others', 'IMPS transfer is near-instant and harder to reverse than NEFT/RTGS', 'SMS sender ID was spoofed to appear as the bank\'s official ID'],
    keyFacts: ['SMS phishing (smishing) with urgency-based KYC expiry pretext', 'Credentials and OTP both compromised via the clone site', 'Single IMPS transfer of ₹92,500 to a third-party account'],
    recommendations: ['Request domain takedown via CERT-In for the phishing URL', 'Obtain SMS gateway/sender-ID registration records to trace the spoofing source', 'Coordinate with bank fraud team to freeze the beneficiary account before further layering', 'Preserve the phishing SMS and clone-site screenshots with hash verification'],
    witnesses: [],
  },
  {
    category: 'investment_scam', status: 'in_review', priority: 'critical', daysAgo: 25,
    victim: VICTIMS[2], accused: 'Vikas Trading Solutions (fictitious entity)', accusedMode: 'Fake Investment App',
    amount: 720000, location: AREAS[2],
    narrative: 'Victim was added to a WhatsApp group promising guaranteed 15% monthly returns on a "US stock arbitrage" scheme, promoted by an admin posing as a SEBI-registered advisor. He was directed to install an app (outside the Play Store) showing a fabricated portfolio growing daily. After depositing ₹7,20,000 in tranches over six weeks, he was asked for a further "tax clearance" deposit to withdraw, at which point the group and app both went offline.',
    sections: bnsSections(
      ['BNS 316(2)', 'Criminal breach of trust', 'Funds were entrusted based on false representation of a legitimate investment scheme and misappropriated.', 90, 'BNS'],
      ['BNS 61(2)', 'Criminal conspiracy', 'Multiple coordinated actors (group admin, "support" agents) acted in concert to execute the scheme.', 83, 'BNS'],
      ['IT Act 66D', 'Cheating by personation using computer resource', 'The fake trading app and fabricated SEBI-advisor persona were used to cheat via computer resource.', 87, 'IT Act'],
    ),
    judgmentKeys: ['sharat_babu', 'gagan_harsh'],
    crimeTypeDetected: 'Fake Trading App / Ponzi Investment Scam',
    riskLevel: 'critical', riskScore: 91,
    riskFactors: ['Large sum with a well-organized multi-actor operation', 'Sideloaded app suggests deliberate evasion of Play Store fraud detection', 'Victim was pressured into an additional "tax clearance" payment — classic pig-butchering escalation pattern', 'Likely part of a larger scam network targeting multiple victims'],
    keyFacts: ['₹7,20,000 deposited across 9 transactions over 6 weeks', 'Fake app sideloaded via APK link, not on Play Store', 'Group and app went offline simultaneously once a further deposit was refused'],
    recommendations: ['Flag the case for coordination with the state Economic Offences Wing given scale', 'Trace the APK hosting server and app signing certificate for developer attribution', 'Issue lookout for other victims via public advisory — likely a multi-victim scheme', 'Request WhatsApp Business API records for the group admin\'s registered number'],
    witnesses: [{ name: 'Pankaj Bhai Oza', phone: '9825100203', statement: 'Another group member who lost ₹1,40,000 in the same scheme and can corroborate the group\'s operating pattern.' }],
  },
  {
    category: 'whatsapp_fraud', status: 'registered', priority: 'medium', daysAgo: 3,
    victim: VICTIMS[3], accused: 'Unknown', accusedMode: 'WhatsApp / Phone Call',
    amount: 45000, location: AREAS[3],
    narrative: 'Victim received a WhatsApp message from a number displaying her son\'s profile photo (scraped from social media), claiming his phone was damaged and he urgently needed money sent to a "friend\'s" account for a medical emergency. Trusting the familiar photo, she transferred ₹45,000 via UPI before calling her son directly and discovering the fraud.',
    sections: bnsSections(
      ['BNS 318(4)', 'Cheating by personation', 'The accused impersonated a family member using a scraped profile photo to induce urgent payment.', 88, 'BNS'],
      ['IT Act 66C', 'Identity theft', 'Unauthorized use of the son\'s photograph to fraudulently establish identity constitutes identity theft.', 80, 'IT Act'],
    ),
    judgmentKeys: ['shreya_singhal'],
    crimeTypeDetected: 'WhatsApp "Family Emergency" Impersonation Fraud',
    riskLevel: 'medium', riskScore: 52,
    riskFactors: ['Low traceability — new WhatsApp number, likely already discarded', 'Common fraud pattern targeting elderly/parent demographics'],
    keyFacts: ['Profile photo scraped from victim\'s son\'s public social media', 'Single UPI transfer of ₹45,000 under emergency pretext', 'Fraud discovered within an hour via direct call to son'],
    recommendations: ['Request WhatsApp account metadata (registration IP, linked email) via CERT-In liaison', 'Check UPI beneficiary account for prior fraud complaints (repeat mule account pattern)', 'Advise victim to file a formal complaint with the bank for possible reversal within the golden hour window'],
    witnesses: [],
  },
  {
    category: 'social_media', status: 'active', priority: 'medium', daysAgo: 18,
    victim: VICTIMS[4], accused: 'Priya_Verified_2024 (fake profile)', accusedMode: 'Social Media',
    amount: 38000, location: AREAS[4],
    narrative: 'Victim connected with a profile on Instagram claiming to run a boutique clothing business, offering festival-season bulk-order discounts requiring 50% advance payment. After paying ₹38,000 for a bulk saree order, the profile blocked him and the account was deleted. The listed business address does not exist.',
    sections: bnsSections(
      ['BNS 316(2)', 'Criminal breach of trust', 'Advance payment was obtained for goods with no intention to deliver, constituting misappropriation of entrusted funds.', 84, 'BNS'],
      ['BNS 318(2)', 'Cheating and dishonestly inducing delivery of property', 'The fake business listing dishonestly induced the victim to part with advance payment.', 86, 'BNS'],
    ),
    judgmentKeys: ['sharat_babu'],
    crimeTypeDetected: 'Social Media Marketplace Non-Delivery Fraud',
    riskLevel: 'medium', riskScore: 48,
    riskFactors: ['Account deletion suggests a repeat-offender pattern across multiple victims', 'Payment made to a personal UPI ID, not a registered business account'],
    keyFacts: ['Advance payment of ₹38,000 for goods never delivered', 'Seller profile and all posts deleted immediately after payment', 'Listed business address verified as non-existent'],
    recommendations: ['Request Instagram/Meta account data via the Meta Law Enforcement Portal', 'Trace the UPI ID\'s linked bank KYC for beneficiary identification', 'Cross-check the UPI ID against other cyber cell complaints for a serial-fraud pattern'],
    witnesses: [],
  },
  {
    category: 'otp_fraud', status: 'closed', priority: 'high', daysAgo: 61,
    victim: VICTIMS[5], accused: 'Sunil Yadav', accusedMode: 'OTP Sharing',
    amount: 156000, location: AREAS[5],
    narrative: 'Victim received a call from someone claiming to be a bank credit-card executive offering a "pre-approved" limit increase, requesting an OTP "only to confirm identity, never to be used for any transaction." She shared the OTP, resulting in a fraudulent international transaction of ₹1,56,000 flagged on her card. Case investigated, accused traced via bank withdrawal ATM CCTV, arrested, and chargesheet filed leading to conviction.',
    sections: bnsSections(
      ['IT Act 66C', 'Identity theft', 'OTP obtained under false pretext was used to authenticate an unauthorized transaction on the victim\'s identity.', 93, 'IT Act'],
      ['BNS 318(4)', 'Cheating by personation', 'The accused posed as a bank official to extract the OTP through deception.', 90, 'BNS'],
    ),
    judgmentKeys: ['anvar_pv', 'vinod_kaushik'],
    crimeTypeDetected: 'Credit Card OTP Vishing Fraud',
    riskLevel: 'low', riskScore: 15,
    riskFactors: ['Case resolved — accused convicted, risk factors retained for pattern reference only'],
    keyFacts: ['Fraudulent card-not-present transaction of ₹1,56,000 flagged internationally', 'Accused traced via ATM CCTV during cash withdrawal from mule account', 'Case concluded with chargesheet, trial, and conviction under IT Act 66C'],
    recommendations: ['Case closed — no further action required', 'Archive investigation file per retention policy'],
    witnesses: [{ name: 'Bank Nodal Officer — HDFC Fraud Cell', phone: '9825100305', statement: 'Provided transaction dispute records and international merchant chargeback documentation.' }],
  },
  {
    category: 'fake_app', status: 'court', priority: 'critical', daysAgo: 44,
    victim: VICTIMS[6], accused: 'Deepak Rawal', accusedMode: 'Remote Access Tool',
    amount: 310000, location: AREAS[6],
    narrative: 'Victim called a number found via a Google search for his bank\'s "customer care", actually a fraudulent listing. The fake agent instructed him to install "AnyDesk" for a supposed refund process, then used remote access to view his banking app and initiate transfers totalling ₹3,10,000 while the victim watched helplessly, believing it was a legitimate refund procedure.',
    sections: bnsSections(
      ['IT Act 66', 'Computer-related offences (unauthorized access)', 'Unauthorized access and control of the victim\'s device via remote-access tool to view and manipulate banking data.', 95, 'IT Act'],
      ['BNS 318(4)', 'Cheating by personation', 'Accused posed as bank customer care to establish trust before gaining remote device access.', 92, 'BNS'],
      ['BNS 305', 'Theft in dwelling house', 'Remote access to a device within the victim\'s home to extract funds parallels theft-in-dwelling principles applied to digital intrusion.', 61, 'BNS'],
    ),
    judgmentKeys: ['gagan_harsh', 'sharat_babu'],
    crimeTypeDetected: 'Remote Access Tool (AnyDesk/TeamViewer) Banking Fraud',
    riskLevel: 'critical', riskScore: 88,
    riskFactors: ['Fake customer-care listing indicates SEO/search poisoning tactics used at scale', 'Multiple bank transfers executed live during the remote session', 'Case now in trial — witness tampering risk flagged by prosecution'],
    keyFacts: ['Fraudulent "bank customer care" number found via search engine', 'AnyDesk installed granting full remote device control', 'Four transfers totalling ₹3,10,000 executed during a single 22-minute remote session'],
    recommendations: ['Case in active trial — ensure evidence chain-of-custody documentation is trial-ready', 'Coordinate with prosecution on AnyDesk session log subpoena from the vendor', 'Prepare victim and bank nodal officer for cross-examination scheduling'],
    witnesses: [{ name: 'Anita Rawal', phone: '9825100407', statement: 'Victim\'s spouse, present in the room during the fraudulent remote session, can testify to the sequence of events.' }],
  },
  {
    category: 'sextortion', status: 'active', priority: 'critical', daysAgo: 7,
    victim: VICTIMS[7], accused: 'Unknown (foreign number)', accusedMode: 'Social Media',
    amount: 25000, location: AREAS[7],
    narrative: 'Victim received a video call on WhatsApp from an unknown number showing an unclothed woman; the call was screen-recorded without his knowledge, morphed with his face, and used to demand ₹25,000 to prevent the video from being sent to his family and colleagues. He paid once before contacting the cyber cell, and the accused continued demanding further payments.',
    sections: bnsSections(
      ['BNS 308(2)', 'Extortion', 'Putting the victim in fear of reputational injury to dishonestly extract money constitutes extortion.', 94, 'BNS'],
      ['IT Act 66E', 'Violation of privacy', 'Capturing and circulating a morphed image/video without consent violates the victim\'s privacy under the IT Act.', 91, 'IT Act'],
      ['BNS 77', 'Voyeurism', 'Non-consensual recording during the video call for the purpose of exploitation falls under voyeurism provisions.', 79, 'BNS'],
    ),
    judgmentKeys: ['state_v_azeez', 'shreya_singhal'],
    crimeTypeDetected: 'WhatsApp Video-Call Sextortion',
    riskLevel: 'critical', riskScore: 85,
    riskFactors: ['Continued extortion demands after initial payment — high likelihood of escalation', 'International number suggests cross-border organized sextortion ring', 'Victim reports psychological distress requiring support referral'],
    keyFacts: ['Video call recorded and morphed within minutes of connecting', 'Single payment of ₹25,000 made before victim sought help', 'Accused continues to send threatening messages demanding further payment'],
    recommendations: ['Advise victim to cease all payment and communication immediately, preserve all messages', 'Request WhatsApp to preserve and disclose account data urgently under emergency disclosure process', 'Coordinate with I4C (Indian Cyber Crime Coordination Centre) given likely cross-border origin', 'Offer victim access to a counsellor through the victim support cell'],
    witnesses: [],
  },
  {
    category: 'ransomware', status: 'in_review', priority: 'critical', daysAgo: 21,
    victim: VICTIMS[8] + ' (Proprietor, Modi Textiles)', accused: 'Unknown', accusedMode: 'Email Phishing',
    amount: 850000, location: AREAS[8],
    narrative: 'An employee at the victim\'s small textile business opened an email attachment disguised as a GST invoice, deploying ransomware that encrypted the company\'s billing and inventory servers. A ransom note demanded ₹8,50,000 in cryptocurrency within 72 hours or the data would be permanently deleted and leaked. Business operations have been halted for six days.',
    sections: bnsSections(
      ['IT Act 66', 'Computer-related offences (unauthorized access)', 'Deploying ransomware to encrypt and hold data hostage constitutes unauthorized access and damage to computer systems.', 96, 'IT Act'],
      ['BNS 308(2)', 'Extortion', 'The ransom demand under threat of permanent data loss and leak constitutes extortion.', 93, 'BNS'],
      ['IT Act 43', 'Penalty for damage to computer system', 'Encryption of business-critical data without authorization causes quantifiable damage under this civil-liability provision, relevant to compensation claims.', 82, 'IT Act'],
    ),
    judgmentKeys: ['gagan_harsh'],
    crimeTypeDetected: 'Ransomware Extortion via Phishing Email',
    riskLevel: 'critical', riskScore: 89,
    riskFactors: ['Active ransom deadline creates time pressure for both victim and investigation', 'Cryptocurrency ransom demand significantly complicates fund tracing', 'Business continuity impact affects employees beyond the direct victim'],
    keyFacts: ['Ransomware deployed via a spoofed GST-invoice email attachment', 'All billing/inventory servers encrypted; 72-hour ransom deadline in cryptocurrency', 'Six consecutive business days of operational shutdown'],
    recommendations: ['Advise victim NOT to pay the ransom and to engage CERT-In\'s ransomware response team immediately', 'Preserve the ransomware binary and email headers for malware-family attribution', 'Request the cryptocurrency wallet address for blockchain-analytics tracing via I4C', 'Coordinate offline backup restoration guidance through CERT-In advisory channels'],
    witnesses: [{ name: 'Jignesh Bhai Modi', phone: '9825100509', statement: 'IT support contractor who first identified the ransomware and can provide technical incident details.' }],
  },
  {
    category: 'other', status: 'registered', priority: 'low', daysAgo: 1,
    victim: VICTIMS[9], accused: 'Unknown', accusedMode: 'Fake Website',
    amount: 4500, location: AREAS[9],
    narrative: 'Victim ordered a smartphone from an unfamiliar e-commerce website advertised via an Instagram ad at a heavily discounted price. Payment of ₹4,500 was made via card, but no product was ever shipped and the website became unreachable within a week, with no functioning customer support contact.',
    sections: bnsSections(
      ['BNS 318(2)', 'Cheating and dishonestly inducing delivery of property', 'Payment was induced for goods with no genuine intention to deliver, on a website set up for this purpose.', 76, 'BNS'],
    ),
    judgmentKeys: [],
    crimeTypeDetected: 'Fake E-Commerce Website Fraud',
    riskLevel: 'low', riskScore: 22,
    riskFactors: ['Small individual loss amount, but website pattern suggests many victims'],
    keyFacts: ['Discounted smartphone advertised via Instagram ad', 'Card payment of ₹4,500 made, no product shipped', 'Website went offline within a week of the transaction'],
    recommendations: ['Request domain registrar (WHOIS) details and hosting provider logs', 'Report the Instagram ad account for takedown', 'Cross-reference the website domain against national cyber crime portal for other complaints'],
    witnesses: [],
  },
  {
    category: 'upi_fraud', status: 'active', priority: 'medium', daysAgo: 9,
    victim: VICTIMS[10], accused: 'Unknown', accusedMode: 'UPI QR Code',
    amount: 67000, location: AREAS[10],
    narrative: 'A "customer" contacted the victim, a shopkeeper, about a bulk order and asked him to scan a QR code to "receive" a token advance of ₹5,000. Instead, the QR code was a payment-request code, and ₹67,000 was debited from his shop\'s UPI-linked account across two transactions before he realized the deception.',
    sections: bnsSections(
      ['BNS 318(4)', 'Cheating by personation', 'The buyer persona and fraudulent QR mechanism were used to deceive the shopkeeper into authorizing a debit.', 87, 'BNS'],
      ['IT Act 66D', 'Cheating by personation using computer resource', 'QR-code based deception executed entirely through computer/mobile resource.', 84, 'IT Act'],
    ),
    judgmentKeys: ['sharat_babu'],
    crimeTypeDetected: 'UPI Reverse-QR Merchant Fraud',
    riskLevel: 'medium', riskScore: 55,
    riskFactors: ['Merchant accounts are frequently targeted repeat victims of this specific pattern'],
    keyFacts: ['Fraudulent "receive payment" QR code presented as a "send" QR', 'Two debits totalling ₹67,000 from shop UPI account', 'Buyer phone number untraceable after the incident'],
    recommendations: ['Issue advisory to local merchant associations about reverse-QR scams', 'Request UPI app provider transaction logs for the fraudulent QR code metadata', 'Trace phone number registration details via telecom nodal officer'],
    witnesses: [{ name: 'Shop Assistant — Bharat Bhai', phone: '9825100611', statement: 'Present at the counter during the transaction, can corroborate the buyer\'s description.' }],
  },
  {
    category: 'phishing', status: 'registered', priority: 'medium', daysAgo: 4,
    victim: VICTIMS[11], accused: 'Unknown', accusedMode: 'Email Phishing',
    amount: 28000, location: AREAS[11],
    narrative: 'Victim received an email appearing to be from the Income Tax Department regarding a "pending refund", with a link to a form requesting bank account and card details to "process" the refund. She entered her details, and ₹28,000 was subsequently debited via an unauthorized card-not-present transaction.',
    sections: bnsSections(
      ['IT Act 66C', 'Identity theft', 'Card and account credentials fraudulently obtained via the fake refund form were used to authenticate an unauthorized transaction.', 88, 'IT Act'],
      ['IT Act 66D', 'Cheating by personation using computer resource', 'The email impersonated a government department to extract financial credentials.', 90, 'IT Act'],
    ),
    judgmentKeys: ['shreya_singhal'],
    crimeTypeDetected: 'Tax Refund Phishing Email',
    riskLevel: 'medium', riskScore: 50,
    riskFactors: ['Government-impersonation phishing tends to be part of a mass campaign, not an isolated attempt'],
    keyFacts: ['Email impersonated the Income Tax Department', 'Fake refund form captured card number, expiry, and CVV', 'Unauthorized card-not-present debit of ₹28,000 followed within hours'],
    recommendations: ['Report the phishing email and domain to CERT-In and the Income Tax Department\'s official cyber cell', 'Request card issuer to block and reissue the compromised card', 'Preserve email headers for sender-domain and originating-IP analysis'],
    witnesses: [],
  },
  {
    category: 'investment_scam', status: 'closed', priority: 'high', daysAgo: 74,
    victim: VICTIMS[12], accused: 'Ramesh Suthar', accusedMode: 'Fake Investment App',
    amount: 410000, location: AREAS[0],
    narrative: 'Victim was lured into a cryptocurrency "mining pool" investment via a Telegram channel promising fixed daily returns. After investing ₹4,10,000, withdrawal requests were repeatedly denied citing fabricated "network fees." Investigation traced the operator through a linked bank account used for the initial onboarding payment, leading to arrest and recovery of partial funds. Case closed after chargesheet and conviction.',
    sections: bnsSections(
      ['BNS 316(2)', 'Criminal breach of trust', 'Funds entrusted for investment were misappropriated under a fabricated withdrawal-fee pretext.', 89, 'BNS'],
      ['IT Act 66D', 'Cheating by personation using computer resource', 'The fake mining-pool platform was operated to cheat investors via computer resource.', 85, 'IT Act'],
    ),
    judgmentKeys: ['sharat_babu', 'gagan_harsh'],
    crimeTypeDetected: 'Cryptocurrency Mining Pool Ponzi Scheme',
    riskLevel: 'low', riskScore: 12,
    riskFactors: ['Case resolved — accused convicted, partial recovery achieved'],
    keyFacts: ['₹4,10,000 invested via a Telegram-promoted mining pool scheme', 'Withdrawal requests denied under fabricated fee pretexts', 'Operator traced via onboarding bank account, arrested, partial recovery of ₹1,60,000'],
    recommendations: ['Case closed — recovered funds returned to victim per court order', 'Archive investigation file per retention policy'],
    witnesses: [{ name: 'Cyber Cell Financial Analyst', phone: '9825100713', statement: 'Conducted the bank account trace that identified the accused.' }],
  },
  {
    category: 'whatsapp_fraud', status: 'active', priority: 'high', daysAgo: 15,
    victim: VICTIMS[13], accused: 'Unknown', accusedMode: 'WhatsApp / Phone Call',
    amount: 132000, location: AREAS[1],
    narrative: 'Victim received a WhatsApp call from someone claiming to be a courier company representative stating a parcel in her name contained illegal items and was flagged by customs; to "avoid arrest" she needed to transfer a "verification deposit" to a government escrow account. Panicked, she transferred ₹1,32,000 to the provided account.',
    sections: bnsSections(
      ['BNS 308(2)', 'Extortion', 'The threat of arrest was used to dishonestly induce a fear-driven payment, constituting extortion.', 90, 'BNS'],
      ['BNS 318(4)', 'Cheating by personation', 'Accused impersonated a courier company and law-enforcement-adjacent authority to extract payment.', 92, 'BNS'],
    ),
    judgmentKeys: ['shreya_singhal', 'sharat_babu'],
    crimeTypeDetected: '"Digital Arrest" / Courier-Customs Scam',
    riskLevel: 'high', riskScore: 76,
    riskFactors: ['Fear-based coercion tactic ("digital arrest") is a rapidly growing high-value fraud pattern', 'Beneficiary account likely part of a larger mule network'],
    keyFacts: ['Fraudulent courier/customs call with threat of arrest', 'Single transfer of ₹1,32,000 to a claimed "government escrow" account', 'No such courier consignment existed in the victim\'s name'],
    recommendations: ['Freeze the beneficiary account immediately via bank nodal officer to prevent further layering', 'Publish a public advisory on the "digital arrest" scam pattern', 'Request call detail records (CDR) for the WhatsApp-linked number'],
    witnesses: [],
  },
  {
    category: 'social_media', status: 'chargesheet', priority: 'medium', daysAgo: 33,
    victim: VICTIMS[14], accused: 'Rahul Bhai Makwana', accusedMode: 'Social Media',
    amount: 55000, location: AREAS[2],
    narrative: 'Victim was matched with a profile on a matrimonial-adjacent social platform; after weeks of conversation, the "match" claimed to be stranded abroad and in need of emergency funds for a medical procedure, requesting money via multiple small transfers to avoid suspicion. Total losses across 7 transfers reached ₹55,000 before the victim grew suspicious and stopped.',
    sections: bnsSections(
      ['BNS 318(4)', 'Cheating by personation', 'A fabricated romantic persona was used over an extended period to build trust before extracting money.', 86, 'BNS'],
      ['BNS 316(2)', 'Criminal breach of trust', 'Funds sent based on the trust built through the fabricated relationship were misappropriated.', 80, 'BNS'],
    ),
    judgmentKeys: ['sharat_babu'],
    crimeTypeDetected: 'Romance Scam ("Pig Butchering" Precursor Pattern)',
    riskLevel: 'medium', riskScore: 58,
    riskFactors: ['Structured small transfers indicate deliberate anti-detection tactics', 'Profile likely part of a larger romance-scam operation with multiple targets'],
    keyFacts: ['Weeks-long relationship built before financial requests began', 'Seven transfers totalling ₹55,000 structured to stay below reporting thresholds', 'Profile and all conversation history deleted after victim grew suspicious'],
    recommendations: ['Request platform account data and IP logs for the profile via lawful process', 'Trace all seven beneficiary accounts for a common mule-network pattern', 'Advise victim on emotional support resources given the relationship-based deception'],
    witnesses: [],
  },
  {
    category: 'otp_fraud', status: 'in_review', priority: 'high', daysAgo: 27,
    victim: VICTIMS[15], accused: 'Unknown', accusedMode: 'OTP Sharing',
    amount: 98000, location: AREAS[3],
    narrative: 'Victim received a call claiming to be from her mobile network provider about a SIM upgrade to 5G, requesting an OTP to "authorize" the upgrade. The OTP was actually for a SIM-swap request; her number was ported to a new SIM within hours, after which the accused used it to reset her banking app password and transfer ₹98,000.',
    sections: bnsSections(
      ['IT Act 66C', 'Identity theft', 'The SIM-swap exploited the victim\'s mobile identity to gain unauthorized access to her banking application.', 92, 'IT Act'],
      ['BNS 318(4)', 'Cheating by personation', 'Accused posed as the telecom provider to obtain the OTP enabling the fraudulent SIM swap.', 89, 'BNS'],
    ),
    judgmentKeys: ['anvar_pv'],
    crimeTypeDetected: 'SIM-Swap Banking Fraud',
    riskLevel: 'high', riskScore: 80,
    riskFactors: ['SIM-swap fraud typically indicates insider collusion at a telecom retail outlet', 'Victim lost both mobile and banking access simultaneously, delaying detection'],
    keyFacts: ['OTP obtained under 5G-upgrade pretext, actually authorized a SIM-swap', 'Victim\'s number ported to a new SIM within hours', 'Banking app password reset and ₹98,000 transferred using the hijacked number'],
    recommendations: ['Request telecom provider\'s SIM-swap authorization logs and retail outlet CCTV for the porting request', 'Investigate potential insider involvement at the telecom retail point', 'Request bank\'s device-binding and password-reset audit trail'],
    witnesses: [],
  },
  {
    category: 'fake_app', status: 'active', priority: 'high', daysAgo: 6,
    victim: VICTIMS[16], accused: 'Unknown', accusedMode: 'Fake Investment App',
    amount: 215000, location: AREAS[4],
    narrative: 'Victim downloaded a loan app via an SMS link offering instant personal loans with minimal documentation. After granting the requested contacts/gallery/SMS permissions, the app disbursed a small loan then began threatening the victim with morphed photos sent to his contacts unless he paid escalating "processing fees" — total extortion payments reached ₹2,15,000 over three weeks.',
    sections: bnsSections(
      ['BNS 308(2)', 'Extortion', 'Escalating fee demands under threat of circulating morphed images to contacts constitute extortion.', 93, 'BNS'],
      ['IT Act 66E', 'Violation of privacy', 'Unauthorized access to contacts/gallery and creation of morphed images violates privacy under the IT Act.', 90, 'IT Act'],
      ['IT Act 66', 'Computer-related offences (unauthorized access)', 'The app\'s excessive permission harvesting constitutes unauthorized access to device data beyond its stated function.', 84, 'IT Act'],
    ),
    judgmentKeys: ['gagan_harsh', 'state_v_azeez'],
    crimeTypeDetected: 'Predatory Loan App Extortion',
    riskLevel: 'high', riskScore: 81,
    riskFactors: ['App likely part of a network of similar predatory loan apps flagged nationally', 'Contacts of the victim were also contacted directly, expanding harm beyond the primary victim'],
    keyFacts: ['Loan app installed via SMS link, requested excessive device permissions', 'Morphed images created from gallery photos used for threats', '₹2,15,000 in extortion payments over three weeks across multiple demands'],
    recommendations: ['Report the app package to Google Play Protect / CERT-In for takedown', 'Request the app\'s backend server logs via the hosting provider for operator attribution', 'Advise victim\'s contacts who received threatening messages to preserve evidence for a joint complaint'],
    witnesses: [{ name: 'Contact who received threats — Yogesh Bhai', phone: '9825100815', statement: 'Received morphed images and threats directly from the accused, can corroborate the extortion pattern.' }],
  },
  {
    category: 'sextortion', status: 'closed', priority: 'critical', daysAgo: 88,
    victim: VICTIMS[17], accused: 'Manoj Kumar Sahani', accusedMode: 'Social Media',
    amount: 15000, location: AREAS[5],
    narrative: 'Victim was contacted by a fake profile on a social app, led into a compromising video call that was screen-recorded, followed by extortion demands. She paid ₹15,000 before reporting immediately to the cyber cell. Rapid response led to the accused\'s identification via linked payment account within 72 hours, arrest, and conviction after trial.',
    sections: bnsSections(
      ['BNS 308(2)', 'Extortion', 'Threat to circulate the recorded video to extract payment constitutes extortion.', 95, 'BNS'],
      ['IT Act 66E', 'Violation of privacy', 'Non-consensual recording and threatened circulation of the video violates privacy protections.', 92, 'IT Act'],
    ),
    judgmentKeys: ['state_v_azeez'],
    crimeTypeDetected: 'Social Media Video-Call Sextortion',
    riskLevel: 'low', riskScore: 10,
    riskFactors: ['Case resolved — rapid reporting enabled fast resolution, a model case for victim-response time'],
    keyFacts: ['Rapid victim reporting within hours of the incident', 'Accused identified via payment account within 72 hours', 'Case concluded with arrest, chargesheet, trial, and conviction'],
    recommendations: ['Case closed — cite as a model case for rapid-response training materials', 'Archive investigation file per retention policy'],
    witnesses: [],
  },
  {
    category: 'ransomware', status: 'registered', priority: 'high', daysAgo: 2,
    victim: VICTIMS[18] + ' (Director, Zala Diagnostics)', accused: 'Unknown', accusedMode: 'Email Phishing',
    amount: 500000, location: AREAS[6],
    narrative: 'A diagnostic lab\'s patient-records server was encrypted after a staff member clicked a link in an email disguised as a lab-equipment vendor invoice. The ransom note, in broken English, demands ₹5,00,000 in cryptocurrency within 96 hours, threatening to publish sensitive patient medical records publicly if unpaid.',
    sections: bnsSections(
      ['IT Act 66', 'Computer-related offences (unauthorized access)', 'Ransomware deployment to encrypt patient-record systems constitutes unauthorized access and damage.', 95, 'IT Act'],
      ['BNS 308(2)', 'Extortion', 'The ransom demand under threat of publishing sensitive medical data constitutes extortion.', 94, 'BNS'],
    ),
    judgmentKeys: ['gagan_harsh'],
    crimeTypeDetected: 'Healthcare Data Ransomware Extortion',
    riskLevel: 'critical', riskScore: 93,
    riskFactors: ['Threatened publication of patient medical records raises serious privacy and regulatory exposure', 'Healthcare sector targeting suggests a sophisticated, possibly repeat threat actor', 'Active countdown deadline requires urgent coordinated response'],
    keyFacts: ['Ransomware deployed via a fake lab-equipment vendor invoice email', 'Patient records server fully encrypted, 96-hour cryptocurrency ransom deadline', 'Threat to publicly leak sensitive medical data if unpaid'],
    recommendations: ['Escalate immediately to CERT-In\'s critical infrastructure/healthcare response team', 'Advise against payment; assess offline backup restoration feasibility', 'Preserve ransom note and malware sample for family/variant attribution', 'Notify data-protection regulatory obligations given sensitive health data exposure'],
    witnesses: [{ name: 'Lab IT Administrator', phone: '9825100917', statement: 'First responder to the incident, has server logs and the original phishing email.' }],
  },
  {
    category: 'other', status: 'active', priority: 'low', daysAgo: 5,
    victim: VICTIMS[19], accused: 'Unknown', accusedMode: 'Fake Website',
    amount: 12000, location: AREAS[7],
    narrative: 'Victim booked what appeared to be a discounted holiday package through a travel deals website found via a search ad, paying ₹12,000 as booking confirmation. No booking confirmation, hotel voucher, or further communication was received, and the website\'s contact number is disconnected.',
    sections: bnsSections(
      ['BNS 318(2)', 'Cheating and dishonestly inducing delivery of property', 'Payment was induced for a travel package with no genuine service ever intended to be delivered.', 74, 'BNS'],
    ),
    judgmentKeys: [],
    crimeTypeDetected: 'Fake Travel Booking Website Fraud',
    riskLevel: 'low', riskScore: 20,
    riskFactors: ['Search-ad-driven fraud suggests a wider active campaign targeting seasonal travel bookings'],
    keyFacts: ['Discounted travel package advertised via search engine ad', 'Booking payment of ₹12,000, no confirmation or service received', 'Listed contact number found disconnected'],
    recommendations: ['Report the search ad account for platform-level takedown', 'Request domain WHOIS and payment gateway merchant KYC details', 'Cross-check against national cyber crime portal for a pattern of similar complaints'],
    witnesses: [],
  },
]

// ── Full data assembly ──────────────────────────────────────────
interface Built {
  case: Case
  listItem: CaseListItem
  evidence: Evidence[]
  documents: Document[]
  diary: DiaryEntry[]
  seed: CaseSeed
}

const DOC_TEMPLATES: { type: DocumentType; title: (id: string) => string; minStatus: CaseStatus[] }[] = [
  { type: 'chargesheet', title: (id) => `Chargesheet — ${id}`, minStatus: ['chargesheet', 'court', 'closed'] },
  { type: 'panchanama', title: (id) => `Accused Panchanama — ${id}`, minStatus: ['in_review', 'chargesheet', 'court', 'closed'] },
  { type: 'seizure_receipt', title: (id) => `Evidence Seizure Receipt — ${id}`, minStatus: ['active', 'in_review', 'chargesheet', 'court', 'closed'] },
  { type: 'remand_request', title: (id) => `Remand Request Letter — ${id}`, minStatus: ['chargesheet', 'court', 'closed'] },
]

function statusRank(s: CaseStatus): number {
  return ['registered', 'active', 'in_review', 'chargesheet', 'court', 'closed'].indexOf(s)
}

function docHtml(seed: CaseSeed, caseId: string, docType: DocumentType, officerName: string): string {
  const header = `<h2>${docType.replace(/_/g, ' ').toUpperCase()}</h2><p><strong>Case No.:</strong> ${caseId} &nbsp; <strong>Police Station:</strong> Ahmedabad Cyber Crime Branch</p><hr/>`
  if (docType === 'chargesheet') {
    return header + `<p><strong>Under Sections:</strong> ${seed.sections.map(s => s.section).join(', ')}</p>
      <p><strong>Complainant:</strong> ${seed.victim}<br/><strong>Accused:</strong> ${seed.accused}</p>
      <p><strong>Facts of the Case:</strong></p><p>${seed.narrative}</p>
      <p><strong>Amount Involved:</strong> ₹${seed.amount.toLocaleString('en-IN')}</p>
      <p><strong>Investigating Officer:</strong> ${officerName}</p>
      <p>This chargesheet is filed under Section 193 BNSS after completion of investigation, supported by the evidence and witness statements on record.</p>`
  }
  if (docType === 'panchanama') {
    return header + `<p>Panchanama drawn in the presence of two independent witnesses at the time of accused apprehension / evidence seizure in connection with the above case, involving <strong>${seed.accused}</strong> under investigation for offences under ${seed.sections.map(s => s.section).join(', ')}.</p>
      <p>All items seized have been sealed, hashed, and entered into the digital evidence register with an unbroken chain of custody.</p>`
  }
  if (docType === 'seizure_receipt') {
    return header + `<p><strong>Seizure Receipt (जब्ती पावती)</strong></p><p>The following digital evidence has been seized in connection with this case and deposited with the Digital Evidence Custodian:</p>
      <ul><li>Device/media as catalogued in the Evidence Vault</li><li>SHA-256 hash verification completed at time of seizure</li></ul>
      <p>Owner/Custodian acknowledgement obtained. Receipt copy provided to the concerned party.</p>`
  }
  return header + `<p>Application for remand of accused <strong>${seed.accused}</strong> is submitted under Section 187 BNSS, on the grounds that custodial interrogation is necessary to:</p>
    <ul><li>Trace further beneficiary accounts and co-conspirators</li><li>Recover the defrauded amount of ₹${seed.amount.toLocaleString('en-IN')}</li><li>Prevent tampering with digital evidence still under analysis</li></ul>
    <p>The investigating officer submits that the accused poses a flight risk given the transnational nature of the fraud infrastructure used.</p>`
}

function buildCase(seed: CaseSeed): Built {
  const caseId = nextCaseId()
  const id = `demo-${caseId.replace(/\//g, '-')}`
  const created = daysAgo(seed.daysAgo)
  const firDate = daysAgo(seed.daysAgo)
  const analyzedAt = hoursAfter(created, 2)
  const updatedAt = seed.status === 'registered' ? created : hoursAfter(created, seed.daysAgo > 5 ? 48 : 6)

  const judgments = seed.judgmentKeys.map(k => JUDGMENT_POOL[k])

  const ocrFields: Record<string, string> = {
    fir_number: `FIR-${1000 + seq}/${new Date(created).getFullYear()}`,
    date: new Date(firDate).toLocaleDateString('en-IN'),
    complainant_name: seed.victim,
    phone: `98251${String(1000 + seq).padStart(5, '0')}`,
    address: seed.location,
    amount: String(seed.amount),
    accused_name: seed.accused,
    police_station: 'Ahmedabad Cyber Crime Branch',
  }
  const ocrText = `FIRST INFORMATION REPORT\nP.S.: Ahmedabad Cyber Crime Branch\nFIR No.: ${ocrFields.fir_number}  Date: ${ocrFields.date}\n\nComplainant: ${seed.victim}\nAddress: ${seed.location}\nContact: ${ocrFields.phone}\n\nBrief Facts:\n${seed.narrative}\n\nAmount Involved: Rs. ${seed.amount}/-\nAccused: ${seed.accused}\n\n(Signature of Complainant)                    (Signature of Duty Officer)`

  const caseObj: Case = {
    id,
    case_id: caseId,
    fir_number: ocrFields.fir_number,
    fir_date: firDate,
    fir_ocr_text: ocrText,
    fir_ocr_fields: ocrFields,
    police_station: 'Ahmedabad Cyber Crime Branch',
    crime_category: seed.category,
    status: seed.status,
    priority: seed.priority,
    victim_name: seed.victim,
    victim_phone: ocrFields.phone,
    victim_address: seed.location,
    victim_age: 24 + (seq * 7) % 45,
    amount_defrauded: seed.amount,
    accused_name: seed.accused,
    accused_phone: seed.accused === 'Unknown' ? undefined : `98251${String(2000 + seq).padStart(5, '0')}`,
    accused_address: seed.accused === 'Unknown' ? undefined : 'Address under verification',
    accused_mode: seed.accusedMode,
    witnesses: seed.witnesses,
    incident_description: seed.narrative,
    incident_location: seed.location,
    incident_date: firDate,
    ai_sections: seed.sections,
    ai_judgments: judgments,
    ai_analyzed_at: analyzedAt,
    io_officer_id: DEMO_OFFICER.id,
    created_at: created,
    updated_at: updatedAt,
    evidence_count: 0,
    document_count: 0,
    diary_count: 0,
    witness_count: seed.witnesses.length,
  }

  // Evidence
  const evTypes: { type: EvidenceType; category: EvidenceCategory; name: string; tags: string[] }[] = [
    { type: 'screenshot', category: 'critical', name: 'transaction_screenshot.jpg', tags: ['payment', 'proof'] },
    { type: 'chat_export', category: 'primary', name: 'whatsapp_chat_export.txt', tags: ['communication', 'accused-contact'] },
    { type: 'bank_statement', category: 'primary', name: 'bank_statement_excerpt.pdf', tags: ['financial', 'transaction-trail'] },
  ]
  const evidence: Evidence[] = evTypes.map((e, i) => {
    const evId = `${id}-ev${i + 1}`
    const uploadedAt = hoursAfter(created, 1 + i)
    const custody: CustodyEntry[] = [
      { officer_id: DEMO_OFFICER.id, officer_name: DEMO_OFFICER.name, action: 'Uploaded', timestamp: uploadedAt, notes: 'Collected from complainant during initial statement recording.' },
      { officer_id: DEMO_OFFICER.id, officer_name: DEMO_OFFICER.name, action: 'Hash Verified', timestamp: hoursAfter(uploadedAt, 1), notes: 'SHA-256 integrity check passed, sealed in digital evidence vault.' },
    ]
    return {
      id: evId,
      file_name: `${evId}_${e.name}`,
      original_name: e.name,
      file_size: 84000 + i * 152000 + (seq * 977) % 900000,
      mime_type: e.type === 'bank_statement' ? 'application/pdf' : e.type === 'chat_export' ? 'text/plain' : 'image/jpeg',
      evidence_type: e.type,
      category: e.category,
      sha256_hash: sha256Like(evId + seed.victim),
      is_verified: seed.status !== 'registered',
      description: `${e.name.replace(/_/g, ' ')} submitted in support of the complaint.`,
      ocr_text: e.type === 'screenshot' ? `UPI Transaction\nAmount: Rs. ${seed.amount}\nStatus: Success\nRef No: ${sha256Like(evId).slice(0, 12).toUpperCase()}` : undefined,
      ai_analysis: { relevance_summary: `Corroborates the ${seed.crimeTypeDetected.toLowerCase()} narrative — establishes ${e.type === 'bank_statement' ? 'the fund flow to the beneficiary account' : e.type === 'chat_export' ? 'direct communication with the accused persona' : 'the fraudulent transaction amount and timestamp'}.`, key_points: [seed.crimeTypeDetected], suggested_tags: e.tags },
      tags: e.tags,
      custody_chain: custody,
      created_at: uploadedAt,
    }
  })

  // Documents
  const documents: Document[] = DOC_TEMPLATES
    .filter(t => statusRank(seed.status) >= statusRank(t.minStatus[0]))
    .map((t, i) => {
      const docId = `${id}-doc${i + 1}`
      return {
        id: docId,
        doc_type: t.type,
        title: t.title(caseId),
        content_html: docHtml(seed, caseId, t.type, DEMO_OFFICER.name),
        is_reviewed: seed.status === 'court' || seed.status === 'closed',
        created_at: hoursAfter(created, 24 + i * 12),
      }
    })

  // Diary
  const diary: DiaryEntry[] = []
  const pushDiary = (type: DiaryEntryType, title: string, desc: string, when: string) =>
    diary.push({ id: `${id}-diary${diary.length + 1}`, entry_type: type, title, description: desc, is_automated: true, created_at: when })

  pushDiary('fir_registered', 'FIR Registered', `Case ${caseId} registered based on complaint from ${seed.victim}.`, created)
  pushDiary('ai_analysis', 'AI Legal Analysis Completed', `${seed.sections.length} applicable section(s) identified with an average confidence of ${Math.round(seed.sections.reduce((s, x) => s + x.confidence, 0) / seed.sections.length)}%.`, analyzedAt)
  evidence.forEach((ev) => pushDiary('evidence_upload', 'Evidence Uploaded', `${ev.original_name} added to the case file and hash-verified.`, ev.created_at))
  if (statusRank(seed.status) >= statusRank('active') && seed.status !== 'registered') {
    pushDiary('status_change', 'Case Status Updated', `Status changed to "${seed.status.replace('_', ' ')}" following review of collected evidence.`, hoursAfter(created, 30))
  }
  documents.forEach(d => pushDiary('document_generated', `${d.title.split(' — ')[0]} Generated`, `Document auto-populated from case data and reviewed by the investigating officer.`, d.created_at))
  if (seed.status === 'court' || seed.status === 'closed') {
    pushDiary('court_submission', 'Submitted to Court', `Chargesheet and supporting documents submitted to the Metropolitan Magistrate Court.`, hoursAfter(created, seed.daysAgo > 20 ? seed.daysAgo * 12 : 200))
  }
  if (seed.status === 'closed') {
    pushDiary('note', 'Case Closed', `Investigation concluded. Final disposition recorded and case archived.`, hoursAfter(created, seed.daysAgo * 20))
  }
  diary.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  caseObj.evidence_count = evidence.length
  caseObj.document_count = documents.length
  caseObj.diary_count = diary.length

  const listItem: CaseListItem = {
    id, case_id: caseId, fir_number: caseObj.fir_number, crime_category: caseObj.crime_category,
    status: caseObj.status, priority: caseObj.priority, victim_name: caseObj.victim_name,
    accused_name: caseObj.accused_name, amount_defrauded: caseObj.amount_defrauded, created_at: caseObj.created_at,
  }

  return { case: caseObj, listItem, evidence, documents, diary, seed }
}

const BUILT: Built[] = CASE_SEEDS.map(buildCase)

export const DEMO_CASES: Case[] = BUILT.map(b => b.case)
export const DEMO_CASE_LIST: CaseListItem[] = BUILT.map(b => b.listItem)

const CASE_BY_ID = new Map(BUILT.map(b => [b.case.case_id, b]))

export function getDemoCaseDetail(caseId: string): Case | undefined {
  return CASE_BY_ID.get(caseId)?.case
}
export function getDemoEvidence(caseId: string): Evidence[] {
  return CASE_BY_ID.get(caseId)?.evidence || []
}
export function getDemoEvidenceItem(evidenceId: string): Evidence | undefined {
  for (const b of BUILT) {
    const found = b.evidence.find(e => e.id === evidenceId)
    if (found) return found
  }
  return undefined
}
export function getDemoDocuments(caseId: string): Document[] {
  return CASE_BY_ID.get(caseId)?.documents || []
}
export function getDemoDiary(caseId: string): DiaryEntry[] {
  return CASE_BY_ID.get(caseId)?.diary || []
}

// ── Aggregates (derived from DEMO_CASES so they're always consistent) ──
export function getDemoCaseStats() {
  const total = DEMO_CASES.length
  const active = DEMO_CASES.filter(c => c.status === 'active').length
  const pending_review = DEMO_CASES.filter(c => c.status === 'in_review').length
  const closed = DEMO_CASES.filter(c => c.status === 'closed').length
  return { total, active, pending_review, closed }
}

export function getDemoOverview() {
  return {
    total_cases: DEMO_CASES.length,
    active_cases: DEMO_CASES.filter(c => c.status === 'active').length,
    closed_cases: DEMO_CASES.filter(c => c.status === 'closed').length,
    total_documents_generated: BUILT.reduce((s, b) => s + b.documents.length, 0),
    total_evidence_files: BUILT.reduce((s, b) => s + b.evidence.length, 0),
    total_amount_defrauded: DEMO_CASES.reduce((s, c) => s + c.amount_defrauded, 0),
  }
}

export function getDemoCrimeDistribution() {
  const counts = new Map<string, number>()
  for (const c of DEMO_CASES) counts.set(c.crime_category, (counts.get(c.crime_category) || 0) + 1)
  return Array.from(counts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
}

export function getDemoWeeklyTrend() {
  const days: { day: string; cases: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(NOW - i * DAY)
    const key = dayStart.toISOString().slice(0, 10)
    const count = DEMO_CASES.filter(c => new Date(c.created_at).toISOString().slice(0, 10) === key).length
    days.push({ day: key, cases: count })
  }
  return days
}

export function getDemoDocumentStats() {
  const counts = new Map<string, number>()
  for (const b of BUILT) for (const d of b.documents) counts.set(d.doc_type, (counts.get(d.doc_type) || 0) + 1)
  return Array.from(counts.entries())
    .map(([doc_type, count]) => ({ doc_type, count }))
    .sort((a, b) => b.count - a.count)
}

export function getDemoRecentActivity(limit = 10) {
  const all = BUILT.flatMap(b => b.diary.map(d => ({ ...d, case_id: b.case.case_id })))
  return all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, limit)
}

export function getDemoJudgmentSearch(query: string): { judgments: Judgment[]; message: string | null } {
  const q = query.toLowerCase()
  const all = Object.values(JUDGMENT_POOL)
  const matched = all.filter(j =>
    j.title.toLowerCase().includes(q) || j.summary.toLowerCase().includes(q) || j.legal_relevance.toLowerCase().includes(q)
  )
  const results = (matched.length > 0 ? matched : all.slice(0, 3)).sort((a, b) => b.relevance_score - a.relevance_score)
  return { judgments: results, message: null }
}

// ── AI analysis / chat / cyber-detection (stateless — safe to keep "live") ──
function findBySeedKeyword(text: string) {
  const q = text.toLowerCase()
  return BUILT.find(b =>
    q.includes(b.seed.category.replace('_', ' ')) ||
    b.seed.crimeTypeDetected.toLowerCase().split(' ').some(w => w.length > 4 && q.includes(w)) ||
    b.seed.accusedMode.toLowerCase().split(' ').some(w => w.length > 4 && q.includes(w))
  )
}

function analysisFromBuilt(b: Built): AIAnalysisResult {
  const { seed, case: c } = b
  const entities = {
    victims: [{ name: seed.victim, details: seed.location }],
    suspects: seed.accused === 'Unknown' ? [] : [{ name: seed.accused, details: seed.accusedMode }],
    witnesses: seed.witnesses.map(w => ({ name: w.name, details: w.statement })),
  }
  const timeline = [
    { date: new Date(c.incident_date || c.created_at).toLocaleDateString('en-IN'), description: 'Incident occurred as described in the complaint.' },
    { date: new Date(c.created_at).toLocaleDateString('en-IN'), description: `FIR registered, case ${c.case_id} opened.` },
    { date: new Date(c.ai_analyzed_at || c.created_at).toLocaleDateString('en-IN'), description: `AI legal analysis completed — ${seed.sections.length} section(s) identified.` },
  ]
  return {
    sections: seed.sections,
    judgments: c.ai_judgments || [],
    judgments_message: (c.ai_judgments || []).length === 0 ? 'No indexed judgments available. Please ingest a real legal corpus.' : null,
    crime_type_detected: seed.crimeTypeDetected,
    key_facts: seed.keyFacts,
    entities,
    timeline,
    risk_assessment: { level: seed.riskLevel, score: seed.riskScore, factors: seed.riskFactors },
    investigation_recommendations: seed.recommendations,
    model_used: 'gemini-3.5-flash (demo)',
    analysis_time_ms: 1400 + (seq * 37) % 900,
  }
}

export function getDemoFullAnalysis(caseId?: string, firText?: string): AIAnalysisResult {
  if (caseId) {
    const built = CASE_BY_ID.get(caseId)
    if (built) return analysisFromBuilt(built)
  }
  if (firText) {
    const match = findBySeedKeyword(firText)
    if (match) return analysisFromBuilt(match)
  }
  return analysisFromBuilt(BUILT[0])
}

export function getDemoCyberAnalysis(contentType: string, content: string) {
  const match = findBySeedKeyword(content) || BUILT[Math.abs(content.length + contentType.length) % BUILT.length]
  const { seed } = match
  const highRisk = seed.riskLevel === 'high' || seed.riskLevel === 'critical'
  return {
    threat_level: seed.riskLevel === 'critical' ? 'high' : seed.riskLevel,
    crime_type: seed.crimeTypeDetected,
    indicators: [
      `Pattern matches known ${seed.crimeTypeDetected.toLowerCase()} cases in the demo corpus`,
      contentType === 'url' ? 'Domain/URL structure inconsistent with the claimed legitimate service' : 'Urgency and authority-impersonation language detected',
      highRisk ? 'Matches a high-confidence fraud signature' : 'Low-to-moderate confidence pattern match',
    ],
    applicable_sections: seed.sections.map(s => s.section),
    evidence_to_preserve: ['Screenshot of the message/page with visible timestamp', 'Full sender ID / URL / phone number', 'Any transaction reference or account numbers mentioned'],
    investigation_steps: seed.recommendations.slice(0, 3),
  }
}

const CHAT_REPLIES: { keywords: string[]; reply: string }[] = [
  { keywords: ['bns', 'section', 'remote access'], reply: 'For remote-access-tool fraud (AnyDesk/TeamViewer style cases), **IT Act Section 66** (unauthorized access) is the primary charge, typically paired with **BNS 318(4)** (cheating by personation) since the accused usually impersonates bank support first to get the victim to install the tool.' },
  { keywords: ['chargesheet', 'file'], reply: 'A chargesheet is filed under **Section 193 BNSS** once investigation is complete. It should include: the FIR, victim/accused statements, seized digital evidence with hash verification, the AI-generated legal section analysis, and any recovered-amount documentation. Use the **Documents** page to auto-generate a chargesheet draft from the case data.' },
  { keywords: ['evidence', 'admissib', 'bsa', '63'], reply: '**BSA Section 63** (equivalent to the old IT Act Section 65B) requires a certificate of authenticity for electronic evidence — screenshots, call records, chat exports — before they\'re admissible in court. The **Anvar P.V. vs. P.K. Basheer** judgment is the leading precedent on this requirement.' },
  { keywords: ['remand', '187'], reply: '**Section 187 BNSS** governs remand procedure. Police custody can be sought for up to 15 days within the first 40/60 days of the 60/90-day investigation window (depending on the offence), commonly justified in cyber cases by the need to trace further beneficiary accounts or co-conspirators before evidence is lost.' },
]

export function getDemoChatReply(messages: { role: string; content: string }[], caseId?: string): string {
  const lastUser = [...messages].reverse().find(m => m.role === 'user')?.content?.toLowerCase() || ''
  const matched = CHAT_REPLIES.find(r => r.keywords.some(k => lastUser.includes(k)))
  if (matched) return matched.reply
  if (caseId) {
    const built = CASE_BY_ID.get(caseId)
    if (built) {
      return `Based on Case ${caseId} (${built.seed.crimeTypeDetected}), the strongest applicable section is **${built.seed.sections[0]?.section}** (${built.seed.sections[0]?.title}) at ${built.seed.sections[0]?.confidence}% confidence. Ask me about chargesheet filing, evidence admissibility, or remand procedure for more specific guidance.`
    }
  }
  return 'I can help with applicable BNS/BNSS/IT Act sections, evidence admissibility under the BSA, chargesheet procedure, or remand applications. Try asking about a specific topic, or select a case above for context-specific guidance.'
}
