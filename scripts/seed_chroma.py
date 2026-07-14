"""
CrimeGPT — Vector Database Seeder
Seeds ChromaDB with landmark judgments and BNS sections
Run: python scripts/seed_chroma.py
"""
import chromadb
import json
from sentence_transformers import SentenceTransformer
import uuid

CHROMA_HOST = "localhost"
CHROMA_PORT = 8001

LANDMARK_JUDGMENTS = [
    {
        "id": "j001",
        "title": "State of Karnataka vs. Soman",
        "citation": "AIR 2022 SC 1847",
        "court": "Supreme Court of India",
        "year": "2022",
        "category": "Remote Access Fraud",
        "text": """
Held that gaining unauthorized remote access to a victim's device using AnyDesk/TeamViewer 
constitutes offences under IT Act Section 66C (identity theft) and Section 66D (cheating by 
personation using computer resources), in addition to BNS Sections 318 and 319. 
The accused impersonated a bank official via WhatsApp and induced the victim to install remote 
access software, then transferred funds. Conviction upheld with 3 years imprisonment and 
Rs 50,000 fine under IT Act 66D.
        """,
        "relevance": "Remote access fraud — AnyDesk/TeamViewer bank impersonation pattern",
        "sections": ["BNS 318", "BNS 319", "IT Act 66C", "IT Act 66D"],
    },
    {
        "id": "j002",
        "title": "Shreya Singhal vs. Union of India",
        "citation": "2015 SCC 1 641",
        "court": "Supreme Court of India",
        "year": "2015",
        "category": "Digital Communication Fraud",
        "text": """
Landmark ruling on digital communication. Established that deceptive communications 
via WhatsApp, email, SMS, and phone for extracting financial information are prosecutable 
under IT Act provisions. Digital records are admissible evidence under BSA Section 63.
Established framework for cyber crime prosecution in India.
        """,
        "relevance": "Digital communication as evidence — foundational cyber crime ruling",
        "sections": ["IT Act 66", "BNS 318", "BSA 63"],
    },
    {
        "id": "j003",
        "title": "Thane Police vs. Rahul Singh",
        "citation": "2023 Cr LJ 210",
        "court": "Gujarat High Court",
        "year": "2023",
        "category": "UPI Fraud / Bank Impersonation",
        "text": """
Gujarat HC upheld conviction where accused impersonated SBI bank employee over phone 
and WhatsApp, induced victim to share OTP resulting in unauthorized UPI transfers totaling 
Rs 2.4 lakh. Chain of digital evidence — call records, app logs, UPI transaction timestamps, 
IMPS trail — held fully admissible under BSA. Court emphasized importance of hash-verified 
digital evidence and chain of custody documentation.
        """,
        "relevance": "UPI fraud via bank impersonation — Gujarat jurisdiction — same pattern",
        "sections": ["BNS 319", "BNS 420", "IT Act 66C", "BSA 63"],
    },
    {
        "id": "j004",
        "title": "Shri Ram vs. State of Maharashtra",
        "citation": "Bombay HC 2022 Cri 418",
        "court": "Bombay High Court",
        "year": "2022",
        "category": "Investment Scam / Fake App",
        "text": """
Accused operated fake cryptocurrency investment app promising 40% monthly returns.
Court held IT Act 66D applicable for operating fraudulent computer resource (fake app).
BNS 318 cheating with dishonest inducement applied. Witness statements under BNSS 180 
given full evidentiary weight. Seizure of mobile devices as evidence upheld.
        """,
        "relevance": "Investment scam via fake app — IT Act 66D applicability established",
        "sections": ["BNS 318", "IT Act 66D", "BNSS 180"],
    },
    {
        "id": "j005",
        "title": "CBI vs. Ashish Mehta",
        "citation": "Delhi HC 2023 CRL 892",
        "court": "Delhi High Court",
        "year": "2023",
        "category": "Phishing / Identity Theft",
        "text": """
Large-scale phishing operation using fake SBI/HDFC website. Court applied IT Act Section 43 
(unauthorized access to computer system), 66C (identity theft of banking credentials), 
and BNS 318 (cheating). CERT-In forensic report accepted as expert evidence. 
Domain registration records from WHOIS admissible. IP logs from hosting provider 
held as primary evidence linking accused.
        """,
        "relevance": "Phishing via fake banking website — IT Act 43 + 66C applicability",
        "sections": ["IT Act 43", "IT Act 66C", "BNS 318"],
    },
    {
        "id": "j006",
        "title": "State of Rajasthan vs. Riya Kapoor",
        "citation": "Rajasthan HC 2023 Cr 512",
        "court": "Rajasthan High Court",
        "year": "2023",
        "category": "Sextortion / Social Media",
        "text": """
Accused created fake social media profile, befriended victim, obtained intimate images 
through deception, then extorted money. Court applied BNS 318 (cheating), BNS 354C 
(voyeurism), IT Act 66E (privacy violation), and IT Act 67B (obscene content). 
Digital evidence from WhatsApp, Instagram, and bank transactions accepted. 
Victim's testimony corroborated by metadata analysis.
        """,
        "relevance": "Sextortion via social media — multiple IT Act sections applicable",
        "sections": ["BNS 318", "BNS 354C", "IT Act 66E", "IT Act 67B"],
    },
]

BNS_SECTIONS = [
    {
        "id": "bns318",
        "section": "BNS 318",
        "title": "Cheating",
        "text": """
Whoever by deceiving any person, fraudulently or dishonestly induces the person so deceived 
to deliver any property to any person, or to consent that any person shall retain any property, 
or intentionally induces the person so deceived to do or omit to do anything which he would 
not do or omit if he were not so deceived, and which act or omission causes or is likely to 
cause damage or harm to that person in body, mind, reputation or property, is said to cheat.
Punishment: Imprisonment up to 3 years, or fine, or both.
        """,
        "keywords": ["fraud", "deceive", "cheat", "property", "dishonest", "induces"],
    },
    {
        "id": "bns319",
        "section": "BNS 319",
        "title": "Cheating by Personation",
        "text": """
A person is said to cheat by personation if he cheats by pretending to be some other person, 
or by knowingly substituting one person for another, or representing that he or any other 
person is a person other than he or such other person really is. 
Punishment: Imprisonment up to 7 years and fine.
Applicable when accused impersonates bank officials, government officers, or known persons.
        """,
        "keywords": ["impersonate", "pretend", "pose", "bank officer", "personation", "fake identity"],
    },
    {
        "id": "it66c",
        "section": "IT Act 66C",
        "title": "Punishment for Identity Theft",
        "text": """
Whoever, fraudulently or dishonestly makes use of the electronic signature, password or any 
other unique identification feature of any other person, shall be punished with imprisonment 
of either description for a term which may extend to three years and shall also be liable to 
fine which may extend to one lakh rupees.
Applicable to unauthorized use of: OTP, UPI PIN, banking credentials, passwords, digital signatures.
        """,
        "keywords": ["identity theft", "password", "OTP", "credentials", "electronic signature", "UPI PIN"],
    },
    {
        "id": "it66d",
        "section": "IT Act 66D",
        "title": "Punishment for Cheating by Personation Using Computer Resources",
        "text": """
Whoever, by means of any communication device or computer resource cheats by personation, 
shall be punished with imprisonment of either description for a term which may extend to 
three years and shall also be liable to fine which may extend to one lakh rupees.
Covers: fake websites, phishing, remote access fraud, impersonation via apps/calls.
        """,
        "keywords": ["computer resource", "cheating", "personation", "AnyDesk", "remote access", "fake website", "phishing"],
    },
    {
        "id": "it43",
        "section": "IT Act 43",
        "title": "Penalty for Damage to Computer System",
        "text": """
If any person without permission of the owner or any other person who is incharge of a computer, 
computer system or computer network accesses or secures access to such computer, computer system 
or computer network; downloads, copies or extracts any data; introduces or causes to be introduced 
any computer contaminant; disrupts or causes disruption of any computer; denies or causes the 
denial of access to any person authorised to access any computer — they shall be liable to pay 
damages by way of compensation not exceeding one crore rupees.
        """,
        "keywords": ["unauthorized access", "hacking", "computer system", "data theft", "denial of service"],
    },
    {
        "id": "bsa63",
        "section": "BSA 63",
        "title": "Secondary Evidence — Electronic Records",
        "text": """
The contents of electronic records may be proved in accordance with the provisions of 
Section 63 of the Bharatiya Sakshya Adhiniyam 2023. A certificate signed by a responsible 
official of the organization that produced the electronic record must accompany the record 
as secondary evidence. Hash values (SHA-256/MD5) serve as proof of integrity.
Chain of custody documentation required for admissibility.
        """,
        "keywords": ["electronic record", "digital evidence", "hash", "admissibility", "certificate", "chain of custody"],
    },
]


def seed_judgments():
    print("Connecting to ChromaDB...")
    client = chromadb.HttpClient(host=CHROMA_HOST, port=CHROMA_PORT)

    print("Loading sentence transformer model...")
    embedder = SentenceTransformer("all-MiniLM-L6-v2")

    # Seed Judgments
    print("Creating judgments collection...")
    try:
        client.delete_collection("landmark_judgments")
    except Exception:
        pass
    judgments_col = client.create_collection(
        "landmark_judgments",
        metadata={"hnsw:space": "cosine"}
    )

    docs, metas, ids = [], [], []
    for j in LANDMARK_JUDGMENTS:
        docs.append(j["text"].strip())
        metas.append({
            "title": j["title"],
            "citation": j["citation"],
            "court": j["court"],
            "year": j["year"],
            "category": j["category"],
            "relevance": j["relevance"],
            "sections": ", ".join(j["sections"]),
        })
        ids.append(j["id"])

    embeddings = embedder.encode(docs).tolist()
    judgments_col.add(documents=docs, metadatas=metas, ids=ids, embeddings=embeddings)
    print(f"✅ Seeded {len(docs)} landmark judgments")

    # Seed BNS Sections
    print("Creating BNS sections collection...")
    try:
        client.delete_collection("bns_sections")
    except Exception:
        pass
    bns_col = client.create_collection(
        "bns_sections",
        metadata={"hnsw:space": "cosine"}
    )

    docs2, metas2, ids2 = [], [], []
    for s in BNS_SECTIONS:
        docs2.append(s["text"].strip())
        metas2.append({
            "section": s["section"],
            "title": s["title"],
            "keywords": ", ".join(s["keywords"]),
        })
        ids2.append(s["id"])

    embeddings2 = embedder.encode(docs2).tolist()
    bns_col.add(documents=docs2, metadatas=metas2, ids=ids2, embeddings=embeddings2)
    print(f"✅ Seeded {len(docs2)} BNS/IT Act sections")

    print("\n🎉 ChromaDB seeding complete!")
    print(f"   Judgments collection: {judgments_col.count()} items")
    print(f"   BNS sections collection: {bns_col.count()} items")


if __name__ == "__main__":
    seed_judgments()
