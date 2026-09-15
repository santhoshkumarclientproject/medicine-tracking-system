export type Language = "en" | "ta" | "hi";

export interface Translations {
  [key: string]: {
    en: string;
    ta: string;
    hi: string;
  };
}

export const translations: Translations = {
  // Brand & Nav
  crmTitle: {
    en: "Clinical Adherence & Escalations",
    ta: "மருத்துவ பின்பற்றுதல் மற்றும் எச்சரிக்கைகள்",
    hi: "चिकित्सीय अनुपालन और अलर्ट प्रणाली",
  },
  todayIntake: {
    en: "Today's Intake",
    ta: "இன்றைய மருந்துகள்",
    hi: "आज की दवाएं",
  },
  myMedications: {
    en: "My Medications",
    ta: "எனது மருந்துகள்",
    hi: "मेरी दवाएं",
  },
  adherenceReports: {
    en: "Adherence & Reports",
    ta: "பின்பற்றுதல் அறிக்கைகள்",
    hi: "अनुपालन रिपोर्ट",
  },
  careCircle: {
    en: "Care Circle",
    ta: "பாதுகாப்பு வட்டம்",
    hi: "देखभाल सर्कल",
  },
  clinicalChat: {
    en: "Clinical Chat",
    ta: "மருத்துவ உரையாடல்",
    hi: "चिकित्सीय चैट",
  },
  telehealthCall: {
    en: "Telehealth Call",
    ta: "தொலை மருத்துவ அழைப்பு",
    hi: "टेलीहेल्थ कॉल",
  },
  patientRoster: {
    en: "Patient Roster",
    ta: "நோயாளிகள் பட்டியல்",
    hi: "मरीजों की सूची",
  },
  clinicalAlerts: {
    en: "Clinical Alerts",
    ta: "மருத்துவ எச்சரிக்கைகள்",
    hi: "चिकित्सीय अलर्ट",
  },
  careDashboard: {
    en: "Care Dashboard",
    ta: "பராமரிப்பு பலகை",
    hi: "देखभाल डैशबोर्ड",
  },
  signOut: {
    en: "Sign Out",
    ta: "வெளியேறு",
    hi: "लॉग आउट",
  },
  signIn: {
    en: "Sign In",
    ta: "உள்நுழைக",
    hi: "साइन इन करें",
  },

  // Daily Record Showcase
  dailyRecordShowcase: {
    en: "Daily Medication Record & Timeline",
    ta: "தினசரி மருந்து உட்கொள்ளல் பதிவேடு",
    hi: "दैनिक दवा रिकॉर्ड और समय-सारणी",
  },
  dailyRecordSubtitle: {
    en: "Real-time daily intake timeline, adherence monitoring, and multi-language verification.",
    ta: "நிகழ்நேர தினசரி உட்கொள்ளல் காலவரிசை, இணக்கக் கண்காணிப்பு மற்றும் பன்மொழி சரிபார்ப்பு.",
    hi: "वास्तविक समय दैनिक सेवन समयरेखा, अनुपालन निगरानी और बहुभाषी सत्यापन।",
  },
  morningDoses: {
    en: "Morning (06:00 - 12:00)",
    ta: "காலை மருந்துகள் (06:00 - 12:00)",
    hi: "सुबह की दवाएं (06:00 - 12:00)",
  },
  afternoonDoses: {
    en: "Afternoon (12:00 - 17:00)",
    ta: "மதிய மருந்துகள் (12:00 - 17:00)",
    hi: "दोपहर की दवाएं (12:00 - 17:00)",
  },
  eveningDoses: {
    en: "Evening (17:00 - 21:00)",
    ta: "மாலை மருந்துகள் (17:00 - 21:00)",
    hi: "शाम की दवाएं (17:00 - 21:00)",
  },
  nightDoses: {
    en: "Night (21:00+)",
    ta: "இரவு மருந்துகள் (21:00+)",
    hi: "रात की दवाएं (21:00+)",
  },

  // Stats
  sevenDayAdherence: {
    en: "7-Day Adherence",
    ta: "7-நாள் மருந்து பின்பற்றுதல்",
    hi: "7-दिवसीय दवा अनुपालन",
  },
  complianceRate: {
    en: "compliance",
    ta: "இணக்கம்",
    hi: "अनुपालन दर",
  },
  currentStreak: {
    en: "Current Streak",
    ta: "தொடர் நாட்கள்",
    hi: "दैनिक सिलसिला",
  },
  days: {
    en: "Days",
    ta: "நாட்கள்",
    hi: "दिन",
  },
  dosesTaken: {
    en: "Doses Taken",
    ta: "உட்கொண்ட மருந்துகள்",
    hi: "ली गई खुराकें",
  },
  ofDoses: {
    en: "of",
    ta: "மொத்தத்தில்",
    hi: "में से",
  },
  escalationEngine: {
    en: "Escalation Engine",
    ta: "எச்சரிக்கை இயந்திரம்",
    hi: "एस्केलेशन इंजन",
  },
  activeGuarded: {
    en: "Active & Guarded",
    ta: "செயலில் & பாதுகாப்பில்",
    hi: "सक्रिय और सुरक्षित",
  },

  // Actions & Status
  markTaken: {
    en: "Mark Taken",
    ta: "எடுத்துக்கொண்டேன்",
    hi: "ले लिया",
  },
  skip: {
    en: "Skip",
    ta: "தவிர்",
    hi: "छोड़ें",
  },
  statusTaken: {
    en: "TAKEN",
    ta: "எடுக்கப்பட்டது",
    hi: "लिया गया",
  },
  statusMissed: {
    en: "MISSED",
    ta: "தவறியது",
    hi: "छूट गया",
  },
  statusSkipped: {
    en: "SKIPPED",
    ta: "தவிர்க்கப்பட்டது",
    hi: "छोड़ दिया",
  },
  statusDue: {
    en: "DUE NOW",
    ta: "இப்போது எடுக்க வேண்டும்",
    hi: "अब लेना है",
  },
  dosage: {
    en: "Dosage",
    ta: "அளவு",
    hi: "खुराक",
  },
  scheduledAt: {
    en: "Scheduled At",
    ta: "திட்டமிடப்பட்ட நேரம்",
    hi: "निर्धारित समय",
  },
  recordedAt: {
    en: "Taken at",
    ta: "உட்கொண்ட நேரம்",
    hi: "लेने का समय",
  },
  addMedication: {
    en: "Add Medication",
    ta: "புதிய மருந்து சேர்",
    hi: "नई दवा जोड़ें",
  },
  offlineMode: {
    en: "Offline PWA Mode (Queued for Sync)",
    ta: "ஆஃப்லைன் முறை (இணையம் வந்ததும் ஒத்திசைக்கப்படும்)",
    hi: "ऑफ़लाइन मोड (पुनः कनेक्ट होने पर सिंक होगा)",
  },
  goodDay: {
    en: "Good day",
    ta: "வணக்கம்",
    hi: "नमस्ते",
  },
  allCaughtUp: {
    en: "No pending doses scheduled.",
    ta: "எடுக்க வேண்டிய மருந்துகள் ஏதுமில்லை.",
    hi: "कोई लंबित खुराक निर्धारित नहीं है।",
  },

  // Call Room
  callSessionTitle: {
    en: "Telehealth Audio & Video Session",
    ta: "தொலை மருத்துவ ஆடியோ & வீடியோ அமர்வு",
    hi: "टेलीहेल्थ ऑडियो और वीडियो सत्र",
  },
  encryptedBadge: {
    en: "256-BIT ENCRYPTED",
    ta: "256-பிட் என்க்ரிப்ட் செய்யப்பட்டது",
    hi: "256-बिट एन्क्रिप्टेड",
  },
  connectedWith: {
    en: "Connected with",
    ta: "இணைக்கப்பட்டுள்ளவர்",
    hi: "जुड़े हुए हैं",
  },
  mute: {
    en: "Mute",
    ta: "ஒலி நிறுத்து",
    hi: "म्यूट करें",
  },
  unmute: {
    en: "Unmute",
    ta: "ஒலி இயக்கு",
    hi: "अनम्यूट करें",
  },
  startVideo: {
    en: "Start Video",
    ta: "வீடியோ தொடங்கு",
    hi: "वीडियो शुरू करें",
  },
  stopVideo: {
    en: "Stop Video",
    ta: "வீடியோ நிறுத்து",
    hi: "वीडियो बंद करें",
  },
  shareScreen: {
    en: "Share Screen",
    ta: "திரையைப் பகிர்",
    hi: "स्क्रीन साझा करें",
  },
  endCall: {
    en: "End Call",
    ta: "அழைப்பை முடி",
    hi: "कॉल समाप्त करें",
  },
  consultationNotes: {
    en: "Consultation Notes",
    ta: "ஆலோசனை குறிப்புகள்",
    hi: "परामर्श नोट्स",
  },
  saveNotes: {
    en: "Save Notes",
    ta: "குறிப்புகளைச் சேமி",
    hi: "नोट्स सहेजें",
  },
};
